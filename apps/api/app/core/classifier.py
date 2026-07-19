"""Loading and validation of the versioned classifier configuration.

The configuration file (packages/colour-engine/config/classifier-v1.json) is
the single source of truth for every threshold and weight used by the
analysis pipeline. It is loaded once at startup, validated with Pydantic,
and exposed through `get_classifier_config()`.
"""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.config import get_settings


class _StrictModel(BaseModel):
    model_config = ConfigDict(frozen=True, extra="allow")


class ImageConfig(_StrictModel):
    maxUploadMb: int
    allowedFormats: tuple[str, ...]
    maxAnalysisEdgePixels: int
    maxDecodedPixels: int
    minEdgePixels: int


class QualityComponentWeights(_StrictModel):
    faceDetection: float
    faceSize: float
    pose: float
    sharpness: float
    exposure: float
    lightingConsistency: float
    colourCast: float
    usableSkinArea: float

    @property
    def as_dict(self) -> dict[str, float]:
        return {
            "faceDetection": self.faceDetection,
            "faceSize": self.faceSize,
            "pose": self.pose,
            "sharpness": self.sharpness,
            "exposure": self.exposure,
            "lightingConsistency": self.lightingConsistency,
            "colourCast": self.colourCast,
            "usableSkinArea": self.usableSkinArea,
        }


class QualityConfig(_StrictModel):
    minOverallScore: float
    allowLowQualityContinuation: bool
    componentWeights: QualityComponentWeights

    @field_validator("componentWeights")
    @classmethod
    def _weights_sum_to_one(cls, value: QualityComponentWeights) -> QualityComponentWeights:
        total = sum(value.as_dict.values())
        if not math.isclose(total, 1.0, abs_tol=1e-6):
            raise ValueError(f"quality.componentWeights must sum to 1.0, got {total}")
        return value


class SeasonPrototype(_StrictModel):
    temperature: float
    value: float
    chroma: float
    contrast: float


class SeasonsConfig(_StrictModel):
    dimensionWeights: dict[str, float]
    prototypes: dict[str, SeasonPrototype]

    @field_validator("dimensionWeights")
    @classmethod
    def _dimension_weights_sum(cls, value: dict[str, float]) -> dict[str, float]:
        total = sum(value.values())
        if not math.isclose(total, 1.0, abs_tol=1e-6):
            raise ValueError(f"seasons.dimensionWeights must sum to 1.0, got {total}")
        return value

    @field_validator("prototypes")
    @classmethod
    def _all_seasons_present(cls, value: dict[str, SeasonPrototype]) -> dict[str, SeasonPrototype]:
        expected = {"spring", "summer", "autumn", "winter"}
        if set(value) != expected:
            raise ValueError(f"seasons.prototypes must define exactly {sorted(expected)}")
        return value


class ConfidenceConfig(_StrictModel):
    factorWeights: dict[str, float]

    @field_validator("factorWeights")
    @classmethod
    def _factor_weights_sum(cls, value: dict[str, float]) -> dict[str, float]:
        total = sum(value.values())
        if not math.isclose(total, 1.0, abs_tol=1e-6):
            raise ValueError(f"confidence.factorWeights must sum to 1.0, got {total}")
        return value


class ProductMatchingConfig(_StrictModel):
    weights: dict[str, float]
    deltaE00Falloff: float
    maxRecommendations: int

    @field_validator("weights")
    @classmethod
    def _weights_sum(cls, value: dict[str, float]) -> dict[str, float]:
        total = sum(value.values())
        if not math.isclose(total, 1.0, abs_tol=1e-6):
            raise ValueError(f"productMatching.weights must sum to 1.0, got {total}")
        return value


class ClassifierConfig(_StrictModel):
    version: str
    name: str
    image: ImageConfig
    quality: QualityConfig
    seasons: SeasonsConfig
    confidence: ConfidenceConfig
    productMatching: ProductMatchingConfig
    # Sections consumed by pipeline modules with their own validation:
    roi: dict[str, object]
    undertone: dict[str, object]
    dimensions: dict[str, object]
    subSeasons: dict[str, object]


class ClassifierConfigError(RuntimeError):
    """Raised when the classifier configuration is missing or invalid."""


def load_classifier_config(path: Path) -> ClassifierConfig:
    if not path.exists():
        raise ClassifierConfigError(
            f"Classifier configuration not found at {path}. "
            "Set CLASSIFIER_CONFIG_PATH or restore packages/colour-engine/config/."
        )
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ClassifierConfigError(f"Classifier configuration is not valid JSON: {exc}") from exc
    try:
        return ClassifierConfig.model_validate(raw)
    except ValueError as exc:
        raise ClassifierConfigError(f"Classifier configuration failed validation: {exc}") from exc


@lru_cache
def get_classifier_config() -> ClassifierConfig:
    return load_classifier_config(get_settings().classifier_config_path)
