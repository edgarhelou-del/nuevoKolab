begin;

-- A signed JWT can outlive sign-out. Private RPCs also require a live session.
-- Keep this check inside PostgreSQL so direct API callers cannot bypass it.
create or replace function kolab_private.require_member() returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not exists (
    select 1 from auth.users u join auth.sessions s on s.user_id = u.id
    where u.id = uid
      and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until < now())
      and s.id = nullif(auth.jwt()->>'session_id', '')::uuid
      and (s.not_after is null or s.not_after > now())
  ) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  return uid;
end $$;

revoke all on function kolab_private.require_member() from public, anon, authenticated;
commit;
