# Administrator Manual

## Access

1. Register a normal account, then have the project owner promote it (`scripts/promote-admin.sql` or the SQL in the deployment guide).
2. An **Admin** item appears in the account sidebar; every admin API call re-verifies the role server-side — the UI gate is convenience only.
3. Administrators can never browse users' analyses or photos; statistics are anonymised aggregates by design.

## Dashboard

Registered users, total analyses, last-7-days volume, average confidence and processing time, season distribution bars, confidence mix, active catalogue counts, the active classifier version, and recent audit entries.

## Catalogue management

- **Products** — search, paginate, create (store, category, URL, price, colour hex → Lab computed automatically, season tags), and toggle **Active**. Deactivated products vanish from the public directory instantly; demo rows are labelled.
- **Stores** — create and rename; deactivating a store hides *all* of its products publicly.
- **Palettes** — per season and group: add colours (hex → Lab automatic), deactivate (removed from public palettes, kept in DB), or delete permanently. Historical analyses are unaffected — they carry their own measured values, and seasons are referenced by slug.
- **Cosmetics** — add/delete per season with type, intensity, occasion, and usage note.
- Season descriptions/taglines are editable via `PATCH /admin/seasons/{slug}` (API).

## CSV import

*Admin → CSV import.* Always **Dry run** first: every row is validated (17 columns — see `scripts/sample-products.csv`) and errors are listed with row numbers; nothing is written. **Commit** (enabled only after a dry run) upserts by product URL inside a transaction, replacing colours and tags. History shows every job with counts; per-job error reports download as CSV. Season tags use `spring|summer|autumn|winter`; sub-season tags like `deep-autumn`. `javascript:` URLs, bad hex, unknown categories, and duplicates are rejected per-row.

## Audit log

Every admin mutation is recorded (actor, action, entity, summary, request id). The log is append-only — there is no edit or delete surface, deliberately.

## System settings

Runtime keys stored in the database (JSON values, audit-logged): product name, low-quality-continuation flag, recommendation cap, signed-URL TTL. Classifier thresholds are **not** here — they are versioned files (`packages/colour-engine/config/`), changed only through pull requests (see `classifier-configuration.md`).

## Health

`GET /api/v1/readiness` reports classifier-config and database status; Render's dashboard shows container health and the structured JSON logs (request ids correlate with audit entries).
