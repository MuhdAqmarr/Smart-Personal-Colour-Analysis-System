# Security & Privacy — Smart Personal Colour Analysis System

Facial images are sensitive personal data. This document defines the binding rules the implementation follows, plus the threat model. Deeper reviews live in `docs/security-review.md` and `docs/threat-model.md`.

## 1. Data classification

| Data | Class | Storage | Retention |
|---|---|---|---|
| Facial image (guest) | Sensitive | **Never persisted** — processed in memory only | Discarded at end of request |
| Facial image (user, opt-in) | Sensitive | Private Supabase bucket `analysis-images/{user_id}/…` | Until owner deletes it / account deletion |
| Derived colour features (Lab, HEX, scores) | Personal | Postgres (`analysis_*` tables), RLS-protected | Until owner deletes analysis/account |
| Consent + preferences | Personal | Postgres, RLS-protected | Account lifetime |
| Palette/product catalogue | Public | Postgres | n/a |
| Logs | Operational | Stdout/provider | No image bytes, tokens, or PII beyond user id |

## 2. Privacy rules (binding)

1. Explicit consent screen before any analysis; consent recorded for authenticated users.
2. Default behaviour: image processed in memory, never written to server disk, never persisted.
3. "Save my analysis image" is **opt-in and off by default**; saved images go to a private bucket, are served only through short-lived signed URLs, and are deletable by the owner.
4. Guests: nothing persisted at all — no image, no analysis record.
5. Users can delete: individual analyses, individual stored images, complete history, favourites, and their whole account (cascade delete of owned rows + storage objects).
6. Shared/printed palette results never include the source image by default.
7. Admins have no UI path to browse users' source images; storage policies restrict object reads to the owner (service role is server-side only and used solely for owner-requested operations and deletion).
8. No identity recognition, no biometric templates, no medical claims anywhere in code or copy.

## 3. Security controls

- **Upload hardening:** extension + client-MIME + magic-byte sniff must agree; hard size cap (10 MB default); decode with Pillow with an explicit pixel ceiling (decompression-bomb guard); dimensions validated; EXIF orientation corrected; only JPEG/PNG/WebP accepted.
- **AuthN:** Supabase JWT verified on the backend (HS256 secret or JWKS; audience `authenticated`; expiry enforced). No cookies on the API — bearer tokens only, so CSRF surface is minimal.
- **AuthZ:** ownership enforced in every repository query; admin role (`profiles.role`) checked server-side per request; RLS + storage policies independently guard the direct Supabase surface.
- **Rate limiting:** per-IP limits on expensive endpoints (analysis) and auth-adjacent routes; configurable via env.
- **CORS:** allow-list of the exact frontend origins; no wildcard with credentials.
- **Security headers (web):** CSP (no inline script beyond Next.js requirements), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` limiting camera to self, `frame-ancestors 'none'`.
- **External product URLs:** http/https only (parsed, not regexed), rendered with `target="_blank" rel="noopener noreferrer"`, destination store displayed, "purchase happens on the external store" notice.
- **SQL:** parameterised via SQLAlchemy; no string-built SQL.
- **Secrets:** `.env*` git-ignored; `.env.example` documents every variable; CI uses GitHub Secrets; startup validation fails fast with clear errors; service-role key and JWT secret exist only server-side.
- **Errors:** structured envelope `{error: {code, message, details?, requestId}}`; raw exceptions never reach clients; stack traces only in server logs.
- **Logging:** structured JSON with request id, route, status, durations, error codes. Never: passwords, tokens, image bytes, signed URLs, service keys.
- **Audit:** admin mutations recorded in `admin_audit_logs` (actor, action, entity, before/after summary, timestamp).
- **No custom cryptography.**

## 4. Threat model (summary)

| Threat | Vector | Mitigations |
|---|---|---|
| Malicious image upload | Crafted JPEG/PNG/WebP, polyglot files | Magic-byte sniffing, real decode, pixel ceiling, size cap, format allow-list, in-memory processing, no shell-outs |
| Decompression bomb / DoS | Huge dimensions or crafted zlib streams | `Image.MAX_IMAGE_PIXELS` explicit ceiling, dimension check before full decode, size cap, rate limiting |
| Unauthorised data access | Guessing analysis IDs, tampered JWT | UUIDs, signature+expiry verification, ownership in queries, RLS proof script |
| Storage exposure | Public bucket / leaked URLs | Private bucket, owner-scoped storage policies, short-lived signed URLs, no permanent public URLs |
| Admin-route bypass | Direct API calls with user token | Server-side role check dependency on every admin route; integration tests assert 403 |
| External URL injection | `javascript:` or data: URLs in product data | URL scheme allow-list at validation and render time |
| API abuse | Bot hammering analysis endpoint | Per-IP rate limits, upload size caps, quality gate short-circuits |
| Token leakage | Logs, error bodies, client storage | Log field allow-list; tokens never logged; session handled by supabase-js; no tokens in localStorage beyond Supabase's own session handling (documented) |
| Sensitive logging | Accidental PII/image logging | Structured logger with explicit fields; code review rule; tests assert no image bytes in log output |
| Account-deletion failure | Orphaned rows/objects | FK `ON DELETE CASCADE` for owned rows; storage cleanup in deletion service; integration test |

## 5. Compliance posture (FYP scope)

- Consent-first flow aligned with PDPA (Malaysia) expectations for sensitive personal data; documented in `docs/privacy-and-consent.md`.
- Data minimisation: only derived, non-biometric colour features are stored by default.
- Right to erasure implemented as first-class product features (per-item and account-level deletion).
- Clear disclaimers: styling/educational tool, not medical, not biometric identification; results vary with lighting/camera.
