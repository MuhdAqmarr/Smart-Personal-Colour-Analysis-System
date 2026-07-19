# Testing Report

Snapshot of the automated verification as of 2026-07-19 (all suites green on `main`). Strategy: [`TESTING_STRATEGY.md`](../TESTING_STRATEGY.md).

## Suite inventory

| Suite | Command | Count | Covers |
|---|---|---|---|
| API unit | `cd apps/api && uv run pytest` | **189** | Preprocessing/upload hardening (12) · colour conversions vs canonical values (16) · **CIEDE2000 vs all 34 Sharma pairs** (38) · quality metrics (17) · face pipeline on real MediaPipe (13) · classifier decision boundaries (22) · product ranking (7) · CSV import validation (10) · full-analysis + endpoint (10) · JWT incl. ES256 (10) · hardening: rate-limit 429, log hygiene, envelope, CORS (5) · config/health/errors (29) |
| API integration | `uv run pytest -m integration` | **56** | Auth + trigger-provisioned profiles (5) · persistence completeness, guest non-persistence, cross-user 404s, deletion cascades, preferences, consents (16) · palette catalogue, sub-season merge, favourites privacy (9) · products, ranked recommendations, favourites, CSV dry-run/commit/audit (14) · admin authz matrix + CRUD lifecycles + stats anonymity (17)* |
| RLS proof | `uv run --project apps/api python scripts/verify_rls.py` | **21/21** | Cross-user reads/deletes, self-escalation block, admin-only mutations, anon restrictions, inactive-content hiding, favourites isolation, public readability |
| Web unit | `pnpm --filter web test` | **24** | Landing content + honest positioning · swatch grid (a11y + clipboard) · sign-in validation/redirect/failure · image validation (6) · consent gating (4) · camera permission/hardware/HTTPS fallbacks (4) |
| Contracts | `pnpm --filter @coloursense/contracts test` | **7** | Envelope/enums/pagination/result schema shape |
| E2E (Playwright) | `pnpm --filter web test:e2e` | **30** (15 × chromium + Pixel 7) | Consent gate · full guest analysis against the live stack · no-face retake · camera-denial fallback · products + external-link attributes · seasons · anonymous redirects from /dashboard and /admin · **axe-core WCAG 2.1 A/AA on 5 pages (serious/critical = 0)** |

\* counts per file; totals verified in CI runs.

## Static verification

`mypy --strict` over 60 backend source files — clean. Ruff (E/W/F/I/UP/B/SIM/C4/T20/RET/PTH) — clean. `tsc --noEmit` across web + 2 packages — clean. ESLint (next config + react-hooks v6) — clean. Prettier enforced in CI.

## CI pipelines

`web-ci` (format/lint/types/tests/build) · `api-ci` (ruff/mypy/pytest + Docker build) · `db-ci` (Postgres service → seed-freshness check → migrations → **RLS proof** → integration suite) · `e2e-ci` (full stack: DB → API → built web → Playwright, failure artefacts). All path-filtered, all required green before merges (workflow discipline recorded in D-011).

## Determinism & performance observations

- Same photo + same config ⇒ byte-identical classification (asserted).
- Warm analysis latency observed at **~15 ms** server-side on the 640px fixture (Apple M-series, in-process); first request pays MediaPipe model load (~700 ms). In-container (emulated amd64): health instant, analysis functional.
- E2E full suite: ~7 s with warm servers.

## Known gaps (honest)

- Auth-dependent E2E journeys (register/save/history/admin UI) are **env-gated** and require a Supabase project; they are covered today at the API integration layer instead.
- No human-labelled accuracy evaluation exists (no professionally labelled dataset) — see `fyp-methodology-summary.md` for the consistency-based evaluation framing and `evaluation-template.md` for the human-study protocol.
- Frontend admin screens are exercised manually + via API tests, not by dedicated component tests.
