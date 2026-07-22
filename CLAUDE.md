# CLAUDE.md — Smart Personal Colour Analysis System (Match.Lab)

Authoritative spec: `SMART_PERSONAL_COLOUR_ANALYSIS_MASTER_PROMPT.md`. Plan: `PROJECT_PLAN.md`. Status: `PROJECT_STATUS.md`. Decisions: `DECISIONS.md`.

## What this is
FYP web app: analyse a facial photo → estimated undertone (warm/cool), colour season (Spring/Summer/Autumn/Winter + sub-season), fashion/cosmetic palettes, and matching products. **Rule-based deterministic engine — never describe it as AI/ML, never invent accuracy numbers.**

## Stack
- `apps/web` — Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, TanStack Query, RHF+zod, supabase-js (auth only).
- `apps/api` — FastAPI, Python 3.12 via **uv**, OpenCV(headless), MediaPipe FaceLandmarker, NumPy, Pillow, SQLAlchemy async + asyncpg, structlog.
- `supabase/` — SQL migrations, RLS + storage policies, seed. Postgres/Auth/Storage by Supabase.
- Deploy: Vercel (web) + Render Docker (api) + Supabase. CI: GitHub Actions.

## Commands
- JS: `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` (root, filtered per workspace).
- Python (from `apps/api`): `uv sync`, `uv run pytest`, `uv run ruff check .`, `uv run ruff format .`, `uv run mypy app`.
- Local DB: `docker compose up -d db` then `scripts/db-reset.sh` (applies migrations + seed + auth shim).

## Hard rules
1. **Privacy:** never persist guest images; never write uploaded images to disk; opt-in storage only via private bucket + signed URLs; no image bytes/tokens in logs.
2. **No magic numbers** in analysis code — every threshold lives in `packages/colour-engine/config/classifier-v1.json` (versioned; results stamped with `classifierVersion`).
3. Routers stay thin; pipeline code in `apps/api/app/analysis/*` stays pure/deterministic and framework-free.
4. All app data flows browser → FastAPI `/api/v1` (JWT bearer). supabase-js is for auth/session only. Ownership checks in every repository query; admin checked server-side.
5. Error envelope: `{"error": {"code", "message", "details?", "requestId"}}` — no raw exceptions to clients.
6. Language in UI/docs: "estimated", "suggested", "confidence" — no medical, biometric, or accuracy claims.
7. Git: Conventional Commits; feature branch per phase; verify (format/lint/typecheck/tests/build) before merge; never force-push `main`; never commit `.env`/secrets/facial images.
8. After each phase: update `PROJECT_STATUS.md`, push branch, PR per D-011.

## Gotchas
- System Python is 3.9 — always go through `uv` (project pins 3.12).
- MediaPipe model `apps/api/models/face_landmarker.task` is vendored (Apache-2.0) — don't delete; loaded lazily as a singleton.
- Test fixtures are generated (public-domain astronaut photo + synthetic variants) — see `TESTING_STRATEGY.md`; never add scraped/private face photos.
- RLS: backend connects as table owner (bypasses RLS) — RLS protects the direct PostgREST surface; don't "rely" on RLS from the API side, enforce in queries.
