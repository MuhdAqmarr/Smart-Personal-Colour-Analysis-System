"""Administrator endpoints.

Every route requires the admin role verified against the database
(`require_admin`); the frontend guard is UX only. Important mutations are
recorded in admin_audit_logs.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.core.errors import ValidationAppError
from app.schemas.common import CamelModel
from app.security.auth import AdminUser
from app.services.csv_import import MAX_ROWS, apply_import, parse_csv

router = APIRouter(prefix="/admin", tags=["admin"])

MAX_CSV_BYTES = 2 * 1024 * 1024


async def audit(
    session: AsyncSession,
    request: Request,
    admin: AdminUser,
    action: str,
    entity_type: str,
    entity_id: str,
    summary: dict[str, Any] | None = None,
) -> None:
    import json

    await session.execute(
        text(
            """
            insert into public.admin_audit_logs
              (actor_user_id, action, entity_type, entity_id, summary, request_id)
            values (:actor, :action, :entity_type, :entity_id, :summary, :request_id)
            """
        ),
        {
            "actor": str(admin.user_id),
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "summary": json.dumps(summary or {}),
            "request_id": getattr(request.state, "request_id", ""),
        },
    )


class ImportResultSchema(CamelModel):
    job_id: str
    dry_run: bool
    total_rows: int
    valid_rows: int
    inserted_rows: int
    updated_rows: int
    error_rows: int
    errors: list[dict[str, Any]]


@router.post("/products/import", response_model=ImportResultSchema)
async def import_products(
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    file: Annotated[UploadFile, File(description="Product CSV")],
    dry_run: Annotated[bool, Query()] = True,
) -> ImportResultSchema:
    """CSV import with dry-run preview (default) and transactional commit."""
    data = await file.read()
    if len(data) > MAX_CSV_BYTES:
        raise ValidationAppError(f"The CSV is larger than {MAX_CSV_BYTES // (1024 * 1024)} MB.")
    try:
        preview = parse_csv(data)
    except ValueError as exc:
        raise ValidationAppError(str(exc)) from exc
    if preview.total_rows == 0:
        raise ValidationAppError("The CSV contains no data rows.")
    if preview.total_rows > MAX_ROWS:  # defensive; parse_csv already enforces
        raise ValidationAppError(f"The CSV exceeds the {MAX_ROWS}-row limit.")

    result = await apply_import(
        session,
        admin.user_id,
        file.filename or "products.csv",
        preview,
        dry_run=dry_run,
    )
    await audit(
        session,
        request,
        admin,
        "products.import.dry_run" if dry_run else "products.import.commit",
        "product_import_job",
        result["job_id"],
        {
            "totalRows": result["total_rows"],
            "validRows": result["valid_rows"],
            "errorRows": result["error_rows"],
        },
    )
    await session.commit()
    return ImportResultSchema(
        job_id=result["job_id"],
        dry_run=result["dry_run"],
        total_rows=result["total_rows"],
        valid_rows=result["valid_rows"],
        inserted_rows=result["inserted_rows"],
        updated_rows=result["updated_rows"],
        error_rows=result["error_rows"],
        errors=result["errors"],
    )


class ImportJobSchema(CamelModel):
    id: str
    filename: str
    status: str
    dry_run: bool
    total_rows: int
    valid_rows: int
    inserted_rows: int
    updated_rows: int
    error_rows: int
    created_at: str


@router.get("/products/imports", response_model=list[ImportJobSchema])
async def list_import_jobs(
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ImportJobSchema]:
    rows = await session.execute(
        text(
            """
            select id, filename, status, dry_run, total_rows, valid_rows,
                   inserted_rows, updated_rows, error_rows, created_at
            from public.product_import_jobs
            order by created_at desc
            limit 50
            """
        )
    )
    return [
        ImportJobSchema(
            id=str(row["id"]),
            filename=row["filename"],
            status=row["status"],
            dry_run=row["dry_run"],
            total_rows=row["total_rows"],
            valid_rows=row["valid_rows"],
            inserted_rows=row["inserted_rows"],
            updated_rows=row["updated_rows"],
            error_rows=row["error_rows"],
            created_at=row["created_at"].isoformat(),
        )
        for row in rows.mappings()
    ]


class ImportErrorSchema(CamelModel):
    row_number: int
    column_name: str
    error_message: str


@router.get("/products/imports/{job_id}/errors", response_model=list[ImportErrorSchema])
async def list_import_errors(
    job_id: str,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ImportErrorSchema]:
    rows = await session.execute(
        text(
            """
            select row_number, column_name, error_message
            from public.product_import_errors
            where job_id = :job_id
            order by row_number
            """
        ),
        {"job_id": job_id},
    )
    return [
        ImportErrorSchema(
            row_number=row["row_number"],
            column_name=row["column_name"],
            error_message=row["error_message"],
        )
        for row in rows.mappings()
    ]


# --------------------------------------------------------------------------
# Dashboard statistics (anonymised aggregates only — never user rows)
# --------------------------------------------------------------------------


class AdminStatsSchema(CamelModel):
    total_users: int
    total_analyses: int
    analyses_last_7_days: int
    average_confidence: float | None
    confidence_distribution: dict[str, int]
    season_distribution: dict[str, int]
    average_processing_ms: float | None
    active_products: int
    active_stores: int
    palette_colours: int
    classifier_version: str | None


@router.get("/stats", response_model=AdminStatsSchema)
async def admin_stats(
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminStatsSchema:
    """Anonymised aggregates for the dashboard. No per-user data leaves
    the database — administrators cannot browse individual analyses."""

    async def scalar(query: str) -> Any:
        return (await session.execute(text(query))).scalar_one()

    confidence_rows = await session.execute(
        text("select confidence_label, count(*) from public.analyses group by confidence_label")
    )
    season_rows = await session.execute(
        text("select season_slug, count(*) from public.analyses group by season_slug")
    )
    active_version = (
        await session.execute(
            text("select version from public.algorithm_versions where is_active limit 1")
        )
    ).scalar_one_or_none()

    return AdminStatsSchema(
        total_users=await scalar("select count(*) from public.profiles"),
        total_analyses=await scalar("select count(*) from public.analyses"),
        analyses_last_7_days=await scalar(
            "select count(*) from public.analyses where created_at > now() - interval '7 days'"
        ),
        average_confidence=(
            await session.execute(text("select avg(confidence) from public.analyses"))
        ).scalar_one(),
        confidence_distribution={row[0]: row[1] for row in confidence_rows},
        season_distribution={row[0]: row[1] for row in season_rows},
        average_processing_ms=(
            await session.execute(text("select avg(processing_ms) from public.analyses"))
        ).scalar_one(),
        active_products=await scalar("select count(*) from public.products where is_active"),
        active_stores=await scalar("select count(*) from public.stores where is_active"),
        palette_colours=await scalar("select count(*) from public.palette_colours where is_active"),
        classifier_version=active_version,
    )


# --------------------------------------------------------------------------
# Audit logs / algorithm versions / settings
# --------------------------------------------------------------------------


class AuditLogSchema(CamelModel):
    id: str
    actor_user_id: str | None
    action: str
    entity_type: str
    entity_id: str
    summary: dict[str, Any]
    request_id: str
    created_at: str


@router.get("/audit-logs", response_model=list[AuditLogSchema])
async def list_audit_logs(
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    page: Annotated[int, Query(ge=1)] = 1,
) -> list[AuditLogSchema]:
    rows = await session.execute(
        text(
            """
            select id, actor_user_id, action, entity_type, entity_id, summary,
                   request_id, created_at
            from public.admin_audit_logs
            order by created_at desc
            limit 50 offset :offset
            """
        ),
        {"offset": (page - 1) * 50},
    )
    return [
        AuditLogSchema(
            id=str(row["id"]),
            actor_user_id=str(row["actor_user_id"]) if row["actor_user_id"] else None,
            action=row["action"],
            entity_type=row["entity_type"],
            entity_id=row["entity_id"],
            summary=row["summary"],
            request_id=row["request_id"],
            created_at=row["created_at"].isoformat(),
        )
        for row in rows.mappings()
    ]


class AlgorithmVersionSchema(CamelModel):
    id: str
    version: str
    name: str
    notes: str
    is_active: bool
    released_at: str


@router.get("/algorithm-versions", response_model=list[AlgorithmVersionSchema])
async def list_algorithm_versions(
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[AlgorithmVersionSchema]:
    rows = await session.execute(
        text(
            """
            select id, version, name, notes, is_active, released_at
            from public.algorithm_versions order by released_at desc
            """
        )
    )
    return [
        AlgorithmVersionSchema(
            id=str(row["id"]),
            version=row["version"],
            name=row["name"],
            notes=row["notes"],
            is_active=row["is_active"],
            released_at=row["released_at"].isoformat(),
        )
        for row in rows.mappings()
    ]


class SystemSettingSchema(CamelModel):
    key: str
    value: Any
    description: str


@router.get("/settings", response_model=list[SystemSettingSchema])
async def list_settings(
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[SystemSettingSchema]:
    rows = await session.execute(
        text("select key, value, description from public.system_settings order by key")
    )
    return [
        SystemSettingSchema(key=row["key"], value=row["value"], description=row["description"])
        for row in rows.mappings()
    ]


class SettingUpdateSchema(CamelModel):
    value: Any


@router.put("/settings/{key}", response_model=SystemSettingSchema)
async def update_setting(
    key: str,
    payload: SettingUpdateSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SystemSettingSchema:
    import json as json_module

    row = (
        (
            await session.execute(
                text(
                    """
                update public.system_settings
                set value = :value, updated_by = :admin
                where key = :key
                returning key, value, description
                """
                ),
                {
                    "key": key,
                    "value": json_module.dumps(payload.value),
                    "admin": str(admin.user_id),
                },
            )
        )
        .mappings()
        .first()
    )
    if row is None:
        from app.core.errors import NotFoundError

        raise NotFoundError("Unknown setting key.")
    await audit(
        session, request, admin, "settings.update", "system_setting", key, {"value": payload.value}
    )
    await session.commit()
    return SystemSettingSchema(key=row["key"], value=row["value"], description=row["description"])


# --------------------------------------------------------------------------
# Store CRUD
# --------------------------------------------------------------------------


class StoreSchema(CamelModel):
    id: str
    slug: str
    name: str
    website_url: str | None
    country: str
    is_active: bool


class StoreCreateSchema(CamelModel):
    slug: str
    name: str
    website_url: str | None = None
    country: str = "MY"


class StoreUpdateSchema(CamelModel):
    name: str | None = None
    website_url: str | None = None
    country: str | None = None
    is_active: bool | None = None


@router.get("/stores", response_model=list[StoreSchema])
async def admin_list_stores(
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[StoreSchema]:
    rows = await session.execute(
        text(
            "select id, slug, name, website_url, country, is_active "
            "from public.stores order by name"
        )
    )
    return [
        StoreSchema(
            id=str(row["id"]),
            slug=row["slug"],
            name=row["name"],
            website_url=row["website_url"],
            country=row["country"].strip(),
            is_active=row["is_active"],
        )
        for row in rows.mappings()
    ]


@router.post("/stores", response_model=StoreSchema, status_code=201)
async def admin_create_store(
    payload: StoreCreateSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> StoreSchema:
    import re as re_module

    if not re_module.fullmatch(r"[a-z0-9-]{2,60}", payload.slug):
        raise ValidationAppError("Slug must be lowercase letters, numbers, and hyphens.")
    if payload.website_url and not payload.website_url.lower().startswith(("http://", "https://")):
        raise ValidationAppError("Website URL must be http(s).")
    existing = (
        await session.execute(
            text("select 1 from public.stores where slug = :slug"), {"slug": payload.slug}
        )
    ).first()
    if existing:
        raise ValidationAppError("A store with this slug already exists.")
    row = (
        (
            await session.execute(
                text(
                    """
                insert into public.stores (slug, name, website_url, country)
                values (:slug, :name, :website_url, :country)
                returning id, slug, name, website_url, country, is_active
                """
                ),
                {
                    "slug": payload.slug,
                    "name": payload.name.strip(),
                    "website_url": payload.website_url,
                    "country": payload.country[:2].upper(),
                },
            )
        )
        .mappings()
        .one()
    )
    await audit(
        session, request, admin, "stores.create", "store", str(row["id"]), {"slug": payload.slug}
    )
    await session.commit()
    return StoreSchema(
        id=str(row["id"]),
        slug=row["slug"],
        name=row["name"],
        website_url=row["website_url"],
        country=row["country"].strip(),
        is_active=row["is_active"],
    )


@router.patch("/stores/{store_id}", response_model=StoreSchema)
async def admin_update_store(
    store_id: str,
    payload: StoreUpdateSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> StoreSchema:
    from app.core.errors import NotFoundError

    if payload.website_url and not payload.website_url.lower().startswith(("http://", "https://")):
        raise ValidationAppError("Website URL must be http(s).")
    row = (
        (
            await session.execute(
                text(
                    """
                update public.stores set
                  name = coalesce(:name, name),
                  website_url = coalesce(:website_url, website_url),
                  country = coalesce(:country, country),
                  is_active = coalesce(:is_active, is_active)
                where id = :id
                returning id, slug, name, website_url, country, is_active
                """
                ),
                {
                    "id": store_id,
                    "name": payload.name.strip() if payload.name else None,
                    "website_url": payload.website_url,
                    "country": payload.country[:2].upper() if payload.country else None,
                    "is_active": payload.is_active,
                },
            )
        )
        .mappings()
        .first()
    )
    if row is None:
        raise NotFoundError("Store not found.")
    await audit(
        session,
        request,
        admin,
        "stores.update",
        "store",
        store_id,
        payload.model_dump(exclude_none=True),
    )
    await session.commit()
    return StoreSchema(
        id=str(row["id"]),
        slug=row["slug"],
        name=row["name"],
        website_url=row["website_url"],
        country=row["country"].strip(),
        is_active=row["is_active"],
    )


# --------------------------------------------------------------------------
# Product admin (list incl. inactive, create, update/activate)
# --------------------------------------------------------------------------


class AdminProductUpdateSchema(CamelModel):
    name: str | None = None
    brand: str | None = None
    description: str | None = None
    price: float | None = None
    availability: str | None = None
    is_active: bool | None = None


class AdminProductCreateSchema(CamelModel):
    store_slug: str
    name: str
    brand: str = ""
    category: str
    gender: str = "unisex"
    description: str = ""
    product_url: str
    price: float | None = None
    currency: str = "MYR"
    availability: str = "unknown"
    colour_name: str = ""
    colour_hex: str
    season_tags: list[str] = []


@router.get("/products")
async def admin_list_products(
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    q: Annotated[str | None, Query(max_length=80)] = None,
) -> dict[str, Any]:
    conditions = "true" if not q else "(p.name ilike :q or p.brand ilike :q)"
    params: dict[str, Any] = {"offset": (page - 1) * 20}
    if q:
        params["q"] = f"%{q}%"
    total = (
        await session.execute(
            text(f"select count(*) from public.products p where {conditions}"),  # noqa: S608
            params,
        )
    ).scalar_one()
    rows = await session.execute(
        text(
            f"""
            select p.id, p.name, p.brand, p.category, p.gender, p.price, p.currency,
                   p.availability, p.is_active, p.is_demo, p.product_url,
                   st.name as store_name,
                   (select hex from public.product_colours pc
                    where pc.product_id = p.id and pc.is_primary limit 1) as hex
            from public.products p
            join public.stores st on st.id = p.store_id
            where {conditions}
            order by p.updated_at desc
            limit 20 offset :offset
            """  # noqa: S608
        ),
        params,
    )
    return {
        "items": [
            {
                "id": str(row["id"]),
                "name": row["name"],
                "brand": row["brand"],
                "category": row["category"],
                "gender": row["gender"],
                "price": float(row["price"]) if row["price"] is not None else None,
                "currency": row["currency"].strip(),
                "availability": row["availability"],
                "isActive": row["is_active"],
                "isDemo": row["is_demo"],
                "productUrl": row["product_url"],
                "storeName": row["store_name"],
                "hex": row["hex"],
            }
            for row in rows.mappings()
        ],
        "pagination": {
            "page": page,
            "pageSize": 20,
            "totalItems": int(total),
            "totalPages": max(1, -(-int(total) // 20)) if total else 0,
        },
    }


@router.post("/products", status_code=201)
async def admin_create_product(
    payload: AdminProductCreateSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    import re as re_module

    import numpy as np

    from app.analysis.colour_features.conversions import rgb_to_lab
    from app.repositories.products import VALID_CATEGORIES

    if payload.category not in VALID_CATEGORIES:
        raise ValidationAppError("Unknown category.")
    if payload.gender not in ("women", "men", "unisex"):
        raise ValidationAppError("Gender must be women, men, or unisex.")
    if payload.availability not in ("in_stock", "out_of_stock", "unknown"):
        raise ValidationAppError("Invalid availability.")
    if not payload.product_url.lower().startswith(("http://", "https://")):
        raise ValidationAppError("Product URL must be http(s).")
    if not re_module.fullmatch(r"#[0-9a-fA-F]{6}", payload.colour_hex):
        raise ValidationAppError("Colour hex must look like #rrggbb.")
    for tag in payload.season_tags:
        if tag not in ("spring", "summer", "autumn", "winter"):
            raise ValidationAppError(f"Unknown season tag '{tag}'.")

    store_id = (
        await session.execute(
            text("select id from public.stores where slug = :slug"),
            {"slug": payload.store_slug},
        )
    ).scalar_one_or_none()
    if store_id is None:
        raise ValidationAppError("Unknown store slug.")

    product_id = (
        await session.execute(
            text(
                """
                insert into public.products
                  (store_id, name, brand, category, gender, description, product_url,
                   price, currency, availability, is_demo)
                values
                  (:store_id, :name, :brand, :category, :gender, :description,
                   :product_url, :price, :currency, :availability, false)
                returning id
                """
            ),
            {
                "store_id": store_id,
                "name": payload.name.strip(),
                "brand": payload.brand.strip(),
                "category": payload.category,
                "gender": payload.gender,
                "description": payload.description.strip(),
                "product_url": payload.product_url,
                "price": payload.price,
                "currency": payload.currency[:3].upper(),
                "availability": payload.availability,
            },
        )
    ).scalar_one()

    hex_value = payload.colour_hex.lstrip("#").lower()
    rgb = [int(hex_value[i : i + 2], 16) for i in (0, 2, 4)]
    lab = rgb_to_lab(np.array(rgb, dtype=np.uint8))
    await session.execute(
        text(
            """
            insert into public.product_colours
              (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
            values (:pid, :name, :hex, :l, :a, :b, true)
            """
        ),
        {
            "pid": product_id,
            "name": payload.colour_name.strip(),
            "hex": f"#{hex_value}",
            "l": round(float(lab[0]), 2),
            "a": round(float(lab[1]), 2),
            "b": round(float(lab[2]), 2),
        },
    )
    for tag in payload.season_tags:
        await session.execute(
            text(
                "insert into public.product_season_tags (product_id, season_slug) "
                "values (:pid, :tag) on conflict do nothing"
            ),
            {"pid": product_id, "tag": tag},
        )
    await audit(
        session,
        request,
        admin,
        "products.create",
        "product",
        str(product_id),
        {"name": payload.name},
    )
    await session.commit()
    return {"id": str(product_id)}


@router.patch("/products/{product_id}")
async def admin_update_product(
    product_id: str,
    payload: AdminProductUpdateSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, bool]:
    from app.core.errors import NotFoundError

    if payload.availability and payload.availability not in (
        "in_stock",
        "out_of_stock",
        "unknown",
    ):
        raise ValidationAppError("Invalid availability.")
    if payload.price is not None and payload.price < 0:
        raise ValidationAppError("Price must not be negative.")

    row = (
        await session.execute(
            text(
                """
                update public.products set
                  name = coalesce(:name, name),
                  brand = coalesce(:brand, brand),
                  description = coalesce(:description, description),
                  price = coalesce(:price, price),
                  availability = coalesce(:availability, availability),
                  is_active = coalesce(:is_active, is_active)
                where id = :id
                returning id
                """
            ),
            {
                "id": product_id,
                "name": payload.name,
                "brand": payload.brand,
                "description": payload.description,
                "price": payload.price,
                "availability": payload.availability,
                "is_active": payload.is_active,
            },
        )
    ).first()
    if row is None:
        raise NotFoundError("Product not found.")
    await audit(
        session,
        request,
        admin,
        "products.update",
        "product",
        product_id,
        payload.model_dump(exclude_none=True),
    )
    await session.commit()
    return {"ok": True}


# --------------------------------------------------------------------------
# Palette colour + cosmetic CRUD, season/sub-season updates
# --------------------------------------------------------------------------


class PaletteColourWriteSchema(CamelModel):
    season_slug: str
    subseason_slug: str | None = None
    name: str
    hex: str
    palette_group: str
    colour_family: str = ""
    recommended_use: str = ""
    priority: int = 100


@router.post("/palette-colours", status_code=201)
async def admin_create_palette_colour(
    payload: PaletteColourWriteSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    import re as re_module

    import numpy as np

    from app.analysis.colour_features.conversions import rgb_to_lab

    if not re_module.fullmatch(r"#[0-9a-fA-F]{6}", payload.hex):
        raise ValidationAppError("Hex must look like #rrggbb.")
    valid_groups = {
        "neutrals",
        "core",
        "accents",
        "formal",
        "casual",
        "accessories",
        "headwear",
        "cautious",
    }
    if payload.palette_group not in valid_groups:
        raise ValidationAppError("Unknown palette group.")

    season_id = (
        await session.execute(
            text("select id from public.colour_seasons where slug = :slug"),
            {"slug": payload.season_slug},
        )
    ).scalar_one_or_none()
    if season_id is None:
        raise ValidationAppError("Unknown season.")
    subseason_id = None
    if payload.subseason_slug:
        subseason_id = (
            await session.execute(
                text("select id from public.colour_subseasons where slug = :slug"),
                {"slug": payload.subseason_slug},
            )
        ).scalar_one_or_none()
        if subseason_id is None:
            raise ValidationAppError("Unknown sub-season.")

    hex_value = payload.hex.lstrip("#").lower()
    rgb = [int(hex_value[i : i + 2], 16) for i in (0, 2, 4)]
    lab = rgb_to_lab(np.array(rgb, dtype=np.uint8))
    colour_id = (
        await session.execute(
            text(
                """
                insert into public.palette_colours
                  (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b,
                   palette_group, colour_family, recommended_use, priority)
                values
                  (:season_id, :subseason_id, :name, :hex, :l, :a, :b,
                   :palette_group, :colour_family, :recommended_use, :priority)
                returning id
                """
            ),
            {
                "season_id": season_id,
                "subseason_id": subseason_id,
                "name": payload.name.strip(),
                "hex": f"#{hex_value}",
                "l": round(float(lab[0]), 2),
                "a": round(float(lab[1]), 2),
                "b": round(float(lab[2]), 2),
                "palette_group": payload.palette_group,
                "colour_family": payload.colour_family,
                "recommended_use": payload.recommended_use,
                "priority": payload.priority,
            },
        )
    ).scalar_one()
    await audit(
        session,
        request,
        admin,
        "palette.create",
        "palette_colour",
        str(colour_id),
        {"name": payload.name, "season": payload.season_slug},
    )
    await session.commit()
    return {"id": str(colour_id)}


class PaletteColourUpdateSchema(CamelModel):
    name: str | None = None
    recommended_use: str | None = None
    priority: int | None = None
    is_active: bool | None = None


@router.patch("/palette-colours/{colour_id}")
async def admin_update_palette_colour(
    colour_id: str,
    payload: PaletteColourUpdateSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, bool]:
    from app.core.errors import NotFoundError

    row = (
        await session.execute(
            text(
                """
                update public.palette_colours set
                  name = coalesce(:name, name),
                  recommended_use = coalesce(:use, recommended_use),
                  priority = coalesce(:priority, priority),
                  is_active = coalesce(:is_active, is_active)
                where id = :id returning id
                """
            ),
            {
                "id": colour_id,
                "name": payload.name,
                "use": payload.recommended_use,
                "priority": payload.priority,
                "is_active": payload.is_active,
            },
        )
    ).first()
    if row is None:
        raise NotFoundError("Palette colour not found.")
    await audit(
        session,
        request,
        admin,
        "palette.update",
        "palette_colour",
        colour_id,
        payload.model_dump(exclude_none=True),
    )
    await session.commit()
    return {"ok": True}


@router.delete("/palette-colours/{colour_id}", status_code=204)
async def admin_delete_palette_colour(
    colour_id: str,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    from app.core.errors import NotFoundError

    row = (
        await session.execute(
            text("delete from public.palette_colours where id = :id returning id"),
            {"id": colour_id},
        )
    ).first()
    if row is None:
        raise NotFoundError("Palette colour not found.")
    await audit(session, request, admin, "palette.delete", "palette_colour", colour_id)
    await session.commit()


class SeasonUpdateSchema(CamelModel):
    name: str | None = None
    tagline: str | None = None
    description: str | None = None
    is_active: bool | None = None


@router.patch("/seasons/{slug}")
async def admin_update_season(
    slug: str,
    payload: SeasonUpdateSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, bool]:
    from app.core.errors import NotFoundError

    row = (
        await session.execute(
            text(
                """
                update public.colour_seasons set
                  name = coalesce(:name, name),
                  tagline = coalesce(:tagline, tagline),
                  description = coalesce(:description, description),
                  is_active = coalesce(:is_active, is_active)
                where slug = :slug returning id
                """
            ),
            {"slug": slug, **payload.model_dump()},
        )
    ).first()
    if row is None:
        raise NotFoundError("Season not found.")
    await audit(
        session,
        request,
        admin,
        "seasons.update",
        "colour_season",
        slug,
        payload.model_dump(exclude_none=True),
    )
    await session.commit()
    return {"ok": True}


class CosmeticWriteSchema(CamelModel):
    season_slug: str
    product_type: str
    name: str
    hex: str
    intensity: str = "medium"
    occasion: str = "any"
    usage_note: str = ""


@router.post("/cosmetics", status_code=201)
async def admin_create_cosmetic(
    payload: CosmeticWriteSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    import re as re_module

    if not re_module.fullmatch(r"#[0-9a-fA-F]{6}", payload.hex):
        raise ValidationAppError("Hex must look like #rrggbb.")
    if payload.product_type not in (
        "lipstick",
        "blusher",
        "eyeshadow",
        "eyeliner",
        "highlighter",
        "foundation",
    ):
        raise ValidationAppError("Unknown product type.")
    if payload.intensity not in ("soft", "medium", "bold"):
        raise ValidationAppError("Intensity must be soft, medium, or bold.")
    if payload.occasion not in ("day", "evening", "any"):
        raise ValidationAppError("Occasion must be day, evening, or any.")

    season_id = (
        await session.execute(
            text("select id from public.colour_seasons where slug = :slug"),
            {"slug": payload.season_slug},
        )
    ).scalar_one_or_none()
    if season_id is None:
        raise ValidationAppError("Unknown season.")

    cosmetic_id = (
        await session.execute(
            text(
                """
                insert into public.cosmetic_recommendations
                  (season_id, product_type, name, hex, intensity, occasion, usage_note)
                values (:season_id, :type, :name, :hex, :intensity, :occasion, :note)
                returning id
                """
            ),
            {
                "season_id": season_id,
                "type": payload.product_type,
                "name": payload.name.strip(),
                "hex": payload.hex.lower(),
                "intensity": payload.intensity,
                "occasion": payload.occasion,
                "note": payload.usage_note,
            },
        )
    ).scalar_one()
    await audit(
        session,
        request,
        admin,
        "cosmetics.create",
        "cosmetic",
        str(cosmetic_id),
        {"name": payload.name},
    )
    await session.commit()
    return {"id": str(cosmetic_id)}


class CosmeticUpdateSchema(CamelModel):
    name: str | None = None
    usage_note: str | None = None
    is_active: bool | None = None


@router.patch("/cosmetics/{cosmetic_id}")
async def admin_update_cosmetic(
    cosmetic_id: str,
    payload: CosmeticUpdateSchema,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, bool]:
    from app.core.errors import NotFoundError

    row = (
        await session.execute(
            text(
                """
                update public.cosmetic_recommendations set
                  name = coalesce(:name, name),
                  usage_note = coalesce(:note, usage_note),
                  is_active = coalesce(:is_active, is_active)
                where id = :id returning id
                """
            ),
            {
                "id": cosmetic_id,
                "name": payload.name,
                "note": payload.usage_note,
                "is_active": payload.is_active,
            },
        )
    ).first()
    if row is None:
        raise NotFoundError("Cosmetic not found.")
    await audit(
        session,
        request,
        admin,
        "cosmetics.update",
        "cosmetic",
        cosmetic_id,
        payload.model_dump(exclude_none=True),
    )
    await session.commit()
    return {"ok": True}


@router.delete("/cosmetics/{cosmetic_id}", status_code=204)
async def admin_delete_cosmetic(
    cosmetic_id: str,
    request: Request,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    from app.core.errors import NotFoundError

    row = (
        await session.execute(
            text("delete from public.cosmetic_recommendations where id = :id returning id"),
            {"id": cosmetic_id},
        )
    ).first()
    if row is None:
        raise NotFoundError("Cosmetic not found.")
    await audit(session, request, admin, "cosmetics.delete", "cosmetic", cosmetic_id)
    await session.commit()
