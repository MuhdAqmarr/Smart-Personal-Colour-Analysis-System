# Project Plan — Smart Personal Colour Analysis System (ColourSense)

> Authoritative execution plan derived from `SMART_PERSONAL_COLOUR_ANALYSIS_MASTER_PROMPT.md`.
> Status tracking lives in `PROJECT_STATUS.md`. Decisions live in `DECISIONS.md`.

## Phases, Tasks, and Acceptance Criteria

### Phase 0 — Audit and planning
- [x] Inspect repository (remote empty, local greenfield)
- [x] Verify git remote, branch, GitHub authentication
- [x] Create planning/status/architecture/decision/security/testing documents
- [x] Record assumptions and risks
- **Acceptance:** planning docs exist, repo initialised on `main`, first commit pushed.

### Phase 1 — Foundation (`feat/project-foundation`)
- [ ] pnpm workspace (`pnpm-workspace.yaml`, root `package.json` scripts)
- [ ] `apps/web`: Next.js App Router + TypeScript strict + Tailwind + shadcn/ui
- [ ] `apps/web`: Vitest + React Testing Library + Playwright config
- [ ] `apps/api`: FastAPI skeleton with uv, Ruff, MyPy, pytest, structlog JSON logging
- [ ] `apps/api`: request-ID middleware, error envelope, health/readiness endpoints
- [ ] `packages/contracts`: zod schemas + TS types for API payloads
- [ ] `packages/colour-engine`: versioned classifier configuration (`classifier-v1.json`)
- [ ] Dockerfile (api) + docker-compose (postgres + api)
- [ ] `.env.example` for web and api
- [ ] GitHub Actions: web CI + api CI
- **Acceptance:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; `uv run pytest` passes; Docker image builds; CI green on push.
- **Dependencies:** Phase 0.
- **Complexity:** M.

### Phase 2 — Database and authentication (`feat/database-authentication`)
- [ ] SQL migrations for all conceptual tables (§24 of master prompt)
- [ ] Automatic `updated_at` triggers, constraints, indexes
- [ ] RLS policies for every table + storage policies for private image bucket
- [ ] `is_admin()` helper + role model (`profiles.role`)
- [ ] Seed: 4 seasons, 12 sub-seasons, palette colours, cosmetics, demo stores/products
- [ ] RLS verification script run against local Postgres (auth shim) in CI
- [ ] Backend JWT verification (HS256 secret + JWKS support)
- **Acceptance:** migrations apply cleanly to a fresh Postgres; RLS verification script proves user isolation; seed loads; JWT guard unit-tested.
- **Dependencies:** Phase 1.
- **Complexity:** L.

### Phase 3 — UI foundation (`feat/design-system`)
- [ ] Global layout, navigation, footer, theme tokens
- [ ] Landing page (all 11 sections of §9)
- [ ] Auth pages: sign-in, register, forgot/reset password (Supabase Auth)
- [ ] Legal/info pages: privacy, terms, disclaimer, how-it-works, seasons, FAQ
- [ ] Dashboard shell + route guards
- [ ] Accessibility baseline (landmarks, focus states, skip link, reduced motion)
- **Acceptance:** responsive at 375/390/768/1024/1440; keyboard navigable; build passes.
- **Dependencies:** Phase 1.
- **Complexity:** L.

### Phase 4 — Image acquisition (`feat/image-acquisition`)
- [ ] Consent step with explicit opt-in storage checkbox (off by default)
- [ ] Photography guidance step
- [ ] Camera capture (MediaDevices, front camera preference, switching, guide overlay, track cleanup)
- [ ] Upload with client-side validation (type, size, decode) + EXIF-safe preview
- [ ] Preview/retake step; object URLs revoked correctly
- **Acceptance:** camera denial falls back to upload with clear messaging; unit tests for validation logic.
- **Dependencies:** Phase 3.
- **Complexity:** M.

### Phase 5 — Image-quality engine (`feat/image-quality-engine`)
- [ ] Upload security validation (extension, MIME sniff, decode, bomb protection, size)
- [ ] EXIF orientation correction + bounded resize (1600 px)
- [ ] MediaPipe face detection + landmarks; face count/size checks
- [ ] Pose estimation (yaw/pitch/roll) from facial transformation matrix
- [ ] Blur (variance of Laplacian, scale-normalised), exposure, lighting consistency
- [ ] Colour-cast estimation (gray-world + channel balance + face-region consistency)
- [ ] Composite quality score (0–100) with component scores in versioned config
- [ ] `POST /api/v1/analyses/preview-quality` + wizard quality UI
- **Acceptance:** unit tests for every metric on synthetic fixtures; integration tests for dark/blurred/no-face/multi-face images.
- **Dependencies:** Phase 1 (api), Phase 4 (ui).
- **Complexity:** XL.

### Phase 6 — Colour engine (`feat/colour-analysis-engine`)
- [ ] Landmark-relative ROI polygons: forehead, left cheek, right cheek
- [ ] Pixel filtering: dark/bright/highlight/saturation rejection + MAD outliers
- [ ] Robust aggregation: median, trimmed mean, std, usable-pixel %
- [ ] Colour science: sRGB↔linear, XYZ (D65), CIE Lab, HSV/HSL, HEX, chroma, hue angle
- [ ] CIEDE2000 with published test-pair verification
- [ ] Undertone classifier (warm/cool public; warm/cool/neutral/uncertain internal)
- [ ] Major-season + sub-season classifiers on 4 dimensions
- [ ] Confidence system (separate from classification score)
- [ ] Explainability generator (evidence, warnings, improvement tips)
- **Acceptance:** deterministic outputs; unit tests against reference colour values; classifier behaviour tests; config versioned as 1.0.0.
- **Dependencies:** Phase 5.
- **Complexity:** XL.

### Phase 7 — Results and persistence (`feat/analysis-results`)
- [ ] `POST /api/v1/analyses` end-to-end pipeline endpoint (guest + authenticated)
- [ ] Persistence of derived features for authenticated users (never guest images)
- [ ] Results page: overview / fashion / cosmetics / products / technical tabs
- [ ] History list, detail, delete; optional image save/delete (private bucket, signed URLs)
- [ ] Privacy settings page wired to consents/preferences
- **Acceptance:** guest flow stores nothing; user flow persists and lists analyses; deletion verified; integration tests.
- **Dependencies:** Phase 6, Phase 2.
- **Complexity:** L.

### Phase 8 — Palettes and cosmetics (`feat/palette-recommendations`)
- [ ] Palette API (`/seasons`, `/seasons/{slug}`, `/analyses/{id}/palette`)
- [ ] Palette UI: swatch grids, groups, copy HEX, cautious colours wording
- [ ] Cosmetic recommendations UI
- [ ] Favourite colours; printable palette card
- **Acceptance:** all four seasons + 12 sub-seasons render seeded data; favourites persist.
- **Dependencies:** Phase 2 (seed), Phase 7.
- **Complexity:** M.

### Phase 9 — Products (`feat/product-recommendations`)
- [ ] Product/store/product-colour APIs with pagination, filters, sorting
- [ ] CIEDE2000 palette-match ranking (documented formula)
- [ ] Recommended products for an analysis; favourites
- [ ] External-link safety (http/https only, new tab, noopener/noreferrer, store label)
- [ ] CSV import backend: dry-run, row validation, duplicates, transactions, history, error report
- **Acceptance:** ranking unit-tested; import integration-tested with sample + broken CSVs.
- **Dependencies:** Phase 2, Phase 6 (CIEDE2000).
- **Complexity:** L.

### Phase 10 — Administration (`feat/admin-portal`)
- [ ] Admin dashboard with anonymised stats and system health
- [ ] CRUD UIs: seasons, sub-seasons, palettes, cosmetics, stores, products
- [ ] CSV import screens (upload → preview → commit → history)
- [ ] Audit logs viewer; algorithm versions; system settings
- [ ] Server-side admin enforcement on every admin endpoint
- **Acceptance:** non-admin blocked at API level (tested); admin actions audit-logged.
- **Dependencies:** Phase 9.
- **Complexity:** L.

### Phase 11 — Testing and hardening (`test/system-hardening`)
- [ ] Backend unit + integration suites green (§36.1, §36.2)
- [ ] Frontend unit suites green (§36.3)
- [ ] Playwright E2E for the ten §36.4 journeys (auth-dependent specs env-gated)
- [ ] Accessibility checks on key pages
- [ ] Security review vs threat model; rate limiting verified
- [ ] Performance timings for pipeline stages
- **Acceptance:** CI green across all workflows; findings fixed or documented.
- **Dependencies:** Phases 1–10.
- **Complexity:** L.

### Phase 12 — Deployment (`chore/production-deployment`)
- [ ] Production Dockerfile validated; `render.yaml`
- [ ] Vercel configuration + environment documentation
- [ ] Supabase production checklist (auth URLs, buckets, policies, admin role)
- [ ] Smoke-test scripts and manual-action checklist for the owner
- **Acceptance:** deployment fully prepared; anything requiring owner credentials precisely documented.
- **Dependencies:** Phase 11.
- **Complexity:** M.

### Phase 13 — Documentation and handover (`docs/fyp-documentation`)
- [ ] README (install→deploy), docs/ tree of §43, Mermaid diagrams
- [ ] FYP methodology, evaluation templates, demo script
- [ ] User manual + administrator manual
- [ ] Final `PROJECT_STATUS.md` update
- **Acceptance:** a new machine can follow README to a running system; FYP docs complete.
- **Dependencies:** all previous phases.
- **Complexity:** M.

## Technical Risks
| Risk | Impact | Mitigation |
|---|---|---|
| MediaPipe wheels/model availability (macOS arm64 dev, linux/amd64 Render) | Blocks pipeline | Pin Python 3.12; commit Apache-2.0 `face_landmarker.task` model; Docker base with required system libs |
| Face detection fails on synthetic CI fixtures | Flaky CI | Use public-domain real photo (scikit-image `astronaut`) + derived degradations as fixtures |
| Undertone thresholds sensitive to lighting/cast | Wrong results | Strict quality gating, cast detection, confidence system, versioned config, honest low-confidence UX |
| Supabase auth changes (legacy JWT secret vs new signing keys) | Auth breakage | Verifier supports HS256 secret and asymmetric JWKS |
| Monorepo CI complexity | Slow feedback | Path-filtered workflows per app |
| Render free-tier memory with OpenCV+MediaPipe | OOM in prod | Headless OpenCV, lazy model load, single worker, documented instance sizing |

## Security & Privacy Risks
| Risk | Mitigation |
|---|---|
| Facial images are sensitive personal data | Default in-memory processing; no guest persistence; opt-in storage in private bucket; deletion flows |
| Malicious uploads (bombs, fake MIME, polyglots) | Real decode validation, pixel limits, size limits, format allow-list |
| Cross-user data access | RLS + backend ownership checks + verification script |
| Admin bypass | Server-side role checks on every admin route; RLS admin policies |
| Secret leakage | `.env` ignored; GitHub Secrets for CI; no secrets in client bundle; log redaction |
| External URL injection | http/https allow-list; `noopener noreferrer`; no `javascript:` |
| Token leakage in logs | Structured logging with explicit field allow-list; no image bytes/token logging |

## Milestone / Branch Map
`main` stable. Feature branches per phase exactly as listed above, PR per phase, local verification before merge (see `DECISIONS.md` D-011).
