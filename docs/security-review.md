# Security Review (spec §50.4)

Review of the implemented system against the master specification's security checklist. Verdicts: **PASS** (implemented + tested), **PASS\*** (implemented, evidence by inspection), **ACCEPTED RISK** (documented in the threat model).

| Area | Verdict | Notes / evidence |
|---|---|---|
| Authentication | PASS | Supabase JWT verified on every protected route (HS256 + JWKS; aud/exp/sub enforced). 10 unit tests incl. a real ES256 keypair; invalid-token integration tests. |
| Authorisation | PASS | Ownership predicates in every repository query; `require_admin` checks the DB role per request; RLS proven by 21 automated checks; cross-user 404s integration-tested. |
| Upload validation | PASS | Size cap → magic bytes vs MIME vs extension → header-only pixel ceiling → real decode → EXIF → bounded resize. 12 preprocessing tests incl. bombs, truncation, and mismatches. |
| Private storage | PASS\* | Private bucket, owner-scoped path policies, 5-minute signed URLs, service key server-side only. Policy SQL reviewed; graceful degradation tested when unconfigured. |
| Secret management | PASS | `.env*` ignored; examples complete; production startup fails fast listing missing variables (tested); no secrets in the client bundle (only `NEXT_PUBLIC_*`); Render manifest marks secrets `sync:false`. |
| External URLs | PASS | http/https enforced at CSV parse, admin input, and DB CHECK; `javascript:` rejection unit-tested; `noopener noreferrer` + store label asserted in e2e. |
| Logging | PASS | Structured JSON with explicit fields; automated log-hygiene test (no tokens, no image bytes, no oversized lines); error envelope never carries stack traces (tested). |
| Rate limiting | PASS | Per-IP slowapi on analysis endpoints, configurable; 429 returns the structured envelope (tested). Per-instance memory store = accepted risk at this scale. |
| CORS | PASS | Pinned to the exact frontend origin in production; allow/deny behaviour tested. |
| Security headers | PASS\* | API: nosniff, DENY, no-store, referrer policy (tested). Web: CSP + nosniff + frame denial + camera-scoped Permissions-Policy; CSP presence covered by the smoke script. |
| SQL safety | PASS\* | All queries parameterised through SQLAlchemy `text()` bindings; no string-interpolated values (interpolated fragments are static SQL only, marked and reviewed). |
| Custom cryptography | PASS | None anywhere; JWT via PyJWT, hashing left to Supabase. |
| Account deletion | PASS | Storage cleanup + `auth.users` cascade; verified across four tables in integration tests. |
| Audit logging | PASS | Every admin mutation writes actor/action/entity/summary/request-id; append-only surface; verified in integration tests. |

## Findings fixed during the review cycle

1. **MediaPipe runtime libraries missing from the production image** (`libGLESv2.so.2`) — would have failed on first real analysis in production. Fixed and re-proven with an in-container smoke test.
2. **React StrictMode + `useMutation`** left the processing step on an infinite spinner in dev builds — fixed with an idle-guarded start.
3. **WCAG link-in-text-block** — in-text links relied on colour alone; now always underlined.
4. Rate limiter shared across test apps caused false positives — test environments now configure their own limits (production default unchanged).

## Recommendations (future work)

Nonce-based CSP to drop `unsafe-inline`; Redis-backed rate limiting if horizontally scaled; dependency-audit CI job (pnpm audit / pip-audit); optional CAPTCHA on guest analysis if abuse appears.
