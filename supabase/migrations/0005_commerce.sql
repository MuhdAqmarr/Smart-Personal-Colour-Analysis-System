-- 0005_commerce.sql — stores, products, product colours, season tags,
-- favourites, CSV import jobs.

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (char_length(name) between 2 and 120),
  website_url text check (website_url is null or website_url ~* '^https?://'),
  country char(2) not null default 'MY',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_stores_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 200),
  brand text not null default '',
  category text not null check (
    category in (
      'tops', 'shirts', 'dresses', 'outerwear', 'trousers', 'skirts',
      'scarves', 'hijabs', 'accessories', 'shoes', 'bags', 'cosmetics'
    )
  ),
  gender text not null default 'unisex' check (gender in ('women', 'men', 'unisex')),
  description text not null default '',
  image_url text check (image_url is null or image_url ~* '^https?://'),
  -- External link; scheme is also validated in the API and rendered with
  -- rel="noopener noreferrer" in the frontend.
  product_url text not null check (product_url ~* '^https?://'),
  price numeric(10, 2) check (price is null or price >= 0),
  original_price numeric(10, 2) check (original_price is null or original_price >= 0),
  currency char(3) not null default 'MYR',
  availability text not null default 'unknown' check (
    availability in ('in_stock', 'out_of_stock', 'unknown')
  ),
  is_active boolean not null default true,
  -- Seeded demonstration records are labelled so the UI can disclose them.
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_store on public.products (store_id);
create index idx_products_category_active on public.products (category, is_active);
create index idx_products_updated on public.products (updated_at desc);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_colours (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  colour_name text not null default '',
  hex char(7) not null check (hex ~ '^#[0-9a-f]{6}$'),
  lab_l numeric(6, 2) not null check (lab_l between 0 and 100),
  lab_a numeric(6, 2) not null check (lab_a between -128 and 128),
  lab_b numeric(6, 2) not null check (lab_b between -128 and 128),
  is_primary boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_product_colours_product on public.product_colours (product_id);

create table public.product_season_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  season_slug text not null check (season_slug ~ '^[a-z0-9-]{2,40}$'),
  subseason_slug text check (subseason_slug is null or subseason_slug ~ '^[a-z0-9-]{2,40}$'),
  created_at timestamptz not null default now()
);

create unique index uq_product_season_tags
  on public.product_season_tags (product_id, season_slug, coalesce(subseason_slug, ''));
create index idx_product_season_tags_season
  on public.product_season_tags (season_slug, subseason_slug);

create table public.user_favourite_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index idx_user_favourite_products_user
  on public.user_favourite_products (user_id, created_at desc);

create table public.product_import_jobs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles (id) on delete set null,
  filename text not null,
  status text not null default 'pending' check (
    status in ('pending', 'dry_run_completed', 'completed', 'failed')
  ),
  dry_run boolean not null default true,
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  inserted_rows integer not null default 0,
  updated_rows integer not null default 0,
  error_rows integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_product_import_jobs_created
  on public.product_import_jobs (created_at desc);

create trigger trg_product_import_jobs_updated_at
  before update on public.product_import_jobs
  for each row execute function public.set_updated_at();

create table public.product_import_errors (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.product_import_jobs (id) on delete cascade,
  row_number integer not null check (row_number >= 1),
  column_name text not null default '',
  error_message text not null,
  raw_row jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_product_import_errors_job
  on public.product_import_errors (job_id, row_number);
