"""API schemas for analysis endpoints (camelCase JSON, mirrors contracts)."""

from __future__ import annotations

from typing import Literal

from app.analysis.types import QualityReportData
from app.schemas.common import CamelModel


class QualityComponentScores(CamelModel):
    face_detection: float
    face_size: float
    pose: float
    sharpness: float
    exposure: float
    lighting_consistency: float
    colour_cast: float
    usable_skin_area: float


class PoseSchema(CamelModel):
    yaw_degrees: float
    pitch_degrees: float
    roll_degrees: float


class QualityIssueSchema(CamelModel):
    code: str
    message: str
    severity: Literal["info", "warning", "blocking"]


class QualityReportSchema(CamelModel):
    overall_score: float
    acceptable: bool
    components: QualityComponentScores
    exposure_status: Literal[
        "acceptable", "too_dark", "too_bright", "strong_shadow", "uneven_lighting", "low_contrast"
    ]
    colour_cast: Literal["none", "yellow", "blue", "red", "green"]
    pose: PoseSchema
    issues: list[QualityIssueSchema]
    retake_tips: list[str]

    @classmethod
    def from_report(cls, report: QualityReportData) -> QualityReportSchema:
        return cls(
            overall_score=report.overall_score,
            acceptable=report.acceptable,
            components=QualityComponentScores(
                face_detection=report.components["faceDetection"],
                face_size=report.components["faceSize"],
                pose=report.components["pose"],
                sharpness=report.components["sharpness"],
                exposure=report.components["exposure"],
                lighting_consistency=report.components["lightingConsistency"],
                colour_cast=report.components["colourCast"],
                usable_skin_area=report.components["usableSkinArea"],
            ),
            exposure_status=report.exposure.status,
            colour_cast=report.cast.direction,
            pose=PoseSchema(
                yaw_degrees=round(report.pose.yaw_degrees, 2),
                pitch_degrees=round(report.pose.pitch_degrees, 2),
                roll_degrees=round(report.pose.roll_degrees, 2),
            ),
            issues=[
                QualityIssueSchema(code=i.code, message=i.message, severity=i.severity)
                for i in report.issues
            ],
            retake_tips=report.retake_tips,
        )


class RgbSchema(CamelModel):
    r: float
    g: float
    b: float


class HsvSchema(CamelModel):
    h: float
    s: float
    v: float


class LabSchema(CamelModel):
    l: float  # noqa: E741 — CIE L* axis; the name is the domain standard
    a: float
    b: float


class ColourSampleSchema(CamelModel):
    region: Literal["forehead", "left_cheek", "right_cheek", "combined"]
    rgb: RgbSchema
    hex: str
    hsv: HsvSchema
    lab: LabSchema
    chroma: float
    hue_angle_degrees: float
    usable_pixel_ratio: float
    pixel_count: int


class UndertoneResultSchema(CamelModel):
    undertone: Literal["warm", "cool"]
    internal_undertone: Literal["warm", "cool", "neutral", "uncertain"]
    score: float
    confidence: float
    confidence_label: Literal["high", "medium", "low"]
    evidence: list[str]
    warnings: list[str]


class SeasonDimensionsSchema(CamelModel):
    temperature: float
    value: float
    chroma: float
    contrast: float


class SeasonResultSchema(CamelModel):
    season: Literal["spring", "summer", "autumn", "winter"]
    sub_season: str | None
    scores: dict[str, float]
    dimensions: SeasonDimensionsSchema


class ExplanationSchema(CamelModel):
    summary: str
    evidence: list[str]
    quality_notes: list[str]
    improvement_tips: list[str]


class AnalysisResultSchema(CamelModel):
    analysis_id: str | None
    persisted: bool
    classifier_version: str
    processing_ms: int
    quality: QualityReportSchema
    samples: list[ColourSampleSchema]
    undertone: UndertoneResultSchema
    season: SeasonResultSchema
    confidence: float
    confidence_label: Literal["high", "medium", "low"]
    explanation: ExplanationSchema
