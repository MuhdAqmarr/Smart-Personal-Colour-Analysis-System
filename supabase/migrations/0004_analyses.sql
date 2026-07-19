-- 0004_analyses.sql — analysis records and derived features.
-- Guests are NEVER persisted: every row belongs to an authenticated user.
-- Original images are stored only in the private storage bucket when the
-- owner explicitly opts in (analysis_images tracks the object).

create table public.algorithm_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  name text not null,
  -- Full classifier configuration snapshot for reproducibility.
  config jsonb not null,
  notes text not null default '',
  is_active boolean not null default false,
  released_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_algorithm_versions_updated_at
  before update on public.algorithm_versions
  for each row execute function public.set_updated_at();

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  algorithm_version_id uuid references public.algorithm_versions (id) on delete set null,
  -- Denormalised so history stays interpretable even if version rows change.
  classifier_version text not null,
  -- Season/sub-season stored as slugs (not FKs) so admin palette edits can
  -- never mutate or break a user's historical result.
  undertone text not null check (undertone in ('warm', 'cool')),
  internal_undertone text not null check (
    internal_undertone in ('warm', 'cool', 'neutral', 'uncertain')
  ),
  undertone_score numeric(5, 4) not null check (undertone_score between -1 and 1),
  season_slug text not null,
  subseason_slug text,
  confidence numeric(5, 4) not null check (confidence between 0 and 1),
  confidence_label text not null check (confidence_label in ('high', 'medium', 'low')),
  processing_ms integer not null default 0 check (processing_ms >= 0),
  questionnaire jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_analyses_user_created on public.analyses (user_id, created_at desc);

create trigger trg_analyses_updated_at
  before update on public.analyses
  for each row execute function public.set_updated_at();

create table public.analysis_quality_metrics (
  analysis_id uuid primary key references public.analyses (id) on delete cascade,
  overall_score numeric(5, 2) not null check (overall_score between 0 and 100),
  acceptable boolean not null,
  face_detection numeric(5, 2) not null check (face_detection between 0 and 100),
  face_size numeric(5, 2) not null check (face_size between 0 and 100),
  pose numeric(5, 2) not null check (pose between 0 and 100),
  sharpness numeric(5, 2) not null check (sharpness between 0 and 100),
  exposure numeric(5, 2) not null check (exposure between 0 and 100),
  lighting_consistency numeric(5, 2) not null check (lighting_consistency between 0 and 100),
  colour_cast numeric(5, 2) not null check (colour_cast between 0 and 100),
  usable_skin_area numeric(5, 2) not null check (usable_skin_area between 0 and 100),
  exposure_status text not null check (
    exposure_status in (
      'acceptable', 'too_dark', 'too_bright', 'strong_shadow',
      'uneven_lighting', 'low_contrast'
    )
  ),
  colour_cast_direction text not null default 'none' check (
    colour_cast_direction in ('none', 'yellow', 'blue', 'red', 'green')
  ),
  yaw_degrees numeric(6, 2) not null default 0,
  pitch_degrees numeric(6, 2) not null default 0,
  roll_degrees numeric(6, 2) not null default 0,
  issues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.analysis_colour_samples (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  region text not null check (
    region in ('forehead', 'left_cheek', 'right_cheek', 'combined')
  ),
  r integer not null check (r between 0 and 255),
  g integer not null check (g between 0 and 255),
  b integer not null check (b between 0 and 255),
  hex char(7) not null check (hex ~ '^#[0-9a-f]{6}$'),
  hsv_h numeric(6, 2) not null,
  hsv_s numeric(5, 4) not null,
  hsv_v numeric(5, 4) not null,
  lab_l numeric(6, 2) not null,
  lab_a numeric(6, 2) not null,
  lab_b numeric(6, 2) not null,
  chroma numeric(6, 2) not null,
  hue_angle_degrees numeric(6, 2) not null,
  usable_pixel_ratio numeric(5, 4) not null check (usable_pixel_ratio between 0 and 1),
  pixel_count integer not null check (pixel_count >= 0),
  created_at timestamptz not null default now(),
  unique (analysis_id, region)
);

create index idx_analysis_colour_samples_analysis
  on public.analysis_colour_samples (analysis_id);

create table public.analysis_classifications (
  analysis_id uuid primary key references public.analyses (id) on delete cascade,
  season_scores jsonb not null,
  dim_temperature numeric(5, 4) not null check (dim_temperature between 0 and 1),
  dim_value numeric(5, 4) not null check (dim_value between 0 and 1),
  dim_chroma numeric(5, 4) not null check (dim_chroma between 0 and 1),
  dim_contrast numeric(5, 4) not null check (dim_contrast between 0 and 1),
  evidence jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  improvement_tips jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.analysis_images (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null unique references public.analyses (id) on delete cascade,
  -- Denormalised owner id: storage policies validate the first path segment
  -- against auth.uid(), and deletion services clean up by user.
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index idx_analysis_images_user on public.analysis_images (user_id);
