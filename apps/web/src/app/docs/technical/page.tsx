import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, Mono, RefTable, Section } from "@/components/docs/blocks";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Technical reference",
  description:
    "Engineering documentation for MatchLab — architecture, pipeline internals, colour science, API, database, security, and CI, from A to Z.",
  // Unlisted utility page: keep it out of search engines.
  robots: { index: false, follow: false },
};

const TOC = [
  ["system", "1 · System overview & request flow"],
  ["tooling", "2 · Monorepo & tooling"],
  ["frontend", "3 · Frontend architecture"],
  ["backend", "4 · Backend architecture"],
  ["pipeline", "5 · Pipeline internals, stage by stage"],
  ["colour", "6 · Colour science & formulas"],
  ["classification", "7 · Classification maths"],
  ["confidence", "8 · Confidence model"],
  ["matching", "9 · Product-matching algorithm"],
  ["api", "10 · API reference"],
  ["database", "11 · Database & row-level security"],
  ["security", "12 · Security engineering"],
  ["config", "13 · Configuration & versioning"],
  ["testing", "14 · Testing & CI"],
  ["performance", "15 · Performance notes"],
  ["ops", "16 · Deployment & operations"],
] as const;

export default function TechnicalDocsPage() {
  return (
    <div data-print-root className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="border-border border-b pb-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${siteConfig.name} home`}
          >
            <Image src="/logo.png" alt="" width={40} height={40} className="size-10 shrink-0" />
            <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
              {siteConfig.name}
            </span>
          </Link>
          <span className="border-border text-muted-foreground rounded-full border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]">
            Technical reference
          </span>
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          The engineering, from A to Z
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          How {siteConfig.name} is actually built: architecture, the analysis pipeline’s internals,
          the colour mathematics, the API surface, the database, and the security model. Every
          number on this page comes from the versioned engine config or the source code itself.
        </p>
        <div className="text-muted-foreground mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span>
            Presenter’s guide:{" "}
            <Link href="/docs" className="text-foreground underline">
              /docs
            </Link>
          </span>
          <span>
            Live app:{" "}
            <a href="https://matchlab-one.vercel.app" className="text-foreground underline">
              matchlab-one.vercel.app
            </a>
          </span>
        </div>
      </header>

      <div className="mt-10 gap-12 lg:flex">
        <nav
          aria-label="Contents"
          className="mb-10 shrink-0 lg:sticky lg:top-8 lg:mb-0 lg:w-64 lg:self-start print:hidden"
        >
          <p className="text-muted-foreground mb-3 font-mono text-[0.65rem] uppercase tracking-[0.14em]">
            Contents
          </p>
          <ul className="space-y-1.5 text-sm">
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-14">
          <Section id="system" title="1 · System overview & request flow">
            <p>
              Three deployed services, one direction of data flow. The browser talks to the Next.js
              app; every piece of application data goes through the FastAPI service; only
              authentication talks to Supabase directly.
            </p>
            <Mono>{`Browser ── HTTPS ──▶ Next.js 16 (Vercel)
   │                       │
   │  sign-in only         │  fetch /api/v1/* with  Authorization: Bearer <JWT>
   ▼                       ▼
Supabase Auth        FastAPI (Render, Docker) ──▶ PostgreSQL + Storage (Supabase)
(issues JWT)         · verifies the JWT itself
                     · runs the analysis pipeline in memory
                     · owns every SQL query (ownership-checked)`}</Mono>
            <p>A single analysis request, end to end:</p>
            <Mono>{`POST /api/v1/analyses  (multipart: image + optional questionnaire)
  → decode & normalise image (in memory, ≤ 10 MB, jpeg/png/webp)
  → quality gate (8 weighted checks, pass ≥ 55/100)
  → MediaPipe FaceLandmarker → 478 landmarks
  → sample skin ROIs (forehead, left cheek, right cheek)
  → white-patch white balance → CIELAB features
  → undertone → dimensions → season + sub-season
  → confidence (6 weighted factors)
  → JSON result stamped with classifierVersion  (~0.5 s on a laptop CPU)`}</Mono>
          </Section>

          <Section id="tooling" title="2 · Monorepo & tooling">
            <Mono>{`pnpm-workspace
├── apps/web                Next.js 16 · React 19 · TypeScript strict · Tailwind 4
├── apps/api                FastAPI · Python 3.12 (pinned, managed by uv)
├── packages/colour-engine  classifier-v1.json — the versioned rule config
├── packages/contracts      shared API types
└── supabase/               SQL migrations · RLS policies · generated seed`}</Mono>
            <RefTable
              head={["Concern", "Tool", "Notes"]}
              rows={[
                ["JS package manager", "pnpm", "Workspace filtering per app; single lockfile"],
                ["Python env", "uv", "Pins Python 3.12; system Python is never used"],
                ["Web quality", "prettier · eslint · tsc --noEmit · vitest", "All gate CI"],
                ["API quality", "ruff (lint+format) · mypy · pytest", "All gate CI"],
                ["E2E", "Playwright", "Full stack: web + API + database"],
                [
                  "Git flow",
                  "Conventional Commits",
                  "Feature branch → PR → all checks green → merge",
                ],
              ]}
            />
          </Section>

          <Section id="frontend" title="3 · Frontend architecture">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>App Router route groups:</strong> <code>(marketing)</code> public pages,{" "}
                <code>(app)</code> signed-in area (dashboard, history, favourites, settings),{" "}
                <code>(admin)</code> console, <code>(auth)</code> sign-in/register — each with its
                own layout shell.
              </li>
              <li>
                <strong>Server components by default;</strong> client components only where
                interactivity demands it (analysis wizard, palette view, forms).
              </li>
              <li>
                <strong>Data layer:</strong> TanStack Query 5 for fetching/caching/mutations against{" "}
                <code>/api/v1</code>; a thin typed client attaches the Supabase JWT as a bearer
                header.
              </li>
              <li>
                <strong>Forms:</strong> React Hook Form 7 + Zod 4 schemas — the same shapes the API
                validates again with Pydantic.
              </li>
              <li>
                <strong>UI:</strong> Tailwind CSS 4 design tokens (OKLCH palette) + shadcn/ui on
                Base UI. Dark mode via <code>next-themes</code>; accessibility checked with axe in
                tests.
              </li>
              <li>
                <strong>supabase-js is auth-only:</strong> session + JWT. It never reads or writes
                application tables from the browser.
              </li>
              <li>
                <strong>PWA:</strong> manifest + icons + a custom install prompt; OG/Twitter share
                images generated at the route level.
              </li>
            </ul>
          </Section>

          <Section id="backend" title="4 · Backend architecture">
            <p>Strict layering — each request passes through:</p>
            <Mono>{`app/api/v1/*        routers: validate input, resolve the user, call services
app/services/*      orchestration (e.g. product ranking, CSV import)
app/analysis/*      the pure engine — no framework imports, no I/O
app/repositories/*  SQL via SQLAlchemy 2 async — ownership in every WHERE
app/security/*      JWT verification (HS256 legacy · RS256/ES256 via JWKS)
app/core/*          settings (pydantic-settings), error envelope, logging`}</Mono>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Request lifecycle:</strong> slowapi rate-limit check → JWT verification
                (when required) → Pydantic validation → handler → structlog line with{" "}
                <code>request_id</code>, method, path, status, <code>duration_ms</code>. Image bytes
                never appear in logs.
              </li>
              <li>
                <strong>One error shape everywhere:</strong>{" "}
                <code>{`{ "error": { "code", "message", "details?", "requestId" } }`}</code> —
                machine-readable codes (<code>VALIDATION_ERROR</code>, <code>RATE_LIMITED</code>,
                …), never a raw stack trace.
              </li>
              <li>
                <strong>The engine is dependency-injected with its config</strong> — handlers load{" "}
                <code>classifier-v1.json</code> once and pass it in, which is what makes the
                pipeline unit-testable in isolation.
              </li>
              <li>
                <strong>MediaPipe is a lazy singleton:</strong> the vendored{" "}
                <code>face_landmarker.task</code> loads on first use and is reused across requests
                (TensorFlow Lite, CPU).
              </li>
            </ul>
          </Section>

          <Section id="pipeline" title="5 · Pipeline internals, stage by stage">
            <p>
              Modules under <code>apps/api/app/analysis/</code>, in execution order. Values in
              brackets come from <code>classifier-v1.json</code> v1.1.0.
            </p>
            <div className="space-y-3">
              <Card title="① preprocessing/ — decode & white balance">
                <p>
                  Decode (jpeg/png/webp, ≤ 10 MB, ≤ 50 MP), fix EXIF orientation, resize so the long
                  edge ≤ 1600 px (reject below 320 px). Then{" "}
                  <strong>white-patch white balance</strong>: take the brightest near-neutral pixels
                  (≥ 97th percentile, excluding clipped values &gt; 250), estimate the illuminant
                  from their mean, and apply per-channel von Kries gains toward grey — clamped to
                  1.5× so correction can never overshoot. On neutral light the gains are ≈ 1.0, so
                  real undertones are preserved.
                </p>
              </Card>
              <Card title="② quality/ — the gate (pass ≥ 55/100)">
                <p>Eight checks, combined with these weights:</p>
                <Mono>{`exposure 0.20 · pose 0.15 · sharpness 0.15
faceDetection 0.10 · faceSize 0.10 · lightingConsistency 0.10
colourCast 0.10 · usableSkinArea 0.10

sharpness   = variance of the Laplacian (classic blur metric)
colour cast = 0.6 × gray-world deviation + 0.4 × face-region consistency`}</Mono>
                <p>
                  Failing photos return actionable feedback (“retake in even daylight”) instead of a
                  low-quality classification.
                </p>
              </Card>
              <Card title="③ face_detection/ + landmarks/ — geometry only">
                <p>
                  MediaPipe FaceLandmarker produces 478 landmark points (Face Mesh topology). They
                  are used purely as geometry anchors; no embedding, no identity, no classification
                  comes from the model.
                </p>
              </Card>
              <Card title="④ skin_regions/ — ROI sampling">
                <p>
                  Polygons for <code>forehead</code>, <code>left_cheek</code> and{" "}
                  <code>right_cheek</code> are built from fixed landmark indices, deliberately
                  avoiding eyes, brows, lips and hairline. Pixels are outlier-trimmed (shadows,
                  specular highlights) before measurement.
                </p>
              </Card>
              <Card title="⑤ colour_features/ — measurement">
                <p>
                  Sampled pixels are converted sRGB → linear → XYZ → CIELAB (section 6), then
                  summarised per region: mean L*, a*, b*, chroma C* and hue angle h°, plus
                  cross-region agreement statistics.
                </p>
              </Card>
              <Card title="⑥ classification/ — undertone, dimensions, season">
                <p>Weighted, threshold-based scoring — detailed in section 7.</p>
              </Card>
              <Card title="⑦ confidence/ + explainability/ — the honest part">
                <p>
                  Confidence combines six measurable factors (section 8), and the explainability
                  payload records per-stage evidence (quality scores, region measurements, winning
                  margins) so the UI can show <em>why</em> a result was produced.
                </p>
              </Card>
            </div>
          </Section>

          <Section id="colour" title="6 · Colour science & formulas">
            <Card title="sRGB → CIELAB (hand-implemented in NumPy)">
              <Mono>{`1. linearise:   c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4
2. RGB → XYZ:   3×3 matrix (sRGB primaries, D65 white point)
3. XYZ → Lab:   f(t) = t^(1/3)            if t > (6/29)³
                       t/(3·(6/29)²)+4/29  otherwise
                L* = 116·f(Y/Yn) − 16
                a* = 500·(f(X/Xn) − f(Y/Yn))
                b* = 200·(f(Y/Yn) − f(Z/Zn))
4. derived:     chroma C* = √(a*² + b*²) · hue h° = atan2(b*, a*)`}</Mono>
              <p>
                Implemented in <code>colour_features/conversions.py</code>; the full CIEDE2000
                formula (with its lightness/chroma/hue weighting and rotation term) lives in{" "}
                <code>colour_features/ciede2000.py</code> and is exercised directly by unit tests.
              </p>
            </Card>
            <Card title="Why CIELAB and not RGB?">
              <p>
                RGB distances do not match human perception — equal numeric steps look bigger in
                some hues than others. CIELAB is designed to be perceptually approximately uniform,
                which makes thresholds meaningful and lets CIEDE2000 measure “how different does
                this look”, not “how different are the bytes”.
              </p>
            </Card>
          </Section>

          <Section id="classification" title="7 · Classification maths">
            <div className="space-y-3">
              <Card title="Step 1 — undertone (warm / cool)">
                <Mono>{`undertone score = 0.55 × hue-angle signal
               + 0.30 × b* (yellow–blue) signal
               + 0.15 × cross-region agreement
questionnaire contributes 12% when answered (vein colour,
jewellery preference, sun reaction) — never more than the photo.`}</Mono>
                <p>
                  A configured neutral band around the warm/cool boundary maps to “uncertain” rather
                  than forcing a coin-flip answer.
                </p>
              </Card>
              <Card title="Step 2 — the three dimensions">
                <p>
                  <strong>value</strong> (light ↔ deep, from L*), <strong>chroma</strong> (soft ↔
                  clear, from C*), and <strong>contrast</strong> — contrast blends an image proxy
                  (0.35) with the questionnaire (0.65), because true hair/eye contrast is hard to
                  measure from one photo.
                </p>
              </Card>
              <Card title="Step 3 — season & sub-season">
                <Mono>{`season score = 0.40 × temperature (undertone)
             + 0.25 × value
             + 0.20 × chroma
             + 0.15 × contrast
→ best of {Spring, Summer, Autumn, Winter}
→ sub-season = the season's variant profile closest to the
  measured dimensions (12 total, e.g. Light Summer)`}</Mono>
                <p>
                  The gap between the winning and runner-up season becomes the{" "}
                  <em>classification margin</em> used by the confidence model — a narrow win is
                  reported as lower confidence, not hidden.
                </p>
              </Card>
            </div>
          </Section>

          <Section id="confidence" title="8 · Confidence model">
            <Mono>{`confidence = 0.30 × imageQuality
           + 0.20 × roiConsistency
           + 0.20 × classificationMargin
           + 0.15 × usableSkinArea
           + 0.10 × colourCastPenalty
           + 0.05 × questionnaireAgreement

label: High ≥ 0.80 · Medium ≥ 0.60 · Low < 0.60`}</Mono>
            <p>
              Every factor is a measurement, not a guess — and the colour cast is measured on the{" "}
              <em>original</em> image (before white balance), so the correction improves accuracy
              without inflating the score.
            </p>
          </Section>

          <Section id="matching" title="9 · Product-matching algorithm">
            <Mono>{`match score = 0.50 × palette colour distance   (CIEDE2000)
            + 0.20 × season tag match
            + 0.10 × sub-season tag match
            + 0.10 × category relevance
            + 0.10 × availability

colour distance → score:  exp(−ΔE00 / 25)   (falloff constant 25)
top 24 recommendations returned, best-first`}</Mono>
            <p>
              Each product carries a curated colour; its CIEDE2000 distance to the user’s nearest
              palette colour is converted to a score with an exponential falloff, then blended with
              tag and metadata signals. The “For” (audience) filter is a user-chosen shopping
              preference — never inferred from the face.
            </p>
          </Section>

          <Section id="api" title="10 · API reference">
            <p>
              All routes live under <code>/api/v1</code>. <em>Public</em> needs no token;{" "}
              <em>User</em> requires a valid Supabase JWT; <em>Admin</em> additionally requires the
              server-side admin check.
            </p>
            <RefTable
              minWidth="34rem"
              head={["Access", "Endpoint", "Purpose"]}
              rows={[
                ["Public", "GET /health · GET /readiness", "Liveness / readiness probes"],
                [
                  "Public",
                  "GET /seasons · GET /seasons/{slug}",
                  "Season list and full palette detail",
                ],
                [
                  "Public",
                  "GET /products · GET /products/{id}",
                  "Catalogue with search/filter/sort",
                ],
                ["Public", "GET /stores", "Active stores for the filter dropdown"],
                ["Public*", "POST /analyses", "Run an analysis (guest or signed-in)"],
                [
                  "Public*",
                  "POST /analyses/preview-quality",
                  "Fast quality pre-check before analysing",
                ],
                ["User", "POST /analyses/{id}/save-image", "Opt-in image save (private bucket)"],
                ["User", "GET/PATCH /me · /me/preferences", "Profile + shopping preferences"],
                ["User", "POST/DELETE favourites", "Favourite colours and products"],
                ["User", "POST /me/consents", "Versioned consent records"],
                [
                  "Admin",
                  "CRUD /stores · /products · /palette-colours · /cosmetics",
                  "Catalogue management",
                ],
                [
                  "Admin",
                  "POST /products/import · GET /products/imports",
                  "CSV import jobs + row errors",
                ],
                ["Admin", "GET /stats · PATCH /seasons/{slug}", "Dashboard stats · palette copy"],
              ]}
            />
            <p className="text-muted-foreground text-sm">
              * Guest analyses run fully but persist nothing; signed-in analyses are stored and
              appear in history.
            </p>
          </Section>

          <Section id="database" title="11 · Database & row-level security">
            <p>PostgreSQL (Supabase), ~24 tables in five clusters:</p>
            <RefTable
              minWidth="32rem"
              head={["Cluster", "Tables", "Notes"]}
              rows={[
                [
                  "Identity",
                  "profiles · user_preferences · user_consents",
                  "Profile mirrors auth.users; consents are versioned rows",
                ],
                [
                  "Analysis",
                  "analyses · analysis_classifications · analysis_quality_metrics · analysis_colour_samples · analysis_images",
                  "One analysis → its classification, metrics, samples, optional image ref",
                ],
                [
                  "Palette",
                  "colour_seasons · colour_subseasons · palette_colours · cosmetic_recommendations",
                  "Seed-generated from the engine config",
                ],
                [
                  "Catalogue",
                  "stores · products · product_colours · product_season_tags · product_import_jobs · product_import_errors",
                  "Admin CSV import writes jobs + per-row errors",
                ],
                [
                  "Favourites & audit",
                  "user_favourite_colours · user_favourite_products · admin_audit_logs · algorithm_versions · system_settings · content_pages",
                  "Admin actions are audit-logged",
                ],
              ]}
            />
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>RLS strategy:</strong> row-level security policies protect the direct
                PostgREST surface, but the API connects as the table owner — so the real enforcement
                is <em>ownership checks inside every repository query</em>. Defence in depth, with
                the strict layer in our own code.
              </li>
              <li>
                <strong>Migrations:</strong> plain SQL files in <code>supabase/migrations/</code>,
                applied in order; the seed is <em>generated</em> from the engine config by{" "}
                <code>scripts/generate_seed.py</code>, and CI fails if the two drift apart.
              </li>
            </ul>
          </Section>

          <Section id="security" title="12 · Security engineering">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>JWT verification (server-side):</strong> supports the legacy shared-secret
                HS256 path and asymmetric RS256/ES256 verified against the project’s JWKS endpoint
                (keys cached ~5 minutes). Tokens must carry the <code>authenticated</code> audience,
                an expiry, and a <code>sub</code> claim — the user id is always taken from the
                token, never from the request body.
              </li>
              <li>
                <strong>CORS</strong> is pinned to the exact frontend origin;{" "}
                <strong>rate limiting</strong> (slowapi) caps abusive traffic and returns the{" "}
                <code>RATE_LIMITED</code> envelope.
              </li>
              <li>
                <strong>Browser hardening (next.config):</strong> a Content-Security-Policy with
                pinned <code>connect-src</code>, <code>frame-ancestors &apos;none&apos;</code> +{" "}
                <code>X-Frame-Options: DENY</code>, <code>nosniff</code>, a strict{" "}
                <code>Referrer-Policy</code> and a Permissions-Policy that only allows the camera
                for the app itself.
              </li>
              <li>
                <strong>Privacy enforcement points:</strong> guest images exist only in request
                memory; the opt-in save path writes to a <em>private</em> bucket and every read goes
                through short-lived signed URLs; logs carry request metadata only — no image bytes,
                ever.
              </li>
              <li>
                <strong>Admin</strong> is verified server-side per request and every admin mutation
                lands in <code>admin_audit_logs</code>.
              </li>
              <li>
                <strong>Secrets</strong> live in platform env vars (Vercel/Render/Supabase); nothing
                sensitive is committed — CI has no access to production keys.
              </li>
            </ul>
          </Section>

          <Section id="config" title="13 · Configuration & versioning">
            <p>
              <code>packages/colour-engine/config/classifier-v1.json</code> is the single source of
              truth for every threshold. Its top-level shape:
            </p>
            <Mono>{`{
  "version": "1.1.0",
  "whiteBalance":   { enabled, brightPercentile: 0.97, clipCeiling: 250,
                      strength: 1.0, gainClamp: 1.5 },
  "image":          { maxUploadMb: 10, allowedFormats, minEdgePixels: 320,
                      maxAnalysisEdgePixels: 1600, maxDecodedPixels: 5e7 },
  "quality":        { minOverallScore: 55, componentWeights, per-check params },
  "roi":            { region definitions + trimming },
  "undertone":      { signalWeights, neutralBandWidth, questionnaireWeight },
  "dimensions":     { value, chroma, contrast },
  "seasons":        { dimensionWeights, per-season profiles },
  "subSeasons":     { 12 variant profiles },
  "confidence":     { factorWeights, labels },
  "productMatching":{ weights, deltaE00Falloff, maxRecommendations }
}`}</Mono>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>No magic numbers rule:</strong> analysis code contains no literal
                thresholds; changing behaviour means changing config, visibly, in review.
              </li>
              <li>
                <strong>Version stamping:</strong> every stored result records the config version
                that produced it (<code>analyses.classifier_version</code>), so historical results
                stay interpretable after tuning.
              </li>
              <li>
                <strong>Change protocol:</strong> a new behaviour ships as a new version (the
                white-balance stage bumped 1.0.0 → 1.1.0), with the seed regenerated and the CI
                drift check proving config and database agree.
              </li>
            </ul>
          </Section>

          <Section id="testing" title="14 · Testing & CI">
            <RefTable
              head={["Suite", "Runner", "What it proves"]}
              rows={[
                [
                  "API unit",
                  "pytest",
                  "Colour maths (incl. CIEDE2000 reference values), quality gates, white balance on synthetic cast fixtures, classifier behaviour, determinism",
                ],
                ["API integration", "pytest -m integration", "Endpoints against a real PostgreSQL"],
                ["RLS proof", "pytest (db)", "Policies actually block cross-user access"],
                ["Web unit", "vitest + Testing Library", "Components, hooks, form validation"],
                [
                  "End-to-end",
                  "Playwright",
                  "Guest analysis journey, auth flows, axe accessibility checks",
                ],
              ]}
            />
            <p>
              Five CI gates run on every pull request: web (format/lint/typecheck/test/build), API
              (ruff/mypy/pytest), database (migrations + RLS proof + seed-drift), the API Docker
              build, and the full-stack Playwright suite. Test photos are a public-domain image plus
              synthetic variants — no scraped or private faces.
            </p>
          </Section>

          <Section id="performance" title="15 · Performance notes">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                A full analysis completes in roughly half a second on CPU: one landmark inference
                plus vectorised NumPy over at most a 1600 px image — no GPU required.
              </li>
              <li>
                The API is fully async (FastAPI + asyncpg); the MediaPipe model loads once and is
                reused; images are processed strictly in memory.
              </li>
              <li>
                The frontend statically prerenders public pages on Vercel’s CDN; client caching is
                handled by TanStack Query with a 30-second stale time.
              </li>
              <li>
                The service is stateless — nothing analysis-related is held between requests — so it
                scales horizontally by adding containers.
              </li>
            </ul>
          </Section>

          <Section id="ops" title="16 · Deployment & operations">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Vercel</strong> builds <code>apps/web</code> (preview per PR, production on
                merge to <code>main</code>) — currently{" "}
                <a href="https://matchlab-one.vercel.app" className="underline">
                  matchlab-one.vercel.app
                </a>
                .
              </li>
              <li>
                <strong>Render</strong> runs the API from <code>apps/api/Dockerfile</code> (built
                for <code>linux/amd64</code>; MediaPipe needs <code>libgles2</code>/
                <code>libegl1</code> at runtime).
              </li>
              <li>
                <strong>Supabase</strong> hosts PostgreSQL, Auth and Storage; schema changes ship as
                migrations from the repo.
              </li>
              <li>
                <strong>Environment contract:</strong> the web needs the API URL + Supabase URL/anon
                key; the API needs the database URL, Supabase keys, and the exact frontend origin
                for CORS. Rotating a domain means updating Supabase Auth redirect URLs, the API’s
                frontend origin, and the web’s app-URL variable.
              </li>
              <li>
                <strong>Rollback:</strong> Vercel promotes any previous deployment; Render
                re-deploys the previous image; config changes roll back by version file, never by
                editing history.
              </li>
            </ul>
          </Section>

          <footer className="border-border text-muted-foreground border-t pt-6 text-xs leading-relaxed">
            <p>
              {siteConfig.name} technical reference — an internal, unlisted engineering document.
              Figures are read from <code>classifier-v1.json</code> (v1.1.0) and the source tree; if
              the config version changes, re-check the numbers here.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
