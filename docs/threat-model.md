# Threat Model

Scope: the deployed system (Vercel web + Render API + Supabase). Assets, ranked: (1) facial images, (2) derived personal colour data, (3) account credentials/sessions, (4) catalogue integrity, (5) service availability.

| # | Threat | Vector | Mitigations (implemented) | Evidence |
|---|---|---|---|---|
| T1 | Malicious image upload | Crafted/polyglot JPEG/PNG/WebP, renamed files | Magic-byte sniffing cross-checked against declared MIME and extension; real decode; format allow-list; in-memory processing; no shell-outs | `test_preprocessing.py` (mismatch + truncated + format tests) |
| T2 | Decompression bomb / resource DoS | Huge dimensions, oversized bodies | Byte cap before reading; header-only pixel-count ceiling **before** decode; bounded resize; per-IP rate limiting on analysis endpoints | `test_preprocessing.py::test_rejects_decompression_bomb_dimensions`, `test_hardening.py::test_rate_limit_returns_structured_429` |
| T3 | Cross-user data access | Guessed IDs, tampered tokens | UUIDs; JWT signature/expiry/audience verification; ownership predicate in every repository query; RLS as the independent second layer | 21-check `verify_rls.py`; integration cross-user 404 tests |
| T4 | Admin-route bypass | Direct API calls with a user token; client-side guard tampering | `require_admin` re-reads `profiles.role` from the DB on every request; role self-escalation blocked by trigger; client gate is UX only | Admin 401/403 integration matrix; RLS escalation test |
| T5 | Storage exposure | Public bucket, leaked/permanent URLs | Private bucket; owner-scoped path policies (`{user_id}/…`); 5-minute signed URLs only; service key server-side only | Migration `0008`; storage policies; code review |
| T6 | External URL injection | `javascript:`/`data:` URLs via CSV or admin input | http/https validation at CSV parse, admin create, and DB CHECK constraints; rendered with `noopener noreferrer` | `test_csv_import.py::test_javascript_url_rejected`; e2e link-attribute assertions |
| T7 | Token/PII leakage via logs | Debug logging, error dumps | Structured logs with an explicit field set; no request bodies; error envelope hides internals | `test_hardening.py::test_logs_never_contain_image_bytes_or_tokens`, `test_error_envelope_hides_internals` |
| T8 | CSRF | Cookie-authenticated mutating requests | The API uses bearer tokens only (no cookie auth); CORS pinned to the exact frontend origin | `test_hardening.py` CORS tests |
| T9 | XSS | Injected content in user/admin fields | React escaping; CSP (`frame-ancestors 'none'`, pinned `connect-src`); no `dangerouslySetInnerHTML` anywhere | Code audit; CSP header in `next.config.ts` |
| T10 | Clickjacking | Embedding the app | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` on both apps | Header tests + smoke script |
| T11 | Account-deletion failure | Orphaned rows/objects | `ON DELETE CASCADE` chains from `auth.users`; storage cleanup before row deletion | Integration cascade test across 4 tables |
| T12 | Supply chain | Malicious/vulnerable dependencies | Lockfiles committed (`pnpm-lock.yaml`, `uv.lock`); CI installs frozen; vendored MediaPipe model with recorded provenance | CI configs; `models/README.md` |
| T13 | Secret exposure | Committed env files, client bundles, CI logs | `.env*` git-ignored with committed `.env.example`s; only `NEXT_PUBLIC_*` reaches the browser; Render secrets `sync:false`; startup validation refuses boot with missing prod vars | Repo audit; `test_config.py` production-boot tests |

## Residual risks (accepted, documented)

- **CSP `unsafe-inline`** for scripts/styles (Next.js hydration without a nonce pipeline) — future work.
- **In-memory rate limiter** resets on restart and is per-instance — acceptable at single-instance scale; Redis noted as future work.
- **No CAPTCHA** on guest analysis — rate limiting is the only bot control, acceptable for an academic deployment.
- **Emulated-platform builds**: the image is amd64-only (MediaPipe wheels); documented rather than mitigated.
