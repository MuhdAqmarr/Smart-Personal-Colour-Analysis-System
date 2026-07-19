# Deployment Guide

Production topology: **Vercel** (Next.js frontend) + **Render** (FastAPI in Docker) + **Supabase** (PostgreSQL, Auth, Storage). Everything below is prepared in-repo; steps marked **[OWNER]** need account credentials only the repository owner holds.

```mermaid
flowchart LR
    U["Browser"] -->|HTTPS| V["Vercel\napps/web"]
    V -->|"/api/v1 (bearer JWT)"| R["Render (Docker)\napps/api"]
    V -->|auth only| S["Supabase Auth"]
    R -->|asyncpg| P[("Supabase PostgreSQL\n+ RLS")]
    R -->|service key| ST["Supabase Storage\nanalysis-images (private)"]
```

---

## 1. Supabase (database, auth, storage)

1. **[OWNER]** Create a project at supabase.com (region close to users, e.g. Singapore).
2. **Run migrations** — SQL Editor → paste each file from `supabase/migrations/` **in filename order** (0001 → 0008). Never run `scripts/db-reset.sh` or the auth shim against Supabase.
3. **Seed** — paste `supabase/seed.sql` and run it (4 seasons, 12 sub-seasons, 156 palette colours, 48 cosmetics, 4 demo stores, 32 demo products, algorithm version 1.0.0, settings).
4. **Storage** — migration 0008 already created the private `analysis-images` bucket and owner-scoped policies; verify under Storage → buckets (public = false).
5. **Auth configuration** (Authentication → URL Configuration):
   - Site URL: `https://<your-app>.vercel.app`
   - Redirect URLs: `https://<your-app>.vercel.app/auth/callback`
   - (Optional) enable email confirmations; the app handles both modes.
6. **Administrator** — after the owner registers through the app:
   ```sql
   -- SQL Editor
   update public.profiles p set role = 'admin'
   from auth.users u where u.id = p.id and u.email = 'owner@example.com';
   ```
   (`scripts/promote-admin.sql` is the same query for psql.)
7. **Collect values** (Settings → API / Database):
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET` (legacy JWT secret) — leave **empty** if the project uses the newer asymmetric signing keys; the API then verifies via the JWKS endpoint automatically.
   - `DATABASE_URL`: use the **Session pooler** URI and convert the scheme to `postgresql+asyncpg://` (e.g. `postgresql+asyncpg://postgres.abc:PASS@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`).
8. **Verify isolation** — register two test users, run an analysis with each, and confirm each account sees only its own history (the API enforces ownership; RLS guards the direct surface).

## 2. Render (backend API)

The repo ships `render.yaml` (Blueprint) and the production `apps/api/Dockerfile`.

1. **[OWNER]** Render → New → **Blueprint** → select this GitHub repository. Render reads `render.yaml` (Docker runtime, root build context, health check `/api/v1/health`).
2. Fill the `sync: false` environment variables when prompted:
   | Variable | Value |
   |---|---|
   | `FRONTEND_URL` | exact Vercel origin, no trailing slash |
   | `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | from step 1.7 |
   | `SUPABASE_JWT_SECRET` | legacy secret, or empty for JWKS projects |
   | `DATABASE_URL` | the `postgresql+asyncpg://` pooler URI |
3. Deploy. First build takes several minutes (OpenCV + MediaPipe wheels).
4. **Platform note:** the image targets **linux/amd64** (MediaPipe publishes no linux/arm64 wheel). Render and GitHub CI are amd64; on an Apple Silicon machine build locally with `docker build --platform linux/amd64 …`.
5. **Resources:** 512 MB RAM is sufficient (MediaPipe model ~4 MB, lazy-loaded singleton; observed steady state well under 400 MB). The free tier sleeps — first request after idle takes ~30–60 s (cold start + model load); the starter plan avoids this.
6. **Logs:** structured JSON on stdout (Render → Logs). No image bytes or tokens are ever logged.
7. Smoke: `curl https://<api>.onrender.com/api/v1/readiness` → `{"status":"ready","checks":{"classifier_config":"ok","database":"ok"}}`.

## 3. Vercel (frontend)

1. **[OWNER]** Vercel → Add New Project → import the GitHub repository.
2. **Root Directory:** `apps/web` (Framework: Next.js — auto-detected; pnpm detected from the lockfile).
3. Environment variables (Production + Preview):
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` |
   | `NEXT_PUBLIC_API_URL` | `https://<api>.onrender.com` |
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
4. Deploy a **preview** first; run the smoke tests against it; then promote to production.
5. Update `FRONTEND_URL` on Render if the final production domain differs (CORS is pinned to it), and revisit Supabase Auth redirect URLs.

## 4. Production validation

```bash
API_URL=https://<api>.onrender.com WEB_URL=https://<app>.vercel.app ./scripts/smoke-test.sh
```

Then walk the manual checklist (spec §42.4):

- [ ] Landing page renders (mobile + desktop)
- [ ] Registration → confirmation email → login → password reset
- [ ] Camera opens on HTTPS; denial falls back to upload
- [ ] Guest analysis end-to-end; poor-quality photo gets clear feedback
- [ ] Signed-in analysis is saved; history lists it; detail renders palette + products
- [ ] "Save my analysis image" stores to the private bucket; signed URL displays; image deletion works
- [ ] Analysis deletion, full-history deletion, account deletion
- [ ] External product links open in a new tab with the store named
- [ ] `/admin` blocked for normal users; admin CRUD + CSV dry-run work; audit entries appear
- [ ] Two-account isolation check (each sees only their own data)
- [ ] Render logs show structured JSON without sensitive content

## 5. Owner action list (everything that needs credentials)

1. Create the Supabase project; run migrations + seed; configure auth URLs (§1).
2. Create the Render Blueprint; fill env vars (§2).
3. Create the Vercel project; fill env vars (§3).
4. Register the admin account and promote it (§1.6).
5. Run `scripts/smoke-test.sh` + the manual checklist (§4).

## 6. Railway (optional alternative to Render)

Railway also deploys the Dockerfile: New Project → Deploy from GitHub → set **Dockerfile path** `apps/api/Dockerfile` with root context, add the same environment variables, and expose port 8000. Health checks, cold-start behaviour, and sizing match §2.

## 7. Rollback & configuration changes

- Vercel: promote any previous deployment from the dashboard.
- Render: "Rollback" on the previous deploy; env-var changes redeploy automatically.
- Classifier thresholds: new config = new file (`classifier-v2.json`) + `CLASSIFIER_CONFIG_PATH`/code update via a normal PR — never edit v1 in place (results are stamped with their version).
