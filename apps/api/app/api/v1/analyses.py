"""Analysis endpoints.

Uploaded bytes are processed in memory only and are never logged or
written to disk. Guests receive full results with nothing persisted;
persistence for authenticated users is handled by the results service.
"""

from __future__ import annotations

import json
import math
from typing import Annotated
from uuid import UUID

import anyio
from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.pipeline import run_full_analysis, run_quality_stage
from app.analysis.preprocessing.validation import UploadLimits, validate_and_decode
from app.core.classifier import get_classifier_config
from app.core.config import get_settings
from app.core.db import get_db_session
from app.core.errors import NotFoundError, ValidationAppError
from app.core.logging import get_logger
from app.repositories import analyses as repo
from app.schemas.analysis import (
    AnalysisDetailSchema,
    AnalysisListSchema,
    AnalysisResultSchema,
    AnalysisSummarySchema,
    PaginationSchema,
    QualityReportSchema,
    SaveImageResponseSchema,
    StoredSampleSchema,
)
from app.security.auth import CurrentUser, get_optional_user
from app.security.rate_limit import limiter
from app.services.analysis_mapper import result_to_schema
from app.services.storage import StorageUnavailableError, get_storage

logger = get_logger(__name__)

router = APIRouter(tags=["analyses"])

_ALLOWED_QUESTIONNAIRE_KEYS = {
    "naturalHairColour",
    "naturalEyeColour",
    "perceivedContrast",
    "jewelleryPreference",
    "sunReaction",
}


def _rate_limit() -> str:
    return get_settings().rate_limit


def _parse_questionnaire(raw: str | None) -> dict[str, str] | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValidationAppError("The questionnaire payload is not valid JSON.") from exc
    if not isinstance(parsed, dict):
        raise ValidationAppError("The questionnaire payload must be an object.")
    cleaned = {
        key: value
        for key, value in parsed.items()
        if key in _ALLOWED_QUESTIONNAIRE_KEYS and isinstance(value, str) and len(value) <= 40
    }
    return cleaned or None


@router.post("/analyses/preview-quality", response_model=QualityReportSchema)
@limiter.limit(_rate_limit)
async def preview_quality(
    request: Request,
    image: Annotated[UploadFile, File(description="Facial photo (JPEG/PNG/WebP)")],
) -> QualityReportSchema:
    """Validate a photo and return the quality report without analysing
    colours or persisting anything.

    Returns 200 with `acceptable: false` (plus issues and retake tips) for
    gradable problems; structural failures (no face, several faces, decode
    errors, oversized files) return a structured error envelope.
    """
    settings = get_settings()
    config = get_classifier_config()
    data = await image.read()

    # The pipeline is CPU-bound; keep the event loop responsive.
    result = await anyio.to_thread.run_sync(
        lambda: run_quality_stage(
            data,
            declared_mime=image.content_type,
            filename=image.filename,
            config=config,
            max_upload_bytes=settings.max_image_size_bytes,
        )
    )
    return QualityReportSchema.from_report(result.report)


@router.post("/analyses", response_model=AnalysisResultSchema)
@limiter.limit(_rate_limit)
async def create_analysis(
    request: Request,
    image: Annotated[UploadFile, File(description="Facial photo (JPEG/PNG/WebP)")],
    save_image: Annotated[bool, Form()] = False,
    questionnaire: Annotated[str | None, Form()] = None,
) -> AnalysisResultSchema:
    """Run the full colour analysis.

    Guests receive the complete result and nothing is persisted. For
    authenticated users the results service stores derived values (and the
    image only when `save_image` was consented) — wired in the results
    phase; the analysis itself is identical for both.
    """
    settings = get_settings()
    config = get_classifier_config()
    user = await get_optional_user(request)
    questionnaire_data = _parse_questionnaire(questionnaire)
    data = await image.read()

    result = await anyio.to_thread.run_sync(
        lambda: run_full_analysis(
            data,
            declared_mime=image.content_type,
            filename=image.filename,
            config=config,
            max_upload_bytes=settings.max_image_size_bytes,
            questionnaire=questionnaire_data,
        )
    )

    # Guests are never persisted. Authenticated users get a stored record
    # of derived values; the original image is stored ONLY on explicit
    # opt-in and only when storage is configured.
    if user is None:
        return result_to_schema(result, analysis_id=None, persisted=False)

    factory = getattr(request.app.state, "db_session_factory", None)
    if factory is None:
        # No database configured (local guest-only mode): behave like guest.
        return result_to_schema(result, analysis_id=None, persisted=False)

    async with factory() as session:
        analysis_id = await repo.persist_analysis(session, user.user_id, result, questionnaire_data)
        if save_image:
            try:
                storage = get_storage(settings)
                path = storage.object_path(str(user.user_id), str(analysis_id))
                await storage.upload(path, data, image.content_type or "image/jpeg")
                await repo.record_analysis_image(
                    session,
                    user.user_id,
                    analysis_id,
                    path,
                    image.content_type or "image/jpeg",
                    len(data),
                )
            except StorageUnavailableError:
                logger.info("image_storage_skipped", reason="not_configured")
        await session.commit()

    return result_to_schema(result, analysis_id=str(analysis_id), persisted=True)


@router.get("/analyses", response_model=AnalysisListSchema)
async def list_analyses(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 12,
) -> AnalysisListSchema:
    """The authenticated user's saved analyses, newest first."""
    rows, total = await repo.list_analyses(session, user.user_id, page, page_size)
    return AnalysisListSchema(
        items=[
            AnalysisSummarySchema(
                id=str(row["id"]),
                undertone=row["undertone"],
                season_slug=row["season_slug"],
                subseason_slug=row["subseason_slug"],
                confidence=float(row["confidence"]),
                confidence_label=row["confidence_label"],
                classifier_version=row["classifier_version"],
                overall_score=float(row["overall_score"])
                if row["overall_score"] is not None
                else None,
                combined_hex=row["combined_hex"],
                has_image=bool(row["has_image"]),
                created_at=row["created_at"].isoformat(),
            )
            for row in rows
        ],
        pagination=PaginationSchema(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=max(1, math.ceil(total / page_size)) if total else 0,
        ),
    )


@router.get("/analyses/{analysis_id}", response_model=AnalysisDetailSchema)
async def get_analysis(
    analysis_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AnalysisDetailSchema:
    """Full detail of one owned analysis, including a short-lived signed
    image URL when a stored image exists."""
    detail = await repo.get_analysis_detail(session, user.user_id, analysis_id)
    if detail is None:
        raise NotFoundError("This analysis does not exist or belongs to another account.")

    image_url: str | None = None
    if detail.get("storage_path"):
        try:
            storage = get_storage(get_settings())
            image_url = await storage.create_signed_url(str(detail["storage_path"]))
        except StorageUnavailableError:
            image_url = None

    return AnalysisDetailSchema(
        id=str(detail["id"]),
        undertone=detail["undertone"],
        internal_undertone=detail["internal_undertone"],
        undertone_score=float(detail["undertone_score"]),
        season_slug=detail["season_slug"],
        subseason_slug=detail["subseason_slug"],
        confidence=float(detail["confidence"]),
        confidence_label=detail["confidence_label"],
        classifier_version=detail["classifier_version"],
        processing_ms=int(detail["processing_ms"]),
        created_at=detail["created_at"].isoformat(),
        quality=detail["quality"],
        classification=detail["classification"],
        samples=[
            StoredSampleSchema(
                region=s["region"],
                r=s["r"],
                g=s["g"],
                b=s["b"],
                hex=s["hex"],
                hsv_h=float(s["hsv_h"]),
                hsv_s=float(s["hsv_s"]),
                hsv_v=float(s["hsv_v"]),
                lab_l=float(s["lab_l"]),
                lab_a=float(s["lab_a"]),
                lab_b=float(s["lab_b"]),
                chroma=float(s["chroma"]),
                hue_angle_degrees=float(s["hue_angle_degrees"]),
                usable_pixel_ratio=float(s["usable_pixel_ratio"]),
                pixel_count=int(s["pixel_count"]),
            )
            for s in detail["samples"]
        ],
        has_image=bool(detail.get("storage_path")),
        image_url=image_url,
    )


@router.delete("/analyses/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """Delete an owned analysis (metrics, samples, classification, and any
    stored image go with it)."""
    image_path = await repo.delete_analysis(session, user.user_id, analysis_id)
    if image_path is None:
        raise NotFoundError("This analysis does not exist or belongs to another account.")
    await session.commit()

    if image_path:
        try:
            storage = get_storage(get_settings())
            await storage.delete([image_path])
        except StorageUnavailableError:
            pass


@router.post("/analyses/{analysis_id}/save-image", response_model=SaveImageResponseSchema)
@limiter.limit(_rate_limit)
async def save_analysis_image(
    request: Request,
    analysis_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    image: Annotated[UploadFile, File(description="The analysed photo, re-sent by the client")],
) -> SaveImageResponseSchema:
    """Store the analysis image after the fact.

    Privacy by design: the server never keeps the original image, so the
    client re-sends the photo it still holds. The upload is validated the
    same way as an analysis upload, stored in the private bucket, and
    recorded against the owned analysis.
    """
    settings = get_settings()
    config = get_classifier_config()
    data = await image.read()

    # Validate it really is a decodable image within limits (no analysis).
    image_cfg = config.image
    await anyio.to_thread.run_sync(
        lambda: validate_and_decode(
            data,
            declared_mime=image.content_type,
            filename=image.filename,
            limits=UploadLimits(
                max_bytes=settings.max_image_size_bytes,
                max_decoded_pixels=image_cfg.maxDecodedPixels,
                min_edge_pixels=image_cfg.minEdgePixels,
                max_analysis_edge_pixels=image_cfg.maxAnalysisEdgePixels,
                allowed_formats=tuple(image_cfg.allowedFormats),
            ),
        )
    )

    storage = get_storage(settings)  # raises 503 when not configured
    path = storage.object_path(str(user.user_id), str(analysis_id))
    recorded = await repo.record_analysis_image(
        session,
        user.user_id,
        analysis_id,
        path,
        image.content_type or "image/jpeg",
        len(data),
    )
    if not recorded:
        raise NotFoundError("This analysis does not exist or belongs to another account.")
    await storage.upload(path, data, image.content_type or "image/jpeg")
    await session.commit()

    url = await storage.create_signed_url(path)
    return SaveImageResponseSchema(analysis_id=str(analysis_id), stored=True, image_url=url)


@router.delete("/analyses/{analysis_id}/image", status_code=204)
async def delete_analysis_image(
    analysis_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """Delete the stored image while keeping the analysis result."""
    path = await repo.delete_analysis_image(session, user.user_id, analysis_id)
    if path is None:
        raise NotFoundError("No stored image exists for this analysis.")
    await session.commit()
    try:
        storage = get_storage(get_settings())
        await storage.delete([path])
    except StorageUnavailableError:
        pass
