"""Product CSV import (spec §30).

Columns: product_name, brand, store_slug, category, gender, description,
image_url, product_url, price, original_price, currency, availability,
colour_name, colour_hex, season_tags, subseason_tags, active.

Behaviour: full row-level validation with per-row errors, duplicate
detection (product_url), dry-run preview, transactional commit, and an
import-job record with row-level error persistence.
"""

from __future__ import annotations

import csv
import io
import json
import re
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.colour_features.conversions import rgb_to_lab

EXPECTED_COLUMNS = [
    "product_name",
    "brand",
    "store_slug",
    "category",
    "gender",
    "description",
    "image_url",
    "product_url",
    "price",
    "original_price",
    "currency",
    "availability",
    "colour_name",
    "colour_hex",
    "season_tags",
    "subseason_tags",
    "active",
]

VALID_CATEGORIES = {
    "tops",
    "shirts",
    "dresses",
    "outerwear",
    "trousers",
    "skirts",
    "scarves",
    "hijabs",
    "accessories",
    "shoes",
    "bags",
    "cosmetics",
}
VALID_GENDERS = {"women", "men", "unisex"}
VALID_AVAILABILITY = {"in_stock", "out_of_stock", "unknown"}
VALID_SEASONS = {"spring", "summer", "autumn", "winter"}
VALID_SUBSEASONS = {
    "light-spring",
    "warm-spring",
    "bright-spring",
    "light-summer",
    "cool-summer",
    "soft-summer",
    "soft-autumn",
    "warm-autumn",
    "deep-autumn",
    "deep-winter",
    "cool-winter",
    "bright-winter",
}

_HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
_URL_RE = re.compile(r"^https?://", re.IGNORECASE)

MAX_ROWS = 2000


@dataclass
class RowError:
    row_number: int
    column: str
    message: str
    raw: dict[str, str] = field(default_factory=dict)


@dataclass
class ParsedRow:
    row_number: int
    data: dict[str, Any]


@dataclass
class ImportPreview:
    total_rows: int
    valid_rows: list[ParsedRow]
    errors: list[RowError]
    duplicate_urls: list[str]


def _validate_row(
    row_number: int, raw: dict[str, str]
) -> tuple[dict[str, Any] | None, list[RowError]]:
    errors: list[RowError] = []

    def error(column: str, message: str) -> None:
        errors.append(RowError(row_number=row_number, column=column, message=message, raw=raw))

    name = (raw.get("product_name") or "").strip()
    if not (2 <= len(name) <= 200):
        error("product_name", "Product name must be 2–200 characters.")

    store_slug = (raw.get("store_slug") or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9-]{2,60}", store_slug):
        error("store_slug", "Store slug must be lowercase letters/numbers/hyphens.")

    category = (raw.get("category") or "").strip().lower()
    if category not in VALID_CATEGORIES:
        error("category", f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}.")

    gender = (raw.get("gender") or "unisex").strip().lower() or "unisex"
    if gender not in VALID_GENDERS:
        error("gender", "Gender must be women, men, or unisex.")

    product_url = (raw.get("product_url") or "").strip()
    if not _URL_RE.match(product_url):
        error("product_url", "Product URL must start with http:// or https://.")

    image_url = (raw.get("image_url") or "").strip() or None
    if image_url and not _URL_RE.match(image_url):
        error("image_url", "Image URL must start with http:// or https://.")

    def parse_price(column: str) -> float | None:
        value = (raw.get(column) or "").strip()
        if not value:
            return None
        try:
            price = float(value)
        except ValueError:
            error(column, "Must be a number.")
            return None
        if price < 0:
            error(column, "Must not be negative.")
            return None
        return round(price, 2)

    price = parse_price("price")
    original_price = parse_price("original_price")

    currency = ((raw.get("currency") or "MYR").strip().upper() or "MYR")[:3]
    if len(currency) != 3 or not currency.isalpha():
        error("currency", "Currency must be a 3-letter code.")

    availability = (raw.get("availability") or "unknown").strip().lower() or "unknown"
    if availability not in VALID_AVAILABILITY:
        error("availability", "Availability must be in_stock, out_of_stock, or unknown.")

    colour_hex = (raw.get("colour_hex") or "").strip().lower()
    if not _HEX_RE.match(colour_hex):
        error("colour_hex", "Colour hex must look like #rrggbb.")

    season_tags = [
        tag.strip().lower() for tag in (raw.get("season_tags") or "").split("|") if tag.strip()
    ]
    for tag in season_tags:
        if tag not in VALID_SEASONS:
            error("season_tags", f"Unknown season '{tag}' (use spring|summer|autumn|winter).")
    if not season_tags:
        error("season_tags", "At least one season tag is required.")

    subseason_tags = [
        tag.strip().lower() for tag in (raw.get("subseason_tags") or "").split("|") if tag.strip()
    ]
    for tag in subseason_tags:
        if tag not in VALID_SUBSEASONS:
            error("subseason_tags", f"Unknown sub-season '{tag}'.")

    active_raw = (raw.get("active") or "true").strip().lower()
    if active_raw not in ("true", "false", "1", "0", "yes", "no", ""):
        error("active", "Active must be true or false.")
    active = active_raw in ("true", "1", "yes", "")

    if errors:
        return None, errors

    hex_value = colour_hex.lstrip("#")
    rgb = [int(hex_value[i : i + 2], 16) for i in (0, 2, 4)]
    lab = rgb_to_lab(np.array(rgb, dtype=np.uint8))

    return (
        {
            "name": name,
            "brand": (raw.get("brand") or "").strip(),
            "store_slug": store_slug,
            "category": category,
            "gender": gender,
            "description": (raw.get("description") or "").strip(),
            "image_url": image_url,
            "product_url": product_url,
            "price": price,
            "original_price": original_price,
            "currency": currency,
            "availability": availability,
            "colour_name": (raw.get("colour_name") or "").strip(),
            "colour_hex": colour_hex,
            "lab_l": round(float(lab[0]), 2),
            "lab_a": round(float(lab[1]), 2),
            "lab_b": round(float(lab[2]), 2),
            "season_tags": season_tags,
            "subseason_tags": subseason_tags,
            "active": active,
        },
        [],
    )


def parse_csv(data: bytes) -> ImportPreview:
    try:
        text_data = data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("The CSV file must be UTF-8 encoded.") from exc

    reader = csv.DictReader(io.StringIO(text_data))
    if reader.fieldnames is None:
        raise ValueError("The CSV file is empty.")
    missing = [column for column in EXPECTED_COLUMNS if column not in reader.fieldnames]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}.")

    valid: list[ParsedRow] = []
    errors: list[RowError] = []
    seen_urls: dict[str, int] = {}
    duplicates: list[str] = []
    total = 0

    for index, raw in enumerate(reader, start=2):  # row 1 is the header
        total += 1
        if total > MAX_ROWS:
            raise ValueError(f"The CSV exceeds the {MAX_ROWS}-row limit.")
        cleaned = {k: (v or "") for k, v in raw.items() if k is not None}
        parsed, row_errors = _validate_row(index, cleaned)
        if row_errors:
            errors.extend(row_errors)
            continue
        assert parsed is not None
        url = parsed["product_url"]
        if url in seen_urls:
            duplicates.append(url)
            errors.append(
                RowError(
                    row_number=index,
                    column="product_url",
                    message=f"Duplicate of row {seen_urls[url]} (same product URL).",
                    raw=cleaned,
                )
            )
            continue
        seen_urls[url] = index
        valid.append(ParsedRow(row_number=index, data=parsed))

    return ImportPreview(
        total_rows=total, valid_rows=valid, errors=errors, duplicate_urls=duplicates
    )


async def apply_import(
    session: AsyncSession,
    admin_user_id: UUID,
    filename: str,
    preview: ImportPreview,
    *,
    dry_run: bool,
) -> dict[str, Any]:
    """Persist the import (or record a dry-run) and return the job summary.

    Commit mode upserts by product_url inside the caller's transaction:
    existing products are updated, colours and tags replaced.
    """
    inserted = 0
    updated = 0

    if not dry_run:
        for row in preview.valid_rows:
            data = row.data
            store_id = (
                await session.execute(
                    text("select id from public.stores where slug = :slug and is_active"),
                    {"slug": data["store_slug"]},
                )
            ).scalar_one_or_none()
            if store_id is None:
                preview.errors.append(
                    RowError(
                        row_number=row.row_number,
                        column="store_slug",
                        message=f"Store '{data['store_slug']}' does not exist.",
                    )
                )
                continue

            existing = (
                await session.execute(
                    text("select id from public.products where product_url = :url"),
                    {"url": data["product_url"]},
                )
            ).scalar_one_or_none()

            if existing:
                product_id = existing
                await session.execute(
                    text(
                        """
                        update public.products set
                          store_id = :store_id, name = :name, brand = :brand,
                          category = :category, gender = :gender,
                          description = :description, image_url = :image_url,
                          price = :price, original_price = :original_price,
                          currency = :currency, availability = :availability,
                          is_active = :active
                        where id = :id
                        """
                    ),
                    {**data, "store_id": store_id, "id": product_id},
                )
                await session.execute(
                    text("delete from public.product_colours where product_id = :id"),
                    {"id": product_id},
                )
                await session.execute(
                    text("delete from public.product_season_tags where product_id = :id"),
                    {"id": product_id},
                )
                updated += 1
            else:
                product_id = (
                    await session.execute(
                        text(
                            """
                            insert into public.products
                              (store_id, name, brand, category, gender, description,
                               image_url, product_url, price, original_price, currency,
                               availability, is_active, is_demo)
                            values
                              (:store_id, :name, :brand, :category, :gender, :description,
                               :image_url, :product_url, :price, :original_price, :currency,
                               :availability, :active, false)
                            returning id
                            """
                        ),
                        {**data, "store_id": store_id},
                    )
                ).scalar_one()
                inserted += 1

            await session.execute(
                text(
                    """
                    insert into public.product_colours
                      (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
                    values (:pid, :colour_name, :hex, :lab_l, :lab_a, :lab_b, true)
                    """
                ),
                {
                    "pid": product_id,
                    "colour_name": data["colour_name"],
                    "hex": data["colour_hex"],
                    "lab_l": data["lab_l"],
                    "lab_a": data["lab_a"],
                    "lab_b": data["lab_b"],
                },
            )
            for season in data["season_tags"]:
                await session.execute(
                    text(
                        """
                        insert into public.product_season_tags
                          (product_id, season_slug)
                        values (:pid, :season)
                        on conflict do nothing
                        """
                    ),
                    {"pid": product_id, "season": season},
                )
            for subseason in data["subseason_tags"]:
                season = subseason.split("-")[-1]
                await session.execute(
                    text(
                        """
                        insert into public.product_season_tags
                          (product_id, season_slug, subseason_slug)
                        values (:pid, :season, :subseason)
                        on conflict do nothing
                        """
                    ),
                    {"pid": product_id, "season": season, "subseason": subseason},
                )

    job_id = (
        await session.execute(
            text(
                """
                insert into public.product_import_jobs
                  (admin_user_id, filename, status, dry_run, total_rows, valid_rows,
                   inserted_rows, updated_rows, error_rows, started_at, finished_at)
                values
                  (:admin, :filename, :status, :dry_run, :total, :valid,
                   :inserted, :updated, :errors, now(), now())
                returning id
                """
            ),
            {
                "admin": str(admin_user_id),
                "filename": filename,
                "status": "dry_run_completed" if dry_run else "completed",
                "dry_run": dry_run,
                "total": preview.total_rows,
                "valid": len(preview.valid_rows),
                "inserted": inserted,
                "updated": updated,
                "errors": len(preview.errors),
            },
        )
    ).scalar_one()

    for row_error in preview.errors[:500]:
        await session.execute(
            text(
                """
                insert into public.product_import_errors
                  (job_id, row_number, column_name, error_message, raw_row)
                values (:job_id, :row_number, :column, :message, :raw)
                """
            ),
            {
                "job_id": job_id,
                "row_number": row_error.row_number,
                "column": row_error.column,
                "message": row_error.message,
                "raw": json.dumps(row_error.raw),
            },
        )

    return {
        "job_id": str(job_id),
        "dry_run": dry_run,
        "total_rows": preview.total_rows,
        "valid_rows": len(preview.valid_rows),
        "inserted_rows": inserted,
        "updated_rows": updated,
        "error_rows": len(preview.errors),
        "errors": [
            {
                "rowNumber": e.row_number,
                "column": e.column,
                "message": e.message,
            }
            for e in preview.errors[:100]
        ],
    }
