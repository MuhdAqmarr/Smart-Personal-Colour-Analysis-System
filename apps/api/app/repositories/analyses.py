"""Persistence for analyses and their derived features.

Ownership is enforced in every query (`user_id = :user_id`) — the backend
holds privileged database credentials, so RLS protects only the direct
PostgREST surface. Guests are never persisted (analyses.user_id NOT NULL).
"""

from __future__ import annotations

import json
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.pipeline import FullAnalysisResult


async def get_algorithm_version_id(session: AsyncSession, version: str) -> UUID | None:
    result = await session.execute(
        text("select id from public.algorithm_versions where version = :version"),
        {"version": version},
    )
    row = result.first()
    return row[0] if row else None


async def persist_analysis(
    session: AsyncSession,
    user_id: UUID,
    result: FullAnalysisResult,
    questionnaire: dict[str, Any] | None,
) -> UUID:
    """Insert the analysis with metrics, samples, and classification.

    Runs inside one transaction (caller commits).
    """
    algorithm_version_id = await get_algorithm_version_id(session, result.classifier_version)
    sub_season = result.sub_season.sub_season if result.show_sub_season else None

    inserted = await session.execute(
        text(
            """
            insert into public.analyses
              (user_id, algorithm_version_id, classifier_version, undertone,
               internal_undertone, undertone_score, season_slug, subseason_slug,
               confidence, confidence_label, processing_ms, questionnaire)
            values
              (:user_id, :algorithm_version_id, :classifier_version, :undertone,
               :internal_undertone, :undertone_score, :season_slug, :subseason_slug,
               :confidence, :confidence_label, :processing_ms, :questionnaire)
            returning id
            """
        ),
        {
            "user_id": str(user_id),
            "algorithm_version_id": str(algorithm_version_id) if algorithm_version_id else None,
            "classifier_version": result.classifier_version,
            "undertone": result.undertone.undertone,
            "internal_undertone": result.undertone.internal,
            "undertone_score": result.undertone.score,
            "season_slug": result.seasons.season,
            "subseason_slug": sub_season,
            "confidence": result.confidence.confidence,
            "confidence_label": result.confidence.label,
            "processing_ms": result.processing_ms,
            "questionnaire": json.dumps(questionnaire) if questionnaire else None,
        },
    )
    analysis_id: UUID = inserted.scalar_one()

    quality = result.quality
    await session.execute(
        text(
            """
            insert into public.analysis_quality_metrics
              (analysis_id, overall_score, acceptable, face_detection, face_size, pose,
               sharpness, exposure, lighting_consistency, colour_cast, usable_skin_area,
               exposure_status, colour_cast_direction, yaw_degrees, pitch_degrees,
               roll_degrees, issues)
            values
              (:analysis_id, :overall_score, :acceptable, :face_detection, :face_size, :pose,
               :sharpness, :exposure, :lighting_consistency, :colour_cast, :usable_skin_area,
               :exposure_status, :colour_cast_direction, :yaw_degrees, :pitch_degrees,
               :roll_degrees, :issues)
            """
        ),
        {
            "analysis_id": str(analysis_id),
            "overall_score": quality.overall_score,
            "acceptable": quality.acceptable,
            "face_detection": quality.components["faceDetection"],
            "face_size": quality.components["faceSize"],
            "pose": quality.components["pose"],
            "sharpness": quality.components["sharpness"],
            "exposure": quality.components["exposure"],
            "lighting_consistency": quality.components["lightingConsistency"],
            "colour_cast": quality.components["colourCast"],
            "usable_skin_area": quality.components["usableSkinArea"],
            "exposure_status": quality.exposure.status,
            "colour_cast_direction": quality.cast.direction,
            "yaw_degrees": round(quality.pose.yaw_degrees, 2),
            "pitch_degrees": round(quality.pose.pitch_degrees, 2),
            "roll_degrees": round(quality.pose.roll_degrees, 2),
            "issues": json.dumps(
                [
                    {"code": issue.code, "message": issue.message, "severity": issue.severity}
                    for issue in quality.issues
                ]
            ),
        },
    )

    for sample in result.samples:
        rgb = [int(round(channel)) for channel in sample.rgb_median]
        await session.execute(
            text(
                """
                insert into public.analysis_colour_samples
                  (analysis_id, region, r, g, b, hex, hsv_h, hsv_s, hsv_v,
                   lab_l, lab_a, lab_b, chroma, hue_angle_degrees,
                   usable_pixel_ratio, pixel_count)
                values
                  (:analysis_id, :region, :r, :g, :b, :hex, :hsv_h, :hsv_s, :hsv_v,
                   :lab_l, :lab_a, :lab_b, :chroma, :hue_angle_degrees,
                   :usable_pixel_ratio, :pixel_count)
                """
            ),
            {
                "analysis_id": str(analysis_id),
                "region": sample.region,
                "r": min(255, max(0, rgb[0])),
                "g": min(255, max(0, rgb[1])),
                "b": min(255, max(0, rgb[2])),
                "hex": sample.hex,
                "hsv_h": round(sample.hsv[0], 2),
                "hsv_s": round(sample.hsv[1], 4),
                "hsv_v": round(sample.hsv[2], 4),
                "lab_l": round(sample.lab[0], 2),
                "lab_a": round(sample.lab[1], 2),
                "lab_b": round(sample.lab[2], 2),
                "chroma": round(sample.chroma, 2),
                "hue_angle_degrees": round(sample.hue_angle_degrees, 2),
                "usable_pixel_ratio": round(sample.usable_ratio, 4),
                "pixel_count": sample.usable_pixels,
            },
        )

    await session.execute(
        text(
            """
            insert into public.analysis_classifications
              (analysis_id, season_scores, dim_temperature, dim_value, dim_chroma,
               dim_contrast, evidence, warnings, improvement_tips)
            values
              (:analysis_id, :season_scores, :dim_temperature, :dim_value, :dim_chroma,
               :dim_contrast, :evidence, :warnings, :improvement_tips)
            """
        ),
        {
            "analysis_id": str(analysis_id),
            "season_scores": json.dumps(result.seasons.scores),
            "dim_temperature": result.seasons.dimensions["temperature"],
            "dim_value": result.seasons.dimensions["value"],
            "dim_chroma": result.seasons.dimensions["chroma"],
            "dim_contrast": result.seasons.dimensions["contrast"],
            "evidence": json.dumps(result.explanation.evidence),
            "warnings": json.dumps(result.explanation.warnings),
            "improvement_tips": json.dumps(result.explanation.improvement_tips),
        },
    )
    return analysis_id


async def list_analyses(
    session: AsyncSession, user_id: UUID, page: int, page_size: int
) -> tuple[list[dict[str, Any]], int]:
    total = (
        await session.execute(
            text("select count(*) from public.analyses where user_id = :user_id"),
            {"user_id": str(user_id)},
        )
    ).scalar_one()

    rows = await session.execute(
        text(
            """
            select a.id, a.undertone, a.season_slug, a.subseason_slug, a.confidence,
                   a.confidence_label, a.classifier_version, a.created_at,
                   qm.overall_score,
                   cs.hex as combined_hex,
                   (ai.id is not null) as has_image
            from public.analyses a
            left join public.analysis_quality_metrics qm on qm.analysis_id = a.id
            left join public.analysis_colour_samples cs
              on cs.analysis_id = a.id and cs.region = 'combined'
            left join public.analysis_images ai on ai.analysis_id = a.id
            where a.user_id = :user_id
            order by a.created_at desc
            limit :limit offset :offset
            """
        ),
        {
            "user_id": str(user_id),
            "limit": page_size,
            "offset": (page - 1) * page_size,
        },
    )
    return [dict(row) for row in rows.mappings()], int(total)


async def get_analysis_detail(
    session: AsyncSession, user_id: UUID, analysis_id: UUID
) -> dict[str, Any] | None:
    row = (
        (
            await session.execute(
                text(
                    """
                select a.id, a.undertone, a.internal_undertone, a.undertone_score,
                       a.season_slug, a.subseason_slug, a.confidence, a.confidence_label,
                       a.classifier_version, a.processing_ms, a.questionnaire, a.created_at,
                       row_to_json(qm) as quality,
                       row_to_json(ac) as classification,
                       ai.storage_path, ai.content_type, ai.size_bytes
                from public.analyses a
                left join public.analysis_quality_metrics qm on qm.analysis_id = a.id
                left join public.analysis_classifications ac on ac.analysis_id = a.id
                left join public.analysis_images ai on ai.analysis_id = a.id
                where a.id = :analysis_id and a.user_id = :user_id
                """
                ),
                {"analysis_id": str(analysis_id), "user_id": str(user_id)},
            )
        )
        .mappings()
        .first()
    )
    if row is None:
        return None

    detail = dict(row)
    samples = await session.execute(
        text(
            """
            select region, r, g, b, hex, hsv_h, hsv_s, hsv_v, lab_l, lab_a, lab_b,
                   chroma, hue_angle_degrees, usable_pixel_ratio, pixel_count
            from public.analysis_colour_samples
            where analysis_id = :analysis_id
            order by case region
              when 'forehead' then 1 when 'left_cheek' then 2
              when 'right_cheek' then 3 else 4 end
            """
        ),
        {"analysis_id": str(analysis_id)},
    )
    detail["samples"] = [dict(sample) for sample in samples.mappings()]
    return detail


async def delete_analysis(session: AsyncSession, user_id: UUID, analysis_id: UUID) -> str | None:
    """Delete an owned analysis; returns the stored image path if one existed."""
    image_path = (
        await session.execute(
            text(
                """
                select ai.storage_path from public.analysis_images ai
                join public.analyses a on a.id = ai.analysis_id
                where ai.analysis_id = :analysis_id and a.user_id = :user_id
                """
            ),
            {"analysis_id": str(analysis_id), "user_id": str(user_id)},
        )
    ).scalar_one_or_none()

    deleted = (
        await session.execute(
            text(
                """
                delete from public.analyses
                where id = :analysis_id and user_id = :user_id
                returning id
                """
            ),
            {"analysis_id": str(analysis_id), "user_id": str(user_id)},
        )
    ).scalar_one_or_none()
    if deleted is None:
        return None
    return image_path or ""


async def record_analysis_image(
    session: AsyncSession,
    user_id: UUID,
    analysis_id: UUID,
    storage_path: str,
    content_type: str,
    size_bytes: int,
) -> bool:
    """Insert/replace the image record for an owned analysis."""
    owns = (
        await session.execute(
            text("select 1 from public.analyses where id = :id and user_id = :user_id"),
            {"id": str(analysis_id), "user_id": str(user_id)},
        )
    ).first()
    if owns is None:
        return False
    await session.execute(
        text(
            """
            insert into public.analysis_images
              (analysis_id, user_id, storage_path, content_type, size_bytes)
            values (:analysis_id, :user_id, :storage_path, :content_type, :size_bytes)
            on conflict (analysis_id) do update
              set storage_path = excluded.storage_path,
                  content_type = excluded.content_type,
                  size_bytes = excluded.size_bytes
            """
        ),
        {
            "analysis_id": str(analysis_id),
            "user_id": str(user_id),
            "storage_path": storage_path,
            "content_type": content_type,
            "size_bytes": size_bytes,
        },
    )
    return True


async def delete_analysis_image(
    session: AsyncSession, user_id: UUID, analysis_id: UUID
) -> str | None:
    """Remove the image record for an owned analysis; returns its path."""
    return (
        await session.execute(
            text(
                """
                delete from public.analysis_images
                where analysis_id = :analysis_id and user_id = :user_id
                returning storage_path
                """
            ),
            {"analysis_id": str(analysis_id), "user_id": str(user_id)},
        )
    ).scalar_one_or_none()
