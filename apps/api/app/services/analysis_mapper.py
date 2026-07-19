"""Mapping from pipeline dataclasses to API schemas."""

from __future__ import annotations

from app.analysis.pipeline import FullAnalysisResult
from app.analysis.skin_regions.filtering import RegionColourSample
from app.schemas.analysis import (
    AnalysisResultSchema,
    ColourSampleSchema,
    ExplanationSchema,
    HsvSchema,
    LabSchema,
    QualityReportSchema,
    RgbSchema,
    SeasonDimensionsSchema,
    SeasonResultSchema,
    UndertoneResultSchema,
)


def sample_to_schema(sample: RegionColourSample) -> ColourSampleSchema:
    return ColourSampleSchema(
        region=sample.region,  # type: ignore[arg-type]
        rgb=RgbSchema(
            r=round(sample.rgb_median[0], 1),
            g=round(sample.rgb_median[1], 1),
            b=round(sample.rgb_median[2], 1),
        ),
        hex=sample.hex,
        hsv=HsvSchema(
            h=round(sample.hsv[0], 2), s=round(sample.hsv[1], 4), v=round(sample.hsv[2], 4)
        ),
        lab=LabSchema(
            l=round(sample.lab[0], 2), a=round(sample.lab[1], 2), b=round(sample.lab[2], 2)
        ),
        chroma=round(sample.chroma, 2),
        hue_angle_degrees=round(sample.hue_angle_degrees, 2),
        usable_pixel_ratio=round(sample.usable_ratio, 4),
        pixel_count=sample.usable_pixels,
    )


def result_to_schema(
    result: FullAnalysisResult,
    *,
    analysis_id: str | None = None,
    persisted: bool = False,
) -> AnalysisResultSchema:
    sub_season = result.sub_season.sub_season if result.show_sub_season else None
    return AnalysisResultSchema(
        analysis_id=analysis_id,
        persisted=persisted,
        classifier_version=result.classifier_version,
        processing_ms=result.processing_ms,
        quality=QualityReportSchema.from_report(result.quality),
        samples=[sample_to_schema(sample) for sample in result.samples],
        undertone=UndertoneResultSchema(
            undertone=result.undertone.undertone,
            internal_undertone=result.undertone.internal,
            score=result.undertone.score,
            confidence=result.confidence.confidence,
            confidence_label=result.confidence.label,
            evidence=result.explanation.evidence,
            warnings=result.explanation.warnings,
        ),
        season=SeasonResultSchema(
            season=result.seasons.season,  # type: ignore[arg-type]
            sub_season=sub_season,
            scores=result.seasons.scores,
            dimensions=SeasonDimensionsSchema(
                temperature=result.seasons.dimensions["temperature"],
                value=result.seasons.dimensions["value"],
                chroma=result.seasons.dimensions["chroma"],
                contrast=result.seasons.dimensions["contrast"],
            ),
        ),
        confidence=result.confidence.confidence,
        confidence_label=result.confidence.label,
        explanation=ExplanationSchema(
            summary=result.explanation.summary,
            evidence=result.explanation.evidence,
            quality_notes=result.explanation.quality_notes,
            improvement_tips=result.explanation.improvement_tips,
        ),
    )
