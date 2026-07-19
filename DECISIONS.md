# Decision Records — Smart Personal Colour Analysis System

Format: **D-xxx — Title** · Status · Date · Context → Decision → Consequences.

---

## D-001 — Rule-based baseline classifier (no ML claims)
**Status:** Accepted · 2026-07-19
**Context:** No professionally labelled personal-colour dataset is available; the master prompt forbids fake AI/accuracy claims.
**Decision:** Implement a deterministic, rule-based, config-driven colour-analysis engine (colour science + robust statistics + documented thresholds). Describe it honestly as a *rule-based colour-analysis engine*.
**Consequences:** Fully explainable and testable; upgrade path to ML documented in `docs/future-work.md`; evaluation framed as technical consistency testing, not classification accuracy.

## D-002 — CIE Lab (D65) + CIEDE2000 for colour work
**Status:** Accepted · 2026-07-19
**Context:** Undertone/season estimation and product matching need a perceptually meaningful colour space and distance.
**Decision:** Convert sRGB → linear RGB → XYZ (D65) → CIE Lab with our own tested utilities. Use CIEDE2000 (Sharma formulation, verified against published test pairs) for palette/product distances.
**Consequences:** Defensible in an FYP viva; no dependency on browser CSS colour conversion; small amount of maths code we own and test.

## D-003 — MediaPipe Face Landmarker for detection + landmarks + pose
**Status:** Accepted · 2026-07-19
**Context:** Need reliable face detection, 478 landmarks, and head pose without training a model.
**Decision:** Use MediaPipe Tasks `FaceLandmarker` (Apache-2.0, actively maintained), `num_faces=4` to detect multi-face violations, `output_facial_transformation_matrixes=True` for yaw/pitch/roll. Commit the `face_landmarker.task` model (~3.7 MB, Apache-2.0) to the repo for hermetic CI/builds.
**Consequences:** Python pinned to 3.12 (MediaPipe wheel support); Docker needs `libgl1`/`libglib2.0-0`; model licence documented in `test-assets`/`docs`.

## D-004 — Image retention: process-only by default, opt-in private storage
**Status:** Accepted · 2026-07-19
**Context:** Facial images are sensitive personal data; the prompt mandates privacy-by-default.
**Decision:** Analysis runs fully in memory. Originals are never written to disk server-side and never persisted for guests. Authenticated users get an **off-by-default** "save my analysis image" option → private Supabase Storage bucket `analysis-images/{user_id}/{analysis_id}.jpg`, accessed only via short-lived signed URLs, deletable by owner.
**Consequences:** No temp-file cleanup risk; storage policies + RLS required; documented in `SECURITY_AND_PRIVACY.md`.

## D-005 — Supabase RLS as the direct-surface defence; backend enforces ownership itself
**Status:** Accepted · 2026-07-19
**Context:** The backend connects with privileged credentials (table owner bypasses RLS); the anon-key PostgREST surface is still publicly reachable.
**Decision:** Backend enforces ownership/role in every repository query (tested). RLS policies + storage policies independently lock the direct Supabase surface. RLS proven by an automated verification script simulating `authenticated`/`anon` JWT claims.
**Consequences:** Two enforcement layers; CI job runs RLS verification against a service Postgres with an `auth.*` shim.

## D-006 — Backend deployment target: Render (Docker)
**Status:** Accepted · 2026-07-19
**Context:** OpenCV + MediaPipe need a container; the prompt specifies Render as primary, Railway as optional note.
**Decision:** Production Dockerfile (python:3.12-slim, non-root, uvicorn, healthcheck) + `render.yaml`. Railway documented as an alternative only.
**Consequences:** Cold-start and memory notes documented; single-worker default sized for free/starter instances.

## D-007 — Threshold/configuration versioning
**Status:** Accepted · 2026-07-19
**Context:** The prompt bans magic numbers scattered in code and requires versioned algorithm config.
**Decision:** All classifier/quality thresholds and weights live in `packages/colour-engine/config/classifier-v1.json` with a semantic `version`. The API loads + validates it at startup, stamps every result with `classifierVersion`, and records versions in the `algorithm_versions` table.
**Consequences:** Reproducible results per version; config changes are diffable and reviewable; the same JSON documents the methodology for the FYP report.

## D-008 — Python toolchain: uv + Python 3.12; JS toolchain: pnpm
**Status:** Accepted · 2026-07-19
**Context:** System Python is 3.9 (too old for current MediaPipe/typing); prompt mandates pnpm and uv.
**Decision:** `uv` with `pyproject.toml`, `requires-python = ">=3.12,<3.13"`, `.python-version` = 3.12. pnpm workspace for JS/TS.
**Consequences:** Contributors need uv (documented); lockfiles (`uv.lock`, `pnpm-lock.yaml`) committed.

## D-009 — Test fixtures: public-domain real photo + synthetic degradations
**Status:** Accepted · 2026-07-19
**Context:** Face-detection tests need a real face; scraping personal images is forbidden.
**Decision:** Use scikit-image's bundled `astronaut` photograph (Eileen Collins, public-domain NASA image) as the canonical valid-face fixture, generated locally at test time. Derive no-face/multi-face/dark/bright/blurred/colour-cast variants programmatically. Document licences in `test-assets/README.md`; additionally document how an evaluator can add consented photos.
**Consequences:** Hermetic, licence-clean, reproducible CI without committing face photos.

## D-010 — JWT verification supports HS256 secret and JWKS
**Status:** Accepted · 2026-07-19
**Context:** Classic Supabase projects sign with a shared HS256 secret; newer projects use asymmetric signing keys (JWKS).
**Decision:** Security module verifies HS256 via `SUPABASE_JWT_SECRET` when configured, otherwise fetches and caches `<SUPABASE_URL>/auth/v1/.well-known/jwks.json` for ES256/RS256.
**Consequences:** Works with any current Supabase project; unit tests cover both paths with locally minted keys.

## D-011 — Solo-maintainer git workflow
**Status:** Accepted · 2026-07-19
**Context:** Single developer + AI agent; prompt requires feature branches, PRs, and a stable `main`.
**Decision:** One feature branch per phase (names from the master prompt), full local verification (format, lint, typecheck, tests, build) before merge, PR created with description for the record, merged without waiting on review (no second reviewer exists). `main` never receives unverified code. No force-pushes to `main`.
**Consequences:** History stays auditable per phase; CI still runs on every push/PR as a safety net.

## D-012 — Frontend data path: all app data via FastAPI; supabase-js for auth only
**Status:** Accepted · 2026-07-19
**Context:** Two possible data paths (PostgREST direct vs app API) risk inconsistent authz logic.
**Decision:** The browser uses supabase-js exclusively for auth/session (sign-up, sign-in, password reset, session refresh). Every application read/write goes through `/api/v1` with the JWT attached. RLS remains as the lock on the unused direct surface.
**Consequences:** One consistent authz implementation; typed contracts in `packages/contracts`; PostgREST surface stays locked down by RLS.

## D-013 — Skin ROIs: landmark-anchored elliptical polygons + robust statistics
**Status:** Accepted · 2026-07-19
**Context:** Fixed pixel rectangles are forbidden; hand-picked mesh-index polygons are brittle to document/verify.
**Decision:** Build forehead/cheek ROIs as elliptical polygons positioned and scaled from stable anatomical MediaPipe anchors (face oval top, glabella, lower eyelids, mouth corners, face-edge points), then apply pixel-level filtering (L*/chroma bounds + MAD outlier rejection) so residual non-skin pixels (hair strands, shadow, specular highlights) are discarded statistically.
**Consequences:** Regions scale with face geometry and pose; method is easy to explain and diagram in the FYP report; robust statistics carry the correctness burden and are unit-tested.

## D-014 — Product colour matching formula
**Status:** Accepted · 2026-07-19
**Context:** Product recommendations must be ranked defensibly and documented.
**Decision:** Score = weighted sum of: palette-colour proximity (min CIEDE2000 to the user's recommended palette, mapped through a documented falloff), season-tag match, sub-season tag match, category relevance, and availability; weights live in classifier config. Formula documented in `docs/colour-analysis-methodology.md`.
**Consequences:** Deterministic, tunable ranking; unit tests pin the ordering behaviour.

## D-015 — Repository licence
**Status:** Open — owner decision required
**Context:** Public repo currently has no licence (all rights reserved by default).
**Decision:** Deferred to owner; README notes the code is an academic FYP. Recommendation: MIT for code once the owner confirms.
**Consequences:** Until then, third parties have no reuse rights; not a blocker for development or FYP submission.
