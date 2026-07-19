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
