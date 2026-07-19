# Testing Strategy — Smart Personal Colour Analysis System

Testing is mandatory (master prompt §36). This document defines layers, tooling, fixtures, and gates.

## 1. Layers and tooling

| Layer | Tooling | Scope |
|---|---|---|
| Backend unit | pytest | colour conversions, CIEDE2000, quality metrics, ROI/pixel filtering, classifiers, confidence, product ranking, CSV validation, error mapping, JWT verification |
| Backend integration | pytest + httpx ASGI client (+ Postgres via docker/CI service) | /api/v1 endpoints: health, quality preview, full analysis, auth, ownership, admin authz, products, favourites, deletion |
| DB / RLS | psql + `scripts/verify_rls.py` against Postgres with an `auth.*` shim | migrations apply cleanly; user isolation; admin-only mutations; anon restrictions; public readability |
| Frontend unit | Vitest + React Testing Library (jsdom) | consent form, upload validation, camera permission states, wizard steps, result cards, confidence display, swatches, filters, guards |
| E2E | Playwright | the ten §36.4 journeys; auth-dependent specs gated on Supabase env availability |
| Accessibility | Playwright + axe-core on key pages | landing, wizard steps, results, dashboard, admin list pages |
| CI | GitHub Actions | all of the above, path-filtered per app |

## 2. Test assets (licence-clean, hermetic)

No scraped or private personal images — ever. Fixtures are **generated at test time** into `test-assets/generated/` (git-ignored):

| Fixture | Construction | Licence |
|---|---|---|
| `valid_face` | scikit-image bundled `astronaut` photograph (Eileen Collins, NASA, public domain), centre-cropped to the face | Public domain |
| `no_face` | Synthetic gradient + Perlin-ish noise | Generated |
| `multiple_faces` | Two `valid_face` crops composited side by side | Public domain derivative |
| `too_dark` / `too_bright` | `valid_face` scaled ×0.12 / blown ×2.4 with clipping | Derivative |
| `blurred` | `valid_face` + Gaussian blur (σ scaled to width) | Derivative |
| `yellow_cast` / `blue_cast` | `valid_face` with channel gains | Derivative |
| `tiny_face` | `valid_face` pasted small onto a large background | Derivative |
| Diverse skin tones | Synthetic skin-patch matrices spanning documented Lab ranges (ITA bands) for unit tests of classifiers and statistics | Generated |

`test-assets/README.md` documents each fixture, its origin and licence, and how an evaluator can add **consented** real photos locally for manual evaluation (never committed).

## 3. Determinism rules

- The pipeline is deterministic: fixed config + fixed image ⇒ identical output (asserted in a repeatability test).
- No network in unit tests. MediaPipe model file is vendored in-repo; tests needing it are marked `@pytest.mark.landmarker` and run in CI (model present) and locally.
- Classifier tests feed synthetic Lab feature vectors directly (bypassing image I/O) to pin decision boundaries against `classifier-v1.json`.

## 4. Reference values

- Colour conversions tested against canonical values (D65 white → L*=100; #808080 → L*≈53.585; sRGB primaries → published Lab values).
- CIEDE2000 tested against the published Sharma test pairs plus symmetry/identity properties.
- Exposure/blur metrics tested on constructed images with known statistics (uniform fields, step edges, gradients).

## 5. Gates

- Every phase merge requires: format + lint + typecheck + relevant tests + build, all green locally; CI must be green on `main` after push.
- No merging failing code to `main`; no disabling checks to pass a phase.
- Coverage is tracked for the backend `analysis/` package (target: ≥85% lines) — quality of assertions over raw numbers.

## 6. E2E journeys (Playwright)

1. Guest completes temporary analysis (fixture upload → results).
2. Registration (env-gated).
3. Registered user completes + saves analysis (env-gated).
4. History list (env-gated).
5. Delete analysis (env-gated).
6. View product recommendations.
7. Favourite a product (env-gated).
8. Admin edits a product (env-gated, seeded admin).
9. Non-admin blocked from admin routes.
10. Camera denied → upload fallback (permission mocked).

Camera hardware is emulated with Playwright's fake media stream flags where needed.
