# Architecture

The complete architecture (system diagram, trust boundaries, backend layout, pipeline flowchart, data-model summary) lives in the root [`ARCHITECTURE.md`](../ARCHITECTURE.md); the database ERD is in [`database-schema.md`](./database-schema.md) and the deployment topology in [`deployment-guide.md`](./deployment-guide.md). This page adds the remaining required flows.

## User analysis flow

```mermaid
flowchart TD
    A["/analysis wizard"] --> B["Consent step\nexplicit agreement · storage opt-in OFF"]
    B --> C[Photography guidance]
    C --> D{Camera or upload?}
    D -->|camera| E["MediaDevices capture\nface guide · still frame only"]
    D -->|upload| F["Dropzone\ntype/size/decode checks · EXIF-safe\ndownscale ≤1600px client-side"]
    E --> G[Preview / retake]
    F --> G
    G --> H["POST /api/v1/analyses"]
    H -->|"422 image problem"| I["Targeted retake guidance\n(code-driven)"]
    I --> D
    H -->|200| J["Results: undertone · season ·\nconfidence · evidence"]
    J --> K["Palette + cosmetics\n(public season endpoint — guests too)"]
    J --> L{Signed in?}
    L -->|no| M["Nothing persisted ·\nsign-up CTA"]
    L -->|yes| N["Persisted → history ·\noptional save-photo (re-send)"]
    N --> O["Detail page: samples · dimensions ·\npalette · ranked products"]
```

## Authentication flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant V as Next.js (Vercel)
    participant S as Supabase Auth
    participant A as FastAPI (Render)
    participant P as PostgreSQL (RLS)

    B->>V: /register (email + password)
    V->>S: supabase-js signUp (emailRedirectTo /auth/callback)
    S-->>B: confirmation email
    B->>V: /auth/callback?code=…
    V->>S: exchangeCodeForSession
    S-->>V: session cookies (managed by @supabase/ssr)
    Note over V: proxy.ts refreshes the session and<br/>guards /dashboard, /history, /admin (UX only)
    B->>A: /api/v1/* with Authorization: Bearer access_token
    A->>A: verify JWT (HS256 secret or JWKS) — aud, exp, sub
    A->>P: queries always scoped by user_id (ownership)
    Note over A,P: admin routes re-check profiles.role in the DB<br/>RLS independently locks the direct PostgREST surface
```

## Key decisions

Recorded in [`DECISIONS.md`](../DECISIONS.md): rule-based baseline (D-001), CIE Lab + CIEDE2000 (D-002), MediaPipe with a vendored model (D-003), process-only-by-default image retention (D-004), dual-layer authorisation (D-005), config versioning (D-007), landmark-anchored elliptical ROIs (D-013), documented product-ranking formula (D-014).
