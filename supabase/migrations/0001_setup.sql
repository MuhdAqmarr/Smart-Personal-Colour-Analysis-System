-- 0001_setup.sql — extensions and shared helper functions.
-- Applies to Supabase PostgreSQL (production) and plain PostgreSQL 15+
-- (local development/CI via scripts/db/auth_shim.sql).

create extension if not exists pgcrypto;

-- Keeps updated_at accurate on every UPDATE. Attached per-table in later
-- migrations.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when the current JWT belongs to a profile with the admin role.
-- SECURITY DEFINER so RLS on profiles does not recurse while checking.
-- plpgsql (not sql) so the body is resolved at call time — profiles is
-- created in a later migration.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$;

comment on function public.is_admin() is
  'Server-side admin check used by RLS policies. Backend re-checks the role independently.';
