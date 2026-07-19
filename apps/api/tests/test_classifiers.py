"""Classifier behaviour pinned against classifier-v1.json.

Synthetic RegionColourSample feature vectors (spanning documented skin-tone
ranges) feed the classifiers directly — no image I/O — so season/undertone
decision boundaries are tested deterministically.
"""

from __future__ import annotations

from typing import Any

import pytest
from app.analysis.classification.seasons import (
    classify_season,
    classify_sub_season,
    compute_dimensions,
)
from app.analysis.classification.undertone import classify_undertone
from app.analysis.confidence.scoring import compute_confidence
from app.analysis.skin_regions.filtering import RegionColourSample
from app.core.classifier import get_classifier_config


def sample(
    region: str = "combined",
    *,
    lab: tuple[float, float, float],
    hue: float,
    chroma: float,
    usable: int = 5000,
    total: int = 6000,
) -> RegionColourSample:
    return RegionColourSample(
        region=region,
        rgb_median=(180.0, 140.0, 120.0),
        rgb_trimmed_mean=(180.0, 140.0, 120.0),
        rgb_std=(6.0, 6.0, 6.0),
        hex="#b48c78",
        hsv=(20.0, 0.33, 0.7),
        lab=lab,
        chroma=chroma,
        hue_angle_degrees=hue,
        total_pixels=total,
        usable_pixels=usable,
    )


def config_section(name: str) -> dict[str, Any]:
    config = get_classifier_config()
    section = getattr(config, name)
    return section.model_dump() if hasattr(section, "model_dump") else dict(section)


class TestUndertone:
    def test_clearly_warm_skin(self) -> None:
        warm = sample(lab=(62.0, 12.0, 24.0), hue=62.0, chroma=27.0)
        result = classify_undertone(warm, [warm], 85.0, config_section("undertone"))
        assert result.undertone == "warm"
        assert result.internal == "warm"
        assert result.score > 0.4

    def test_clearly_cool_skin(self) -> None:
        cool = sample(lab=(60.0, 16.0, 10.0), hue=32.0, chroma=19.0)
        result = classify_undertone(cool, [cool], 85.0, config_section("undertone"))
        assert result.undertone == "cool"
        assert result.internal == "cool"
        assert result.score < -0.4

    def test_borderline_skin_is_internally_neutral(self) -> None:
        neutral = sample(lab=(63.0, 13.0, 16.5), hue=50.0, chroma=21.0)
        result = classify_undertone(neutral, [neutral], 85.0, config_section("undertone"))
        assert result.internal == "neutral"
        assert result.undertone in ("warm", "cool")  # public output still leans

    def test_low_quality_marks_uncertain(self) -> None:
        warm = sample(lab=(62.0, 12.0, 24.0), hue=62.0, chroma=27.0)
        result = classify_undertone(warm, [warm], 40.0, config_section("undertone"))
        assert result.internal == "uncertain"

    def test_gold_jewellery_nudges_warm(self) -> None:
        borderline = sample(lab=(63.0, 13.0, 17.0), hue=51.0, chroma=21.0)
        base = classify_undertone(borderline, [borderline], 85.0, config_section("undertone"))
        nudged = classify_undertone(
            borderline,
            [borderline],
            85.0,
            config_section("undertone"),
            questionnaire={"jewelleryPreference": "gold"},
        )
        assert nudged.score > base.score

    def test_deterministic(self) -> None:
        warm = sample(lab=(62.0, 12.0, 24.0), hue=62.0, chroma=27.0)
        first = classify_undertone(warm, [warm], 85.0, config_section("undertone"))
        second = classify_undertone(warm, [warm], 85.0, config_section("undertone"))
        assert first == second


class TestSeasons:
    def dimensions_for(
        self, lab: tuple[float, float, float], hue: float, chroma: float, undertone_score: float
    ) -> dict[str, float]:
        combined = sample(lab=lab, hue=hue, chroma=chroma)
        return compute_dimensions(
            combined, [combined], undertone_score, config_section("dimensions")
        )

    @pytest.mark.parametrize(
        ("lab", "hue", "chroma", "undertone_score", "expected"),
        [
            # Warm + light + clear → Spring
            ((70.0, 12.0, 25.0), 64.0, 30.0, 0.8, "spring"),
            # Cool + light + muted → Summer
            ((67.0, 13.0, 11.0), 38.0, 17.0, -0.7, "summer"),
            # Warm + deep + muted → Autumn
            ((48.0, 14.0, 22.0), 60.0, 24.0, 0.7, "autumn"),
            # Cool + deep + clear → Winter
            ((45.0, 17.0, 12.0), 34.0, 30.0, -0.8, "winter"),
        ],
    )
    def test_prototype_regions_map_to_expected_season(
        self,
        lab: tuple[float, float, float],
        hue: float,
        chroma: float,
        undertone_score: float,
        expected: str,
    ) -> None:
        dims = self.dimensions_for(lab, hue, chroma, undertone_score)
        result = classify_season(dims, config_section("seasons"))
        assert result.season == expected
        assert set(result.scores) == {"spring", "summer", "autumn", "winter"}
        assert result.margin >= 0

    def test_temperature_dominates_value_tie(self) -> None:
        # Medium value, warm: must land in a warm season (spring/autumn).
        dims = self.dimensions_for((58.0, 13.0, 22.0), 58.0, 24.0, 0.75)
        result = classify_season(dims, config_section("seasons"))
        assert result.season in ("spring", "autumn")

    def test_scores_bounded(self) -> None:
        dims = self.dimensions_for((60.0, 13.0, 20.0), 50.0, 22.0, 0.0)
        result = classify_season(dims, config_section("seasons"))
        for score in result.scores.values():
            assert 0.0 <= score <= 1.0


class TestSubSeasons:
    def test_light_spring_when_value_high(self) -> None:
        dims = {"temperature": 0.8, "value": 0.8, "chroma": 0.5, "contrast": 0.5}
        result = classify_sub_season("spring", dims, config_section("subSeasons"))
        assert result.sub_season == "light-spring"

    def test_bright_spring_takes_priority_over_light(self) -> None:
        # Both bright and light thresholds met — priority order decides.
        dims = {"temperature": 0.8, "value": 0.8, "chroma": 0.8, "contrast": 0.6}
        result = classify_sub_season("spring", dims, config_section("subSeasons"))
        assert result.sub_season == "bright-spring"

    def test_warm_spring_default(self) -> None:
        dims = {"temperature": 0.85, "value": 0.5, "chroma": 0.5, "contrast": 0.5}
        result = classify_sub_season("spring", dims, config_section("subSeasons"))
        assert result.sub_season == "warm-spring"

    def test_deep_autumn(self) -> None:
        dims = {"temperature": 0.75, "value": 0.2, "chroma": 0.45, "contrast": 0.6}
        result = classify_sub_season("autumn", dims, config_section("subSeasons"))
        assert result.sub_season == "deep-autumn"

    def test_soft_summer(self) -> None:
        dims = {"temperature": 0.3, "value": 0.5, "chroma": 0.2, "contrast": 0.35}
        result = classify_sub_season("summer", dims, config_section("subSeasons"))
        assert result.sub_season == "soft-summer"

    def test_every_season_resolves_some_sub_season(self) -> None:
        dims = {"temperature": 0.5, "value": 0.5, "chroma": 0.5, "contrast": 0.5}
        for season in ("spring", "summer", "autumn", "winter"):
            result = classify_sub_season(season, dims, config_section("subSeasons"))
            assert result.sub_season is not None
            assert result.sub_season.endswith(season)


class TestConfidence:
    def regions(self, delta_b: float = 0.0) -> dict[str, RegionColourSample]:
        base = (62.0, 12.0, 24.0)
        shifted = (base[0], base[1], base[2] + delta_b)
        return {
            "forehead": sample("forehead", lab=base, hue=62.0, chroma=27.0),
            "left_cheek": sample("left_cheek", lab=base, hue=62.0, chroma=27.0),
            "right_cheek": sample("right_cheek", lab=shifted, hue=62.0, chroma=27.0),
        }

    def compute(self, **overrides: Any) -> Any:
        arguments: dict[str, Any] = {
            "quality_score": 85.0,
            "regions": self.regions(),
            "usable_skin_ratio": 0.6,
            "classification_margin": 0.2,
            "cast_magnitude": 2.0,
            "cast_max": 22.0,
            "undertone_score": 0.6,
            "questionnaire": None,
            "config": config_section("confidence"),
            "skin_area_good": 0.6,
        }
        arguments.update(overrides)
        return compute_confidence(**arguments)

    def test_good_conditions_high_confidence(self) -> None:
        result = self.compute()
        assert result.label == "high"
        assert result.confidence >= 0.8

    def test_region_disagreement_lowers_confidence(self) -> None:
        good = self.compute()
        bad = self.compute(regions=self.regions(delta_b=18.0))
        assert bad.confidence < good.confidence
        assert bad.factors["roiConsistency"] < good.factors["roiConsistency"]

    def test_low_quality_lowers_confidence(self) -> None:
        assert self.compute(quality_score=45.0).confidence < self.compute().confidence

    def test_narrow_margin_lowers_confidence(self) -> None:
        assert self.compute(classification_margin=0.01).confidence < self.compute().confidence

    def test_strong_cast_lowers_confidence(self) -> None:
        assert self.compute(cast_magnitude=20.0).confidence < self.compute().confidence

    def test_contradicting_questionnaire_lowers_confidence(self) -> None:
        agreeing = self.compute(questionnaire={"jewelleryPreference": "gold"})
        contradicting = self.compute(questionnaire={"jewelleryPreference": "silver"})
        assert contradicting.confidence < agreeing.confidence

    def test_confidence_bounded(self) -> None:
        worst = self.compute(
            quality_score=0.0,
            usable_skin_ratio=0.0,
            classification_margin=0.0,
            cast_magnitude=30.0,
            regions={},
        )
        assert 0.0 <= worst.confidence <= 1.0
        assert worst.label == "low"
