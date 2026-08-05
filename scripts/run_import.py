"""One-off runner: apply a product-import CSV via the app's importer service.

Reuses apps/api/app/services/csv_import.py (parse + upsert-by-product_url), so
behaviour matches the admin bulk-import exactly. Additive: existing products
are updated, none are deleted.

Usage (from repo root):
  uv --project apps/api run python scripts/run_import.py \
      --csv out.csv --admin <uuid> \
      --db "postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres" \
      [--commit]
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))
from app.services.csv_import import apply_import, parse_csv  # noqa: E402


async def run(csv_path: str, admin_id: str, db_url: str, commit: bool) -> None:
    preview = parse_csv(open(csv_path, "rb").read())
    print(f"parsed: total={preview.total_rows} valid={len(preview.valid_rows)} errors={len(preview.errors)}")
    engine = create_async_engine(db_url)
    async with AsyncSession(engine) as session:
        summary = await apply_import(
            session,
            UUID(admin_id),
            os.path.basename(csv_path),
            preview,
            dry_run=not commit,
        )
        if commit:
            await session.commit()
    await engine.dispose()
    print("summary:", {k: summary[k] for k in ("dry_run", "inserted_rows", "updated_rows", "error_rows")})


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--admin", required=True)
    ap.add_argument("--db", required=True)
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()
    asyncio.run(run(args.csv, args.admin, args.db, args.commit))


if __name__ == "__main__":
    main()
