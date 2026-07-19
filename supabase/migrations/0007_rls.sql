-- 0007_rls.sql — Row Level Security for every table.
--
-- Model:
--   * The browser holds only the anon key; PostgREST requests run as role
--     `anon` (no JWT) or `authenticated` (user JWT). These policies are the
--     complete authorisation model for that surface.
--   * The FastAPI backend connects with privileged credentials and enforces
--     ownership/role checks in queries; RLS is the independent second layer.
--   * Admin capability comes from public.is_admin() (profiles.role), never
--     from client-supplied claims.
--
-- Every policy is documented inline; scripts/verify_rls.py proves the
-- required behaviours against a real PostgreSQL instance in CI.

-- ---------------------------------------------------------------- profiles
alter table public.profiles enable row level security;

-- Users can read their own profile; admins can read all (user management).
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Users may create only their own profile row (normally the auth trigger
-- does this with definer rights).
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

-- Users update their own profile (role changes blocked by trigger);
-- admins update any profile.
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Deletion happens via auth.users cascade (account deletion), not directly.

-- ------------------------------------------------------- user_preferences
alter table public.user_preferences enable row level security;

create policy user_preferences_all_own on public.user_preferences
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------- user_consents
alter table public.user_consents enable row level security;

-- Append-only event log: owners read and insert; no update/delete policies
-- (history is immutable; account deletion cascades).
create policy user_consents_select_own on public.user_consents
  for select using (user_id = auth.uid());

create policy user_consents_insert_own on public.user_consents
  for insert with check (user_id = auth.uid());

-- --------------------------------------------------------- colour_seasons
alter table public.colour_seasons enable row level security;

-- Public catalogue: anyone (including anon) reads active rows; admins read
-- everything and mutate.
create policy colour_seasons_select_public on public.colour_seasons
  for select using (is_active or public.is_admin());

create policy colour_seasons_admin_write on public.colour_seasons
  for all using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------ colour_subseasons
alter table public.colour_subseasons enable row level security;

create policy colour_subseasons_select_public on public.colour_subseasons
  for select using (is_active or public.is_admin());

create policy colour_subseasons_admin_write on public.colour_subseasons
  for all using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------- palette_colours
alter table public.palette_colours enable row level security;

create policy palette_colours_select_public on public.palette_colours
  for select using (is_active or public.is_admin());

create policy palette_colours_admin_write on public.palette_colours
  for all using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------- cosmetic_recommendations
alter table public.cosmetic_recommendations enable row level security;

create policy cosmetics_select_public on public.cosmetic_recommendations
  for select using (is_active or public.is_admin());

create policy cosmetics_admin_write on public.cosmetic_recommendations
  for all using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------- user_favourite_colours
alter table public.user_favourite_colours enable row level security;

create policy favourite_colours_all_own on public.user_favourite_colours
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------- algorithm_versions
alter table public.algorithm_versions enable row level security;

-- Version metadata is public (shown in results and the admin portal);
-- only admins mutate.
create policy algorithm_versions_select_public on public.algorithm_versions
  for select using (true);

create policy algorithm_versions_admin_write on public.algorithm_versions
  for all using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------------------- analyses
alter table public.analyses enable row level security;

-- Strictly owner-only. Deliberately NO admin read policy: administrators
-- must not browse users' analyses (spec §7.3); admin statistics come from
-- anonymised backend aggregation.
create policy analyses_select_own on public.analyses
  for select using (user_id = auth.uid());

create policy analyses_insert_own on public.analyses
  for insert with check (user_id = auth.uid());

create policy analyses_update_own on public.analyses
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy analyses_delete_own on public.analyses
  for delete using (user_id = auth.uid());

-- ------------------------------------------------ analysis_quality_metrics
alter table public.analysis_quality_metrics enable row level security;

create policy quality_metrics_own on public.analysis_quality_metrics
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id and a.user_id = auth.uid()
    )
  );

-- ------------------------------------------------- analysis_colour_samples
alter table public.analysis_colour_samples enable row level security;

create policy colour_samples_own on public.analysis_colour_samples
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id and a.user_id = auth.uid()
    )
  );

-- ----------------------------------------------- analysis_classifications
alter table public.analysis_classifications enable row level security;

create policy classifications_own on public.analysis_classifications
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id and a.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------- analysis_images
alter table public.analysis_images enable row level security;

-- Owner-only, including reads: no admin policy by design.
create policy analysis_images_own on public.analysis_images
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.analyses a
      where a.id = analysis_id and a.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------ stores
alter table public.stores enable row level security;

create policy stores_select_public on public.stores
  for select using (is_active or public.is_admin());

create policy stores_admin_write on public.stores
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------- products
alter table public.products enable row level security;

create policy products_select_public on public.products
  for select using (is_active or public.is_admin());

create policy products_admin_write on public.products
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------- product_colours
alter table public.product_colours enable row level security;

-- Readable when the parent product is publicly visible.
create policy product_colours_select_public on public.product_colours
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy product_colours_admin_write on public.product_colours
  for all using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------ product_season_tags
alter table public.product_season_tags enable row level security;

create policy product_season_tags_select_public on public.product_season_tags
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy product_season_tags_admin_write on public.product_season_tags
  for all using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------- user_favourite_products
alter table public.user_favourite_products enable row level security;

create policy favourite_products_all_own on public.user_favourite_products
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------ product_import_jobs
alter table public.product_import_jobs enable row level security;

create policy import_jobs_admin_only on public.product_import_jobs
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------- product_import_errors
alter table public.product_import_errors enable row level security;

create policy import_errors_admin_only on public.product_import_errors
  for all using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------------- admin_audit_logs
alter table public.admin_audit_logs enable row level security;

-- Admins read the trail; inserts happen via the backend service layer.
-- No update/delete policies: the log is append-only on this surface.
create policy audit_logs_admin_select on public.admin_audit_logs
  for select using (public.is_admin());

create policy audit_logs_admin_insert on public.admin_audit_logs
  for insert with check (public.is_admin());

-- ------------------------------------------------------------ content_pages
alter table public.content_pages enable row level security;

create policy content_pages_select_public on public.content_pages
  for select using (is_published or public.is_admin());

create policy content_pages_admin_write on public.content_pages
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------- system_settings
alter table public.system_settings enable row level security;

create policy system_settings_admin_only on public.system_settings
  for all using (public.is_admin())
  with check (public.is_admin());
