# Privacy and Consent

Binding rules live in the root [`SECURITY_AND_PRIVACY.md`](../SECURITY_AND_PRIVACY.md); this page documents the user-facing flows and the exact retention behaviour, aligned with PDPA (Malaysia) expectations for sensitive personal data.

## Consent flow

1. The analysis wizard **starts** with a consent step. It explains, in plain language: why a photo is required, that only forehead/cheek skin regions are measured, that **no identity recognition** is performed, that processing is temporary by default, which derived values may be saved, and how deletion works.
2. Continuing requires an explicit checkbox; an inline error appears otherwise.
3. A second, **off-by-default** checkbox opts into storing the photo (effective only for signed-in users).
4. Signed-in consent events are recorded append-only in `user_consents` via `POST /me/consents`; the newest event per type is the current state and history is never rewritten.
5. The default state of the storage checkbox is a per-user preference (`defaultImageStorage`, default **false**) editable in Privacy Settings.

## Retention matrix

| Data | Guest | Registered user |
|---|---|---|
| Facial photo | Processed in memory, never written to disk, discarded at response end | Same — **unless** the user opted in; then stored at `analysis-images/{user_id}/{analysis_id}.jpg` (private bucket, owner-scoped policies, 5-minute signed URLs) until the owner deletes it |
| Derived colour values, quality metrics, classification, explanations | Returned once, never persisted | Persisted to `analysis_*` tables until deleted |
| Consent events / preferences | Not applicable | Account lifetime |
| Logs | Request metadata only (id, route, status, duration) — never image bytes, tokens, or signed URLs (enforced by an automated log-hygiene test) | Same |

## Deletion rights (all implemented, all integration-tested)

- **One analysis** — `DELETE /analyses/{id}` (metrics, samples, classification, and any stored photo cascade).
- **One stored photo** — `DELETE /analyses/{id}/image` (result kept).
- **Complete history** — `DELETE /me/analyses` (+ bucket cleanup).
- **Account** — `DELETE /me`: storage objects removed, then the `auth.users` row is deleted and cascades through profile, preferences, consents, analyses, and favourites. Verified across four tables in integration tests.

## Administrators and user data

Administrators have **no interface** for viewing users' analyses or photos: analysis tables carry no admin RLS policy by design, admin endpoints expose only anonymised aggregates (asserted by a test that scans the stats payload for identifiable data), and storage policies restrict object reads to the owner.

## Honest-language rules

UI and documents say "estimated", "suggested", and show confidence. The system never claims to be AI/ML, medical, dermatological, or biometric, and the disclaimer page lists every factor known to affect results.
