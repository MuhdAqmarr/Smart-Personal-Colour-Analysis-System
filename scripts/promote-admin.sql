-- Promote a user to administrator by email.
-- Run in the Supabase SQL editor (or psql) AFTER the user has registered:
--
--   psql "$DATABASE_URL" -v email="'owner@example.com'" -f scripts/promote-admin.sql
--
-- The admin role lives in public.profiles.role and is enforced server-side
-- (backend role check + RLS is_admin()); no JWT claim changes are needed.

update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email = :email;

select p.id, u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where u.email = :email;
