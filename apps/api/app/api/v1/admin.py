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
