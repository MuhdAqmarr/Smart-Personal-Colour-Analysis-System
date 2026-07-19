"""Analysis endpoints.

Uploaded bytes are processed in memory only and are never logged or
written to disk. Guests receive full results with nothing persisted;
persistence for authenticated users is handled by the results service.
"""

from __future__ import annotations

import json
from typing import Annotated

import anyio
from fastapi import APIRouter, File, Form, Request, UploadFile

from app.analysis.pipeline import run_full_analysis, run_quality_stage
from app.core.classifier import get_classifier_config
from app.core.config import get_settings
from app.core.errors import ValidationAppError
from app.schemas.analysis import AnalysisResultSchema, QualityReportSchema
from app.security.auth import get_optional_user
from app.security.rate_limit import limiter
from app.services.analysis_mapper import result_to_schema

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

    # Persistence for authenticated users arrives with the results service;
    # the response shape is already final.
    _ = user, save_image
    return result_to_schema(result, analysis_id=None, persisted=False)
