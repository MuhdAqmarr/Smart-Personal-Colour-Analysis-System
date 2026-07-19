# ColourSense — Smart Personal Colour Analysis System

> Final Year Project: a responsive web application that analyses a user-provided facial image and returns an estimated personal colour profile — undertone, seasonal colour classification, personal fashion and cosmetic palettes, and matching product recommendations.

**Status:** in active development. See [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for live progress and [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) for the roadmap.

## What it does

1. Capture a facial photo with the camera, or upload one (JPEG/PNG/WebP).
2. Automated image-quality validation (exactly one face, size, pose, blur, exposure, lighting, colour cast) with friendly retake guidance.
3. Skin-region extraction from the forehead and cheeks using facial landmarks — no fixed pixel boxes.
4. Colour-science feature extraction: RGB, HEX, HSV/HSL, CIE XYZ, CIE Lab, chroma, hue angle.
5. Estimated **warm/cool undertone** and one of four **colour seasons** (Spring, Summer, Autumn, Winter), plus a sub-season when confidence is sufficient.
6. Personal fashion palettes, cosmetic colour suggestions, and colour-matched product recommendations (CIEDE2000).
7. Registered users can save, review, and delete analyses; guests are never stored.
8. Administrator portal for palettes, cosmetics, stores, products, CSV imports, and audit logs.

It is a **rule-based, deterministic colour-analysis engine** built on colour science and documented thresholds — honest about its confidence and limitations. It is *not* a medical, dermatological, or biometric identification system, and results vary with lighting and camera conditions.

## Architecture

Monorepo: Next.js frontend (Vercel) · FastAPI + OpenCV + MediaPipe backend (Render, Docker) · Supabase (PostgreSQL + Auth + Storage, RLS enforced). Details in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

```text
apps/web                 Next.js App Router (TypeScript, Tailwind, shadcn/ui)
apps/api                 FastAPI (Python 3.12, uv, OpenCV, MediaPipe)
packages/contracts       Shared API contracts (zod)
packages/colour-engine   Versioned classifier configuration
supabase/                SQL migrations, RLS policies, seed data
docs/                    Technical + FYP documentation
```

## Getting started

> Full instructions land with Phase 1; this section is kept accurate as the code evolves.

Prerequisites: Node ≥ 20, pnpm ≥ 9, uv ≥ 0.4, Docker.

```bash
pnpm install          # JS workspaces
cd apps/api && uv sync # Python environment (pins Python 3.12)
docker compose up -d db
pnpm dev              # web + api
```

## Privacy

Facial images are sensitive personal data. Default behaviour: images are processed in memory and never persisted; saving an image is an explicit opt-in for registered users only, into a private bucket behind signed URLs, deletable at any time. See [`SECURITY_AND_PRIVACY.md`](./SECURITY_AND_PRIVACY.md).

## Licence

Academic Final Year Project. Licence to be confirmed by the repository owner (see `DECISIONS.md` D-015).
