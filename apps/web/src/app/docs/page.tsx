import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, QA, Section, Step } from "@/components/docs/blocks";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Project guide",
  description:
    "Presenter’s guide to MatchLab — how the system works from A to Z, for the FYP presentation.",
  // Unlisted utility page: keep it out of search engines.
  robots: { index: false, follow: false },
};

const TOC = [
  ["overview", "1 · What MatchLab is"],
  ["objectives", "2 · Problem & objectives"],
  ["journey", "3 · User journey (8 screens)"],
  ["pipeline", "4 · Analysis pipeline, step by step"],
  ["confidence", "5 · The confidence score"],
  ["seasons", "6 · Seasons & sub-seasons"],
  ["products", "7 · Product matching & shopping"],
  ["architecture", "8 · Architecture & tech stack"],
  ["model", "9 · The model & key libraries"],
  ["code", "10 · Code structure & API design"],
  ["privacy", "11 · Privacy & ethics"],
  ["quality", "12 · Quality assurance"],
  ["deployment", "13 · Deployment"],
  ["limitations", "14 · Honest limitations"],
  ["qna", "15 · Likely questions & answers"],
  ["glossary", "16 · Glossary"],
] as const;

const CONFIDENCE_FACTORS = [
  ["Image quality", "0.30", "Sharpness, exposure, lighting and face-size checks from the photo."],
  ["ROI consistency", "0.20", "How much the sampled skin regions agree with each other."],
  ["Classification margin", "0.20", "How decisively the winning season beat the runner-up."],
  ["Usable skin area", "0.15", "How much clean skin was available to sample."],
  ["Colour-cast penalty", "0.10", "Penalises photos with a strong colour tint."],
  ["Questionnaire agreement", "0.05", "Whether self-reported answers agree with the photo."],
] as const;

const SUB_SEASONS = [
  ["Spring", "Light Spring · Warm Spring · Bright Spring"],
  ["Summer", "Light Summer · Cool Summer · Soft Summer"],
  ["Autumn", "Soft Autumn · Warm Autumn · Deep Autumn"],
  ["Winter", "Cool Winter · Deep Winter · Bright Winter"],
] as const;

export default function DocsPage() {
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
            Project guide
          </span>
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          {siteConfig.name}, explained from A to Z
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          Everything a presenter needs to know about this Final Year Project — what it does, how the
          analysis works, the technology behind it, and answers to the questions examiners usually
          ask. Print this page or keep it open during preparation.
        </p>
        <div className="text-muted-foreground mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span>
            Live app:{" "}
            <a href="https://matchlab-one.vercel.app" className="text-foreground underline">
              matchlab-one.vercel.app
            </a>
          </span>
          <span>
            Prototype screens:{" "}
            <Link href="/prototype" className="text-foreground underline">
              /prototype
            </Link>
          </span>
          <span>
            Technical A–Z:{" "}
            <Link href="/docs/technical" className="text-foreground underline">
              /docs/technical
            </Link>
          </span>
        </div>
      </header>

      <div className="mt-10 gap-12 lg:flex">
        <nav
          aria-label="Contents"
          className="mb-10 shrink-0 lg:sticky lg:top-8 lg:mb-0 lg:w-60 lg:self-start print:hidden"
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
          <Section id="overview" title="1 · What MatchLab is">
            <p>
              {siteConfig.name} is a web application that analyses a single facial photo and returns
              an <strong>estimated undertone</strong> (warm or cool), a{" "}
              <strong>suggested colour season</strong> (Spring, Summer, Autumn or Winter, refined
              into a sub-season such as Light Summer), a <strong>personal palette</strong> of
              fashion and cosmetic colours, and <strong>colour-matched product ideas</strong> from
              real Malaysian-relevant stores.
            </p>
            <p>
              The one-sentence pitch:{" "}
              <em>
                “Snap a selfie and get the colours that suit you — then shop them — in seconds,
                privately, and without pseudo-science.”
              </em>
            </p>
            <Card title="Quick facts">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Engine: <strong>rule-based and deterministic</strong> — documented colour science,
                  not a trained AI/ML model. The same photo always gives the same result.
                </li>
                <li>
                  Every threshold lives in a versioned config (<code>classifier-v1.json</code>,
                  currently engine version 1.1.0); each result is stamped with the version that
                  produced it.
                </li>
                <li>Works for guests — no account needed; guest photos are never stored.</li>
                <li>4 seasons → 12 sub-seasons → palette groups + cosmetics + products.</li>
                <li>Frontend on Vercel, API on Render, database/auth/storage on Supabase.</li>
              </ul>
            </Card>
          </Section>

          <Section id="objectives" title="2 · Problem & objectives">
            <p>
              Professional personal-colour analysis is expensive, subjective between consultants,
              and not accessible to most people. Online alternatives are often gimmicky, make
              unverifiable “AI accuracy” claims, or quietly harvest face photos.
            </p>
            <p>The project set out to build a system that is:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Accessible</strong> — a selfie and a browser is all it takes; free to try as
                a guest.
              </li>
              <li>
                <strong>Honest</strong> — results are framed as <em>estimated</em> and{" "}
                <em>suggested</em>, with a transparent confidence score, never as medical, biometric
                or “99% accurate” claims.
              </li>
              <li>
                <strong>Explainable</strong> — a deterministic, rule-based engine whose every
                threshold is documented and versioned, so any result can be traced to the rules that
                produced it.
              </li>
              <li>
                <strong>Privacy-first</strong> — explicit consent, no guest image ever persisted,
                storage strictly opt-in for signed-in users.
              </li>
              <li>
                <strong>Actionable</strong> — the palette connects to real products and marketplace
                searches, so advice turns into outfits.
              </li>
            </ul>
          </Section>

          <Section id="journey" title="3 · User journey (8 screens)">
            <p>
              The flow mirrors the numbered prototype (
              <Link href="/prototype" className="underline">
                /prototype
              </Link>
              ):
            </p>
            <ol className="space-y-3">
              <Step n="1" title="Landing">
                Marketing page with the value proposition and a Start-analysis call to action.
                Public — no login required.
              </Step>
              <Step n="2" title="Sign in (optional)">
                Email + password via Supabase Auth. Guests can analyse without an account; an
                account unlocks saving results, favourites and history.
              </Step>
              <Step n="3" title="Consent">
                Explicit, plain-language consent before any image is processed. A separate,
                unticked-by-default checkbox controls whether a signed-in user’s photo is saved.
              </Step>
              <Step n="4" title="Scan / upload">
                Camera capture or file upload, with guidance (front-facing, even natural light, no
                filters). Optional short questionnaire about vein colour, jewellery preference and
                sun reaction.
              </Step>
              <Step n="5" title="Result">
                Estimated undertone + season + sub-season with a confidence label (High / Medium /
                Low) and the quality checks that fed it. Honest framing throughout.
              </Step>
              <Step n="6" title="Colour palette">
                The personal palette in groups — neutrals, core, accents, formal, casual,
                accessories, hijab &amp; headwear, and “use with care” — plus cosmetic directions.
                Printable as a palette card (PDF).
              </Step>
              <Step n="7" title="Shop your palette">
                One tap opens a marketplace search (Shopee, Lazada, Zalora, TikTok, Google Shopping
                — region MY) pre-filled with the chosen palette colour and category.
              </Step>
              <Step n="8" title="Products">
                The internal catalogue ranked against the user’s palette by colour distance, with
                store, category, season and audience filters.
              </Step>
            </ol>
          </Section>

          <Section id="pipeline" title="4 · Analysis pipeline, step by step">
            <p>
              Everything below runs server-side in the FastAPI service, in memory, in a few seconds.
              The image is processed and discarded — nothing is written to disk unless a signed-in
              user explicitly opted in.
            </p>
            <ol className="space-y-3">
              <Step n="1" title="Upload & decode">
                The browser sends the photo over HTTPS to the API. It is decoded and normalised
                (size, orientation, colour space) entirely in memory.
              </Step>
              <Step n="2" title="Quality gate">
                Checks for face size, pose, blur, exposure, lighting, colour cast and usable skin
                area. Each produces a score; failing photos get actionable feedback (“retake in
                daylight”) instead of a low-quality result.
              </Step>
              <Step n="3" title="Face landmarks">
                Google’s MediaPipe FaceLandmarker locates ~478 facial landmarks. They are used only
                to find skin regions — never for identity. The model runs locally inside the API
                container.
              </Step>
              <Step n="4" title="Skin sampling (ROI)">
                Regions of interest — cheeks, forehead, jaw — are sampled while excluding eyes,
                lips, brows and hair. Outlier pixels (shadows, specular highlights) are trimmed.
              </Step>
              <Step n="5" title="White balance (v1.1.0)">
                A white-patch correction estimates the light source from the brightest near-neutral
                pixels and normalises it (von Kries gains). This makes results far more stable under
                warm/cool indoor lighting — without erasing the person’s real undertone (the
                correction is ≈identity on neutral light).
              </Step>
              <Step n="6" title="Colour measurement">
                Sampled skin is converted to the CIELAB colour space. The engine measures undertone
                signals (e.g. b* yellow–blue balance, hue angle), lightness and chroma.
              </Step>
              <Step n="7" title="Classification">
                Warm/cool undertone is decided from the weighted signals (the optional questionnaire
                contributes a small weight). Season and sub-season are then scored across dimensions
                (undertone, depth, clarity/contrast) against versioned thresholds. No magic numbers
                in code — every threshold is in <code>classifier-v1.json</code>.
              </Step>
              <Step n="8" title="Confidence & result">
                Six weighted factors produce a 0–1 confidence score and label (see next section).
                The result is stamped with the classifier version and returned; signed-in users can
                save it to history.
              </Step>
            </ol>
          </Section>

          <Section id="confidence" title="5 · The confidence score">
            <p>
              Confidence is a transparent, weighted combination of six measurable factors — not a
              guess:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-sm">
                <thead>
                  <tr className="border-border border-b text-left">
                    <th className="py-2 pr-3 font-semibold">Factor</th>
                    <th className="py-2 pr-3 font-semibold">Weight</th>
                    <th className="py-2 font-semibold">What it measures</th>
                  </tr>
                </thead>
                <tbody>
                  {CONFIDENCE_FACTORS.map(([name, weight, desc]) => (
                    <tr key={name} className="border-border/60 border-b align-top">
                      <td className="whitespace-nowrap py-2 pr-3 font-medium">{name}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums">{weight}</td>
                      <td className="text-muted-foreground py-2">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Labels: <strong>High</strong> ≥ 0.80 · <strong>Medium</strong> ≥ 0.60 ·{" "}
              <strong>Low</strong> below that. A low score is presented as an invitation to retake
              the photo in better light — not hidden.
            </p>
          </Section>

          <Section id="seasons" title="6 · Seasons & sub-seasons">
            <p>
              Seasonal colour analysis groups people by how their natural colouring (undertone,
              depth, clarity) harmonises with families of colours. {siteConfig.name} uses the
              classic 4 seasons refined into 12 sub-seasons:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SUB_SEASONS.map(([season, subs]) => (
                <Card key={season} title={season}>
                  <p>{subs}</p>
                </Card>
              ))}
            </div>
            <p>
              Each sub-season carries a curated palette in the database: neutrals, core colours,
              accents, dress-code groups (formal/casual), accessories, hijab &amp; headwear tones, a
              “use with care” list, and cosmetic directions (lipstick, blusher, eyeshadow, eyeliner,
              highlighter, and a foundation <em>direction</em> — never a specific shade match, which
              would require in-person testing).
            </p>
          </Section>

          <Section id="products" title="7 · Product matching & shopping">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Ranking:</strong> each catalogue product carries a colour; it is compared to
                the user’s palette using <strong>CIEDE2000</strong> (ΔE2000) — the industry-standard
                perceptual colour-difference formula in CIELAB space. Smaller distance = better
                match; the UI shows a match percentage.
              </li>
              <li>
                <strong>Filters:</strong> search, category, season, store and audience. The audience
                (“For”) filter is a <strong>user-chosen shopping preference</strong> — deliberately
                never inferred from the face.
              </li>
              <li>
                <strong>Catalogue:</strong> managed in the admin console via CSV import; product
                images come from the stores’ public product data (e.g. Shopify endpoints for
                TudungPeople). Purchases always happen on the external store — the app links out.
              </li>
              <li>
                <strong>Shop your palette:</strong> for anything not in the catalogue, deep links
                open a pre-filled colour search on Shopee, Lazada, Zalora, TikTok or Google Shopping
                (region MY). Framed as search assistance; listings belong to the stores.
              </li>
            </ul>
          </Section>

          <Section id="architecture" title="8 · Architecture & tech stack">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card title="Frontend — apps/web">
                <p>
                  Next.js 16 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, TanStack
                  Query, React Hook Form + Zod. Deployed on Vercel. Installable as a PWA.
                </p>
              </Card>
              <Card title="API — apps/api">
                <p>
                  FastAPI on Python 3.12 (managed by uv), OpenCV (headless), MediaPipe
                  FaceLandmarker, NumPy, SQLAlchemy async. Docker image deployed on Render.
                </p>
              </Card>
              <Card title="Data — Supabase">
                <p>
                  PostgreSQL with row-level security, Supabase Auth (JWT), private Storage bucket
                  with signed URLs for opt-in photos. SQL migrations versioned in the repo.
                </p>
              </Card>
            </div>
            <p className="font-mono text-xs sm:text-sm">
              Browser → Next.js (Vercel) → REST <code>/api/v1</code> with JWT bearer → FastAPI
              (Render) → PostgreSQL / Storage (Supabase)
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Monorepo</strong> (pnpm): <code>apps/web</code>, <code>apps/api</code>,{" "}
                <code>packages/colour-engine</code> (the versioned classifier config),{" "}
                <code>supabase/</code> (migrations, policies, seed).
              </li>
              <li>
                supabase-js is used for <em>auth only</em>; all application data flows through the
                FastAPI API, which checks ownership on every query and returns a consistent error
                envelope.
              </li>
              <li>
                The colour engine is pure and framework-free — the same rules are testable in
                isolation, and the config file is the single source of truth for thresholds.
              </li>
            </ul>
          </Section>

          <Section id="model" title="9 · The model & key libraries">
            <Card title="The only pretrained model: MediaPipe FaceLandmarker">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Google’s <strong>FaceLandmarker</strong> (Face Mesh topology,{" "}
                  <strong>478 landmark points</strong>) — an open-source, Apache-2.0 licensed model,
                  vendored into the repo as <code>apps/api/models/face_landmarker.task</code>.
                </li>
                <li>
                  It runs <strong>in-process inside the API container</strong> (CPU, via TensorFlow
                  Lite), loaded lazily as a singleton. No external AI API is called — the photo
                  never leaves our server.
                </li>
                <li>
                  We did <strong>not train or fine-tune</strong> anything, and the model’s output is
                  used <em>only</em> to locate skin regions geometrically — every decision after
                  that is our own rule-based code.
                </li>
              </ul>
            </Card>
            <p>The libraries around it, and what each is responsible for:</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-sm">
                <thead>
                  <tr className="border-border border-b text-left">
                    <th className="py-2 pr-3 font-semibold">Layer</th>
                    <th className="py-2 pr-3 font-semibold">Library</th>
                    <th className="py-2 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {(
                    [
                      [
                        "API",
                        "FastAPI + Pydantic v2",
                        "Async REST endpoints, request/response validation",
                      ],
                      [
                        "Vision",
                        "MediaPipe ≥ 0.10",
                        "Face landmarks (478 points) — the only ML component",
                      ],
                      [
                        "Imaging",
                        "OpenCV (headless) + Pillow",
                        "Decode, resize, orientation, pixel operations",
                      ],
                      ["Maths", "NumPy", "Vectorised colour maths over sampled pixels"],
                      [
                        "Database",
                        "SQLAlchemy 2 async + asyncpg",
                        "Typed queries to PostgreSQL, repository layer",
                      ],
                      [
                        "Auth",
                        "PyJWT + JWKS client",
                        "Verify Supabase JWTs (HS256 legacy, RS256/ES256)",
                      ],
                      [
                        "Observability",
                        "structlog + slowapi",
                        "Structured request logs with requestId; rate limiting",
                      ],
                      [
                        "Web",
                        "Next.js 16 + React 19 + TypeScript strict",
                        "App Router frontend, server components",
                      ],
                      [
                        "Web data",
                        "TanStack Query 5",
                        "Client-side data fetching, caching, mutations",
                      ],
                      [
                        "Forms",
                        "React Hook Form 7 + Zod 4",
                        "Forms with schema validation on the client",
                      ],
                      [
                        "UI",
                        "Tailwind CSS 4 + shadcn/ui",
                        "Design system and accessible components",
                      ],
                      ["Auth (web)", "supabase-js", "Sign-in/session only — never data access"],
                    ] as const
                  ).map(([layer, lib, role]) => (
                    <tr key={lib} className="border-border/60 border-b align-top">
                      <td className="text-foreground whitespace-nowrap py-2 pr-3 font-medium">
                        {layer}
                      </td>
                      <td className="py-2 pr-3">{lib}</td>
                      <td className="py-2">{role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Card title="Hand-implemented (not from a library)">
              <p>
                The colour science itself is written from scratch in NumPy, in{" "}
                <code>apps/api/app/analysis/</code>:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Colour-space conversions: sRGB → linear RGB → XYZ → <strong>CIELAB</strong>, plus
                  chroma and hue-angle helpers (<code>colour_features/conversions.py</code>).
                </li>
                <li>
                  The full <strong>CIEDE2000</strong> colour-difference formula (
                  <code>colour_features/ciede2000.py</code>).
                </li>
                <li>
                  <strong>White-patch white balance</strong> with von Kries channel gains (
                  <code>preprocessing/white_balance.py</code>).
                </li>
                <li>
                  Quality gates (blur via Laplacian variance, exposure, lighting, colour cast, face
                  size, pose), ROI polygons from landmark indices, the season/sub-season classifier,
                  the confidence model, and the explainability payload.
                </li>
              </ul>
            </Card>
          </Section>

          <Section id="code" title="10 · Code structure & API design">
            <p>One pnpm monorepo, four top-level pieces:</p>
            <pre className="border-border bg-card overflow-x-auto rounded-2xl border p-4 font-mono text-xs leading-relaxed">
              {`apps/web/                  Next.js 16 frontend (App Router, TS strict)
apps/api/                  FastAPI service (Python 3.12, managed by uv)
  app/api/v1/              thin routers only (validation + auth + calling services)
  app/analysis/            the pure, framework-free engine:
    preprocessing/  quality/  face_detection/  landmarks/
    skin_regions/  colour_features/  classification/
    confidence/  explainability/  pipeline.py
  app/repositories/        SQL queries (ownership checked on every query)
  app/security/            JWT verification (HS256 legacy + RS256/ES256 via JWKS)
packages/colour-engine/    classifier-v1.json — every threshold, versioned
supabase/                  SQL migrations, RLS policies, generated seed`}
            </pre>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Routers stay thin; the engine stays pure.</strong>{" "}
                <code>app/analysis/</code> has no framework imports and no I/O — it takes an image
                and a config, returns a result. That is what makes it deterministic and easy to
                unit-test.
              </li>
              <li>
                <strong>No magic numbers rule:</strong> analysis code contains no literal thresholds
                — everything (quality cut-offs, undertone signal weights, season scoring, confidence
                weights) comes from <code>classifier-v1.json</code>, and every stored result records
                the config version that produced it.
              </li>
              <li>
                <strong>Auth flow:</strong> Supabase issues the JWT at sign-in; the browser sends it
                as a bearer token; the API verifies signature, expiry and the{" "}
                <code>authenticated</code> audience (shared-secret HS256 or asymmetric RS256/ES256
                against the project’s JWKS endpoint, cached). The user id comes from the token’s{" "}
                <code>sub</code> claim — never from the request body.
              </li>
              <li>
                <strong>Every response is predictable:</strong> errors use one envelope —{" "}
                <code>{`{ "error": { "code", "message", "details?", "requestId" } }`}</code> — no
                raw stack traces; requests are rate-limited (slowapi) and logged with structlog
                (request id, duration, status — never image bytes).
              </li>
              <li>
                <strong>Database:</strong> ~24 PostgreSQL tables (analyses and their
                classifications/quality metrics/colour samples, seasons → sub-seasons → palette
                colours, products/stores/import jobs, favourites, consents, audit logs). Row-level
                security is enabled as defence-in-depth, and the API additionally enforces ownership
                inside every repository query.
              </li>
              <li>
                <strong>Validation on both ends:</strong> Zod schemas in the browser, Pydantic
                models in the API — malformed input never reaches the engine.
              </li>
            </ul>
          </Section>

          <Section id="privacy" title="11 · Privacy & ethics">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Guest photos are never stored</strong> — processed in memory, then
                discarded. No image bytes ever appear in logs.
              </li>
              <li>
                <strong>Saving is opt-in</strong> for signed-in users only, via an unticked checkbox
                at consent; stored images live in a private bucket accessible only through
                short-lived signed URLs, and can be deleted by the user.
              </li>
              <li>
                <strong>No identity recognition.</strong> Landmarks locate skin regions; the system
                never identifies, verifies or matches faces.
              </li>
              <li>
                <strong>Honest language by rule:</strong> “estimated”, “suggested”, “confidence” —
                no medical, dermatological, biometric or accuracy claims anywhere in the UI.
              </li>
              <li>
                Gender is a shopping preference chosen by the user — never detected from the photo.
              </li>
            </ul>
          </Section>

          <Section id="quality" title="12 · Quality assurance">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Determinism as a testable property:</strong> the same photo always produces
                the same result — regression tests hold this across changes.
              </li>
              <li>
                <strong>Automated suites</strong> across the stack: API unit tests (colour maths,
                pipeline stages, white balance on synthetic colour-cast fixtures), API integration
                tests, database RLS-proof tests, web unit tests, and full-stack Playwright
                end-to-end tests — all run in CI on every pull request.
              </li>
              <li>
                <strong>CI gates:</strong> web (format, lint, typecheck, test, build), API (ruff,
                mypy, pytest), database (migrations, RLS proof, seed-drift check), Docker build and
                the e2e suite. Nothing merges red.
              </li>
              <li>
                <strong>Config versioning:</strong> threshold changes require a new config version
                and regenerate the seed; results always record the version that produced them.
              </li>
              <li>
                Test photos are a public-domain image plus synthetic variants — no scraped or
                private face photos.
              </li>
            </ul>
          </Section>

          <Section id="deployment" title="13 · Deployment">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Vercel</strong> hosts the Next.js frontend —{" "}
                <a href="https://matchlab-one.vercel.app" className="underline">
                  matchlab-one.vercel.app
                </a>
                . Every PR gets a preview deployment; merging to <code>main</code> auto-deploys
                production.
              </li>
              <li>
                <strong>Render</strong> runs the FastAPI service as a Docker container (CORS pinned
                to the frontend origin).
              </li>
              <li>
                <strong>Supabase</strong> provides managed PostgreSQL, Auth and Storage; schema
                changes ship as SQL migrations from the repo.
              </li>
              <li>
                The app is installable as a <strong>PWA</strong> (manifest + icons + install
                prompt), and shared links unfurl with a branded preview card.
              </li>
            </ul>
          </Section>

          <Section id="limitations" title="14 · Honest limitations">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Results depend on photo conditions — lighting, camera processing, makeup and filters
                all shift measured skin colour. The quality gate and white balance reduce but cannot
                eliminate this.
              </li>
              <li>
                <strong>No statistical accuracy claim is made</strong>, because no
                professionally-labelled dataset was available. Evaluation focused on technical
                consistency and behaviour across diverse skin tones — this is stated openly in the
                app’s disclaimer.
              </li>
              <li>
                A single photo cannot fully replicate an in-person consultation (controlled
                lighting, physical drapes, dynamic assessment). The tool is an accessible,
                educational starting point.
              </li>
              <li>
                Foundation is only ever suggested as an undertone <em>direction</em>, since real
                shade matching requires testing on skin.
              </li>
            </ul>
          </Section>

          <Section id="qna" title="15 · Likely questions & answers">
            <div className="space-y-3">
              <QA q="Is this AI? Why not use machine learning?">
                <p>
                  It is deliberately <strong>not</strong> a trained model — it is a rule-based,
                  deterministic engine implementing documented colour science. Three reasons: (1) no
                  ethically-sourced, professionally-labelled dataset of faces with ground-truth
                  seasons exists to train or honestly evaluate a model; (2) rules are explainable —
                  every result can be traced to thresholds in a versioned config; (3) it avoids
                  overclaiming “AI accuracy” on a subjective domain. MediaPipe is used only to
                  locate facial landmarks, not to classify.
                </p>
              </QA>
              <QA q="How accurate is it?">
                <p>
                  We refuse to invent a number. With no labelled evaluation dataset, a percentage
                  would be pseudo-science. Instead the system is <strong>consistent</strong> (same
                  photo → same result, guaranteed by tests), <strong>transparent</strong> (a
                  six-factor confidence score on every result), and <strong>honest</strong> (low
                  confidence tells the user to retake the photo rather than pretending).
                </p>
              </QA>
              <QA q="How does it decide warm vs cool?">
                <p>
                  Skin pixels from the cheeks, forehead and jaw are converted to CIELAB; the engine
                  weighs undertone signals such as the yellow–blue b* component and hue angle, plus
                  a small questionnaire contribution. The weighted score is compared against
                  versioned thresholds to produce warm or cool, then season and sub-season.
                </p>
              </QA>
              <QA q="What happens to the photo?">
                <p>
                  Guests: processed in memory, never written to disk, never logged, discarded after
                  the response. Signed-in users: identical, unless they ticked the optional save
                  checkbox — then the image goes to a private bucket, retrievable only via
                  short-lived signed URLs, and deletable by the user.
                </p>
              </QA>
              <QA q="Why can lighting change my result?">
                <p>
                  A camera measures light reflected off skin, so a warm lamp shifts every pixel
                  warm. The pipeline counters this with a quality gate (it flags strong colour
                  casts) and a white-patch white-balance correction that normalises the estimated
                  light source before sampling — validated on synthetic warm/cool/green/magenta cast
                  fixtures.
                </p>
              </QA>
              <QA q="How are products matched to a person?">
                <p>
                  By perceptual colour distance: each product’s colour is compared to the palette
                  colours with CIEDE2000 in CIELAB space — the standard formula designed to mirror
                  how humans perceive colour difference. Products are ranked by their best distance
                  and shown with a match percentage.
                </p>
              </QA>
              <QA q="What did you build yourselves vs take off the shelf?">
                <p>
                  Off the shelf: MediaPipe (landmarks), OpenCV/NumPy (image maths), Next.js /
                  FastAPI / Supabase (platform). Built for this project: the entire colour engine
                  (quality gate, ROI sampling, white balance, CIELAB analysis, season classifier,
                  confidence model, versioned config system), the product-matching service, the
                  privacy architecture, the admin console and the full UI.
                </p>
              </QA>
              <QA q="Which model do you use exactly — and did you train it?">
                <p>
                  One pretrained model only: <strong>MediaPipe FaceLandmarker</strong> (Google’s
                  Face Mesh, 478 landmarks, Apache-2.0), vendored into the repo and run in-process
                  on CPU. We did not train or fine-tune it, and it contributes zero classification
                  decisions — it only tells us <em>where</em> the cheeks, forehead and jaw are.
                  Undertone and season come entirely from our own rule-based code over CIELAB
                  measurements. There is no external AI API anywhere in the system.
                </p>
              </QA>
              <QA q="Show me the code — where does the analysis actually live?">
                <p>
                  In <code>apps/api/app/analysis/</code>, as a pure, framework-free Python package:{" "}
                  <code>preprocessing/</code> (white balance), <code>quality/</code> (blur via
                  Laplacian variance, exposure, lighting, cast), <code>landmarks/</code> +{" "}
                  <code>skin_regions/</code> (ROI polygons from landmark indices),{" "}
                  <code>colour_features/</code> (hand-written sRGB→XYZ→CIELAB conversions and the
                  full CIEDE2000 formula in NumPy), <code>classification/</code>,{" "}
                  <code>confidence/</code>, <code>explainability/</code>, orchestrated by{" "}
                  <code>pipeline.py</code>. FastAPI routers stay thin — they validate, authenticate,
                  call the pipeline, persist.
                </p>
              </QA>
              <QA q="Why Python + FastAPI for the API, and Next.js for the web?">
                <p>
                  Python owns the imaging ecosystem — MediaPipe, OpenCV and NumPy are first-class
                  there, so the engine is concise and fast (vectorised maths; analysis completes in
                  well under a second). FastAPI adds async I/O, Pydantic validation and typed
                  contracts with almost no boilerplate. Next.js gives server-side rendering for the
                  public pages, the App Router for route groups (marketing / app / admin / auth),
                  and a strict-TypeScript component stack — with Zod validating on the client what
                  Pydantic re-validates on the server.
                </p>
              </QA>
              <QA q="How do you know the engine still works after a change?">
                <p>
                  CI runs the full test pyramid on every pull request — unit tests for the colour
                  maths and pipeline, integration tests against a real database, RLS security
                  proofs, web tests and browser end-to-end tests. Threshold changes require a new
                  config version, and a drift check ensures the database seed matches the config.
                </p>
              </QA>
              <QA q="Could this scale / be commercialised?">
                <p>
                  The pieces are standard and horizontally scalable: a stateless API container
                  (scale out on Render or any container platform), managed Postgres/Auth/Storage,
                  and a CDN-served frontend. The catalogue is store-agnostic (CSV import), and an
                  affiliate-feed integration is a documented future path.
                </p>
              </QA>
              <QA q="Why is it called a styling aid and not a diagnosis?">
                <p>
                  Because it measures colour harmony, not health or identity. The disclaimer,
                  consent screen and every result page state plainly: not medical, not
                  dermatological, not biometric identification.
                </p>
              </QA>
            </div>
          </Section>

          <Section id="glossary" title="16 · Glossary">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card title="Undertone">
                <p>
                  The warm (golden/yellow) or cool (pink/blue) cast beneath skin colour — more
                  stable than surface tone, and the first axis of seasonal analysis.
                </p>
              </Card>
              <Card title="CIELAB (Lab)">
                <p>
                  A colour space designed to be perceptually uniform: L* lightness, a* green–red, b*
                  blue–yellow. Skin measurements and colour maths happen here, not in RGB.
                </p>
              </Card>
              <Card title="CIEDE2000 (ΔE2000)">
                <p>
                  The standard formula for how different two colours look to a human. Used to rank
                  products against a palette; smaller ΔE = closer match.
                </p>
              </Card>
              <Card title="White balance / colour cast">
                <p>
                  Correcting for the colour of the light source. A “cast” is the tint a warm lamp or
                  coloured wall leaves on the whole photo.
                </p>
              </Card>
              <Card title="ROI (region of interest)">
                <p>
                  The specific skin patches sampled for measurement — cheeks, forehead, jaw — chosen
                  to avoid eyes, lips, brows, hair and shadows.
                </p>
              </Card>
              <Card title="RLS (row-level security)">
                <p>
                  PostgreSQL rules that restrict every row to its owner — defence in depth beneath
                  the API’s own ownership checks.
                </p>
              </Card>
              <Card title="Deterministic engine">
                <p>
                  Same input, same output, every time. No randomness, no retraining drift — results
                  are reproducible and testable.
                </p>
              </Card>
              <Card title="PWA (progressive web app)">
                <p>
                  A website installable to the home screen with an icon and standalone window — no
                  app store needed.
                </p>
              </Card>
            </div>
          </Section>

          <footer className="border-border text-muted-foreground border-t pt-6 text-xs leading-relaxed">
            <p>
              {siteConfig.name} is a rule-based styling and educational tool built as a Final Year
              Project. Results are estimates — not medical, dermatological or biometric claims. This
              guide is an internal, unlisted reference for presentation preparation.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
