-- Run only in the Supabase SQL Editor as project owner, after signing into Kolab.
-- Replace the verified email below. Browser clients cannot grant this role.
do $$
declare admin_id uuid;
begin
  select id into strict admin_id from auth.users
    where lower(email) = lower('REPLACE_WITH_YOUR_VERIFIED_EMAIL') and email_confirmed_at is not null;
  insert into kolab_private.admin_users(user_id) values(admin_id) on conflict do nothing;
end $$;
