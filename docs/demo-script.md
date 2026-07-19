# FYP Demo Script (~12 minutes)

Stable, rehearsable walkthrough (spec §45). All data shown is the seeded demonstration catalogue — clearly labelled, no live-commerce claims.

## Preparation (before the session)

1. Stack up: `docker compose up -d db && ./scripts/db-reset.sh`, API on :8000 (raise `RATE_LIMIT` for demos), `pnpm dev:web` — or use the deployed URLs.
2. Accounts ready: one **registered demo user** and one **promoted admin** (deployment guide §1.6).
3. Photos ready: a consented volunteer/self photo in daylight, plus the committed fixtures `apps/web/e2e/fixtures/valid-face.jpg` (public-domain) and `no-face.jpg` for the failure demo.
4. Open tabs: landing page, `/api/v1/docs` (to flash the OpenAPI surface if asked).

## Script

| # | Beat | Do | Say |
|---|---|---|---|
| 1 | Landing | Scroll hero → seasons → privacy section | "A rule-based, explainable colour-analysis system — note we never claim AI, and privacy-by-default is on the landing page itself." |
| 2 | Sign in | Sign in as the demo user | "Supabase auth; the backend independently verifies every token." |
| 3 | Consent | Start analysis; point at both checkboxes | "Analysis needs explicit consent; photo storage is a separate opt-in, off by default." |
| 4 | Guidance | Show aim-for/avoid | "Lighting dominates measurement error, so the system coaches before it judges." |
| 5 | Failure first | Upload `no-face.jpg` → analyse | "Guardrails: a structured error with retake tips — codes, not stack traces." |
| 6 | Real analysis | Camera capture (or the valid fixture) → analyse | "Under a second warm: quality gate → landmarks → skin ROIs → CIE Lab → classification." |
| 7 | Undertone + season | Read the headline + confidence badge | "Estimated undertone, suggested season; the sub-season appears only above the confidence gate." |
| 8 | Explainability | Open *Why this result* | "Evidence generated from measured signals — hue angle, b\*, region agreement — never invented." |
| 9 | Fashion palette | Scroll groups; copy a HEX; heart a colour; show *Use with care* wording; press Print | "Eight wardrobe groups including hijab tones; cautions are gentle, never 'forbidden'." |
| 10 | Cosmetics | Show the cosmetic directions | "Shade families plus an honest foundation *direction* — no fake shade matching from a photo." |
| 11 | Products | History → detail → *Products for your palette*; click one external link | "Ranked by CIEDE2000 distance to the palette — the maths is documented; demo-labelled products, purchases happen externally, new tab, noopener." |
| 12 | Admin | Switch to admin → dashboard → Products toggle → CSV dry-run with `scripts/sample-products.csv` → audit log | "Anonymised aggregates only — admins cannot see anyone's analyses or photos. Every mutation lands in the append-only audit log." |
| 13 | Privacy finale | Back as demo user → Settings → Privacy → delete one analysis (and its photo) | "Per-item, whole-history, and full-account deletion — all cascade-verified by tests." |
| 14 | Close | Show `PROJECT_STATUS.md` / testing-report numbers | "189 unit, 56 integration, 21 RLS, 30 end-to-end checks — and everything you saw is deterministic and versioned." |

## Q&A safety notes

- Accuracy question → "No labelled dataset exists, so we claim consistency and explainability, not accuracy — the evaluation protocol is in the report."
- AI question → "Deliberately rule-based: auditable for an FYP and honest to users; an ML comparison against this baseline is documented future work."
- If the camera misbehaves on venue Wi-Fi/HTTPS → the upload path is the rehearsed fallback (identical pipeline).
