-- 0006_admin.sql — audit logs, editable content pages, system settings.

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) between 2 and 80),
  entity_type text not null default '',
  entity_id text not null default '',
  -- Compact before/after summary — never raw user data or images.
  summary jsonb not null default '{}'::jsonb,
  request_id text not null default '',
  created_at timestamptz not null default now()
);

create index idx_admin_audit_logs_created on public.admin_audit_logs (created_at desc);
create index idx_admin_audit_logs_actor on public.admin_audit_logs (actor_user_id);

create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  title text not null check (char_length(title) between 2 and 160),
  body_markdown text not null default '',
  is_published boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_content_pages_updated_at
  before update on public.content_pages
  for each row execute function public.set_updated_at();

create table public.system_settings (
  key text primary key check (key ~ '^[a-z0-9_.]{2,80}$'),
  value jsonb not null,
  description text not null default '',
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();
