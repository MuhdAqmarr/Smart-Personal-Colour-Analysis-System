-- 0002_users.sql — profiles, preferences, consents.

-- One row per auth user. Role is the single authorisation source of truth;
-- self-service role escalation is blocked by trigger + RLS.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  role text not null default 'user' check (role in ('user', 'admin')),
  avatar_url text check (avatar_url is null or avatar_url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Block role changes on the PostgREST surface (anon/authenticated roles)
-- unless the acting user is an admin. Privileged connections (backend,
-- migrations, service_role) are unaffected — current_user reflects the
-- SET ROLE issued per request by PostgREST.
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Changing roles requires administrator privileges';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_protect_role
  before update on public.profiles
  for each row execute function public.prevent_role_self_change();

-- Auto-create a profile (and default preferences) when an auth user appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- "Save my analysis image" default for the consent step. Off by default,
  -- per the privacy specification.
  default_image_storage boolean not null default false,
  preferred_currency char(3) not null default 'MYR',
  reduced_motion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Append-only consent event log; the newest row per (user, type) is the
-- current state. Rows are never updated.
create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent_type text not null check (
    consent_type in ('image_analysis', 'image_storage', 'questionnaire')
  ),
  granted boolean not null,
  created_at timestamptz not null default now()
);

create index idx_user_consents_lookup
  on public.user_consents (user_id, consent_type, created_at desc);

-- The trigger on auth.users: created here so a fresh Supabase project wires
-- signups automatically. Guarded for local databases where the shim already
-- created auth.users.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;
