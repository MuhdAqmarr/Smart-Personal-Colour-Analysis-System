"""Analysis endpoints.

Phase 5 exposes the quality gate; the full analysis endpoint follows with
the colour engine. Uploaded bytes are processed in memory only and are
never logged or written to disk.
"""

from __future__ import annotations

from typing import Annotated

import anyio
from fastapi import APIRouter, File, Request, UploadFile

from app.analysis.pipeline import run_quality_stage
from app.core.classifier import get_classifier_config
from app.core.config import get_settings
from app.schemas.analysis import QualityReportSchema
from app.security.rate_limit import limiter

router = APIRouter(tags=["analyses"])


def _rate_limit() -> str:
    return get_settings().rate_limit


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
