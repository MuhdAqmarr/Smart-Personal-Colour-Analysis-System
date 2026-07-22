# Match.Lab — Smart Personal Colour Analysis System

> Final Year Project: a responsive web application that analyses a facial photo and returns an **estimated undertone**, a **suggested colour season** (Spring / Summer / Autumn / Winter + 12 sub-seasons), **personal fashion & cosmetic palettes**, and **colour-matched product recommendations** — built on transparent, rule-based colour science with privacy by default.

**Honesty first:** this is a deterministic, rule-based engine (CIE Lab, CIEDE2000, documented thresholds) — not AI/ML, not medical, not biometric identification. Results are estimates that vary with lighting and camera conditions, and every result says how confident it is.

## Features

- 📸 **Camera or upload** — guided wizard with consent, photography coaching, live face guide, denial fallback, client-side downscaling
- 🛡️ **Image-quality gate** — exactly-one-face, size, pose (yaw/pitch/roll), sharpness, exposure, lighting balance, colour cast → a 0–100 score with per-component breakdown and actionable retake tips
- 🎯 **Skin-colour analysis** — landmark-anchored forehead/cheek regions, robust pixel statistics, exact sRGB→XYZ→CIE Lab (D65), chroma & hue angle
- 🌈 **Classification with explanations** — warm/cool undertone, season + confidence-gated sub-season, six-factor confidence score, plain-language evidence
- 👗 **Palettes** — 156 curated colours across neutrals/core/accents/formal/casual/accessories/**hijab & headwear**/use-with-care (gentle wording), copy-HEX swatches, printable palette card, favourites
- 💄 **Cosmetics** — lipstick/blusher/eyeshadow/eyeliner/highlighter families + honest foundation *undertone direction* only
- 🛍️ **Products** — colour-tagged directory with filters, **CIEDE2000-ranked** recommendations per analysis, safe external links, favourites, admin CSV import with dry-run
- 🔐 **Privacy by default** — guests never stored; photos processed in memory; storage is explicit opt-in to a private bucket behind 5-minute signed URLs; per-item / history / account deletion
- 🧑‍💼 **Admin portal** — anonymised stats, catalogue CRUD, imports, append-only audit log, settings — with zero access to users' analyses or photos
- ✅ **Verified** — 189 unit · 56 integration · 21 RLS · 24 web · 30 E2E checks, axe WCAG 2.1 A/AA on key pages, strict typing everywhere, 4 CI pipelines

*Screenshots: see `docs/demo-script.md` for the guided tour; capture screenshots during the demo run for the report.*

### Design system
The frontend uses a modern, Apple-inspired glass design language — Geist
typography, a cool neutral OKLCH token system, restrained glass materials,
muted seasonal accents, and a fully designed dark mode (toggle in the
header). The system is documented in `docs/design-system.md`; the redesign
itself is summarised in `docs/ui-redesign-report.md`.

## Architecture

Monorepo: **Next.js 16** (App Router, TS strict, Tailwind, shadcn/ui, TanStack Query) on Vercel · **FastAPI** (Python 3.12, OpenCV, MediaPipe, NumPy, SQLAlchemy async) in Docker on Render · **Supabase** (PostgreSQL + RLS, Auth, private Storage). Full details: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`docs/architecture.md`](./docs/architecture.md) (flows) · [`docs/database-schema.md`](./docs/database-schema.md) (ERD).

```text
apps/web                 Next.js frontend (wizard, results, history, admin)
apps/api                 FastAPI backend + deterministic analysis pipeline
packages/contracts       Shared zod API contracts
packages/colour-engine   Versioned classifier configuration (single source of thresholds)
supabase/                Migrations (schema + RLS + storage policies) and generated seed
docs/                    Technical + FYP documentation (see index below)
scripts/                 db-reset, RLS proof, seed generator, smoke tests, sample CSV
```

## Getting started (local)

Prerequisites: **Node ≥ 20** (pnpm ≥ 9 via corepack), **uv ≥ 0.4** (manages Python 3.12), **Docker**.

```bash
git clone https://github.com/MuhdAqmarr/Smart-Personal-Colour-Analysis-System.git
cd Smart-Personal-Colour-Analysis-System

pnpm install                    # JS workspaces
cd apps/api && uv sync && cd ../..   # Python env (pins 3.12)

docker compose up -d db         # local PostgreSQL on :54329
./scripts/db-reset.sh           # auth shim + migrations + seed (LOCAL ONLY)

pnpm dev                        # web on :3000 + api on :8000 together
```

Open http://localhost:3000 — **guest analysis works immediately** (accounts need Supabase env, below).

Environment: copy `apps/web/.env.example → apps/web/.env.local` and `apps/api/.env.example → apps/api/.env`; every variable is documented inline. Without Supabase values the app runs in guest-only mode and says so honestly.

### Commands

| Task | Command |
|---|---|
| Dev servers (web+api) | `pnpm dev` |
| Lint / types / unit tests / build (JS) | `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` |
| API lint / types / tests | `cd apps/api && uv run ruff check . && uv run mypy app && uv run pytest` |
| Integration tests (needs docker db) | `cd apps/api && uv run pytest -m integration` |
| RLS proof | `uv run --project apps/api python scripts/verify_rls.py` |
| E2E (see TESTING_STRATEGY §7) | `pnpm test:e2e` |
| Production API image | `docker build --platform linux/amd64 -f apps/api/Dockerfile -t coloursense-api .` |

## Deployment

Fully prepared for **Vercel + Render + Supabase** — follow [`docs/deployment-guide.md`](./docs/deployment-guide.md) (includes the owner-credential action list, §42.4 validation checklist, and `scripts/smoke-test.sh`). `render.yaml` ships in-repo; the production image is amd64 (MediaPipe wheel constraint, documented).

## Documentation index

| | |
|---|---|
| [Architecture](./docs/architecture.md) · [Database & ERD](./docs/database-schema.md) · [API reference](./docs/api-reference.md) | [Methodology](./docs/colour-analysis-methodology.md) · [Classifier config](./docs/classifier-configuration.md) |
| [Privacy & consent](./docs/privacy-and-consent.md) · [Threat model](./docs/threat-model.md) · [Security review](./docs/security-review.md) | [Testing report](./docs/testing-report.md) · [Deployment guide](./docs/deployment-guide.md) |
| [User manual](./docs/user-manual.md) · [Admin manual](./docs/administrator-manual.md) · [Demo script](./docs/demo-script.md) | [FYP methodology](./docs/fyp-methodology-summary.md) · [Evaluation templates](./docs/evaluation-template.md) · [Future work](./docs/future-work.md) |

Project meta: [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) · [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) · [`DECISIONS.md`](./DECISIONS.md) · [`SECURITY_AND_PRIVACY.md`](./SECURITY_AND_PRIVACY.md) · [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)

## Privacy, security, limitations

Facial images are sensitive personal data: processing is in-memory and temporary by default, guests are never persisted, storage is opt-in to a private bucket, and deletion is first-class (item / history / account, cascade-verified). Authorisation is dual-layer (backend ownership checks + PostgreSQL RLS, proven by 21 automated checks). Limitations are stated openly: single uncalibrated photo, lighting-dominated error, heuristic thresholds, no accuracy claims without labelled data — see the [disclaimer content](./apps/web/src/app/(marketing)/disclaimer/page.tsx) and [future work](./docs/future-work.md).

## Licence

Academic Final Year Project by **MuhdAqmarr**. Repository licence to be confirmed by the owner (`DECISIONS.md` D-015); the vendored MediaPipe model is Apache-2.0 (see `apps/api/models/README.md`), test imagery is public-domain/generated (see `test-assets/README.md`).
