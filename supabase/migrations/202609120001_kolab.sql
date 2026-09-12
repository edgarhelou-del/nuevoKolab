-- Apply to a dedicated Supabase project. No service-role key is used by the website.
begin;
create schema if not exists kolab_private;
revoke all on schema kolab_private from public, anon, authenticated;

create table kolab_private.network_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id uuid not null unique default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 70),
  interests text[] not null check (cardinality(interests) between 1 and 4 and interests <@ array['Cultura','Arte','Tecnología','Naturaleza']),
  visible boolean not null default false,
  updated_at timestamptz not null default now()
);
create index network_visible_recent on kolab_private.network_profiles(updated_at desc, id) where visible;
create table kolab_private.member_contacts (
  user_id uuid primary key references kolab_private.network_profiles(user_id) on delete cascade,
  phone text not null default '' check (char_length(phone) <= 32 and phone ~ '^[+0-9 ().-]*$'),
  city text not null default '' check (char_length(city) <= 80),
  role text not null default '' check (char_length(role) <= 100),
  bio text not null default '' check (char_length(bio) <= 500),
  contact_consent boolean not null default false,
  consent_at timestamptz not null default now(),
  consent_version text not null default '2026-09-12'
);
-- Email is read from verified auth.users only. It cannot be substituted by a submitted profile.
create table kolab_private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table kolab_private.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null default now(),
  attempts integer not null default 1,
  primary key(user_id, action)
);
create table kolab_private.admin_audit (
  id bigint generated always as identity primary key,
  actor uuid references auth.users(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);
create index admin_audit_date on kolab_private.admin_audit(created_at);

alter table kolab_private.network_profiles enable row level security;
alter table kolab_private.member_contacts enable row level security;
alter table kolab_private.admin_users enable row level security;
alter table kolab_private.rate_limits enable row level security;
alter table kolab_private.admin_audit enable row level security;
-- No client table grants or policies: default-deny. Narrow RPCs are the entire data interface.
revoke all on all tables in schema kolab_private from public, anon, authenticated;
revoke all on all sequences in schema kolab_private from public, anon, authenticated;
alter default privileges in schema kolab_private revoke all on tables from public, anon, authenticated;
alter default privileges in schema kolab_private revoke execute on functions from public;

create function kolab_private.require_member() returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not exists(select 1 from auth.users where id = uid and email_confirmed_at is not null and (banned_until is null or banned_until < now())) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  return uid;
end $$;

create function kolab_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from kolab_private.admin_users a join auth.users u on u.id = a.user_id
    where a.user_id = auth.uid() and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until < now()));
$$;

create function kolab_private.rate_limit(action_name text, max_attempts integer, window_seconds integer) returns void
language plpgsql security definer set search_path = '' as $$
declare count_now integer;
begin
  insert into kolab_private.rate_limits(user_id, action, attempts) values (kolab_private.require_member(), action_name, 1)
  on conflict(user_id, action) do update set
    attempts = case when kolab_private.rate_limits.window_start < now() - make_interval(secs => window_seconds) then 1 else kolab_private.rate_limits.attempts + 1 end,
    window_start = case when kolab_private.rate_limits.window_start < now() - make_interval(secs => window_seconds) then now() else kolab_private.rate_limits.window_start end
  returning attempts into count_now;
  if count_now > max_attempts then raise exception 'Rate limit exceeded' using errcode = 'P0429'; end if;
end $$;

create function public.kolab_network() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'interests', p.interests) order by p.updated_at desc, p.id)
      from (select id, name, interests, updated_at from kolab_private.network_profiles where visible order by updated_at desc, id limit 500) p), '[]'::jsonb),
    'total', (select count(*) from kolab_private.network_profiles where visible));
$$;

create function public.kolab_my_profile() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := kolab_private.require_member(); result jsonb;
begin
  select jsonb_build_object('name', n.name, 'interests', n.interests, 'visible', n.visible,
    'email', u.email, 'phone', c.phone, 'city', c.city, 'role', c.role, 'bio', c.bio, 'contactConsent', c.contact_consent)
    into result from kolab_private.network_profiles n join kolab_private.member_contacts c using(user_id) join auth.users u on u.id = n.user_id where n.user_id = uid;
  return result;
end $$;

create function public.kolab_save_profile(p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := kolab_private.require_member(); tags text[];
begin
  -- Validate again inside the DB: callers may bypass the Next.js API.
  if jsonb_typeof(p) is distinct from 'object' or pg_column_size(p) > 8192
    or not (p ?& array['name','interests','visible','phone','city','role','bio','contactConsent','consent'])
    or (p - array['name','interests','visible','phone','city','role','bio','contactConsent','consent']) <> '{}'::jsonb
    or p->'consent' is distinct from 'true'::jsonb
    or jsonb_typeof(p->'name') is distinct from 'string'
    or jsonb_typeof(p->'phone') is distinct from 'string'
    or jsonb_typeof(p->'city') is distinct from 'string'
    or jsonb_typeof(p->'role') is distinct from 'string'
    or jsonb_typeof(p->'bio') is distinct from 'string'
    or jsonb_typeof(p->'visible') is distinct from 'boolean'
    or jsonb_typeof(p->'contactConsent') is distinct from 'boolean'
    or jsonb_typeof(p->'interests') is distinct from 'array' then
    raise exception 'Invalid profile' using errcode = '22023';
  end if;
  select array_agg(value) into tags from jsonb_array_elements_text(p->'interests');
  if tags is null or cardinality(tags) not between 1 and 4 or not tags <@ array['Cultura','Arte','Tecnología','Naturaleza']
    or cardinality(tags) <> (select count(distinct t) from unnest(tags) t) then raise exception 'Invalid interests' using errcode = '22023'; end if;
  perform kolab_private.rate_limit('profile_write', 30, 3600);
  insert into kolab_private.network_profiles(user_id, name, interests, visible)
    values(uid, btrim(p->>'name'), tags, (p->>'visible')::boolean)
    on conflict(user_id) do update set name = excluded.name, interests = excluded.interests, visible = excluded.visible, updated_at = now();
  insert into kolab_private.member_contacts(user_id, phone, city, role, bio, contact_consent)
    values(uid, btrim(p->>'phone'), btrim(p->>'city'), btrim(p->>'role'), btrim(p->>'bio'), (p->>'contactConsent')::boolean)
    on conflict(user_id) do update set phone = excluded.phone, city = excluded.city, role = excluded.role,
      bio = excluded.bio, contact_consent = excluded.contact_consent, consent_at = now(), consent_version = '2026-09-12';
end $$;

create function public.kolab_delete_profile() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from kolab_private.network_profiles where user_id = kolab_private.require_member();
end $$;

create function public.kolab_admin_status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform kolab_private.require_member();
  return jsonb_build_object('admin', kolab_private.is_admin(), 'mfa', coalesce(auth.jwt()->>'aal' = 'aal2', false));
end $$;

create function public.kolab_admin_members(search_text text default '', page_number integer default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform kolab_private.require_member();
  if not kolab_private.is_admin() or (auth.jwt()->>'aal') is distinct from 'aal2' then raise exception 'Admin MFA required' using errcode = '42501'; end if;
  if search_text is null or char_length(search_text) > 100 or page_number is null or page_number not between 0 and 100000 then raise exception 'Invalid query' using errcode = '22023'; end if;
  perform kolab_private.rate_limit('admin_read', 120, 600);
  with matches as (
    select n.id, n.name, n.interests, n.visible, n.updated_at, u.email, c.phone, c.city, c.role, c.bio, c.contact_consent, c.consent_at
    from kolab_private.network_profiles n join kolab_private.member_contacts c using(user_id) join auth.users u on u.id = n.user_id
    where search_text = '' or position(lower(search_text) in lower(n.name || ' ' || u.email || ' ' || c.phone)) > 0
  ), page as (select * from matches order by updated_at desc, id limit 50 offset page_number * 50)
  select jsonb_build_object('total', (select count(*) from matches), 'members', coalesce((select jsonb_agg(jsonb_build_object(
    'id', id, 'name', name, 'interests', interests, 'visible', visible, 'email', email, 'phone', phone, 'city', city,
    'role', role, 'bio', bio, 'contactConsent', contact_consent, 'consentAt', consent_at, 'updatedAt', updated_at) order by updated_at desc, id) from page), '[]'::jsonb)) into result;
  insert into kolab_private.admin_audit(actor, action) values(auth.uid(), 'members.read');
  -- Audit never stores contacts or search terms. Bound retention to 90 days.
  delete from kolab_private.admin_audit where created_at < now() - interval '90 days';
  return result;
end $$;

revoke all on all functions in schema kolab_private from public, anon, authenticated;
revoke all on function public.kolab_network() from public, anon, authenticated;
revoke all on function public.kolab_my_profile() from public, anon, authenticated;
revoke all on function public.kolab_save_profile(jsonb) from public, anon, authenticated;
revoke all on function public.kolab_delete_profile() from public, anon, authenticated;
revoke all on function public.kolab_admin_status() from public, anon, authenticated;
revoke all on function public.kolab_admin_members(text, integer) from public, anon, authenticated;
grant execute on function public.kolab_network() to anon, authenticated;
grant execute on function public.kolab_my_profile(), public.kolab_save_profile(jsonb), public.kolab_delete_profile(), public.kolab_admin_status(), public.kolab_admin_members(text, integer) to authenticated;
commit;
