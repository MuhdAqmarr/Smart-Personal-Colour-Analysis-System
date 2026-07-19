"""End-to-end colour analysis on the public-domain fixture + API tests."""

from __future__ import annotations

import httpx
import pytest
from app.analysis.pipeline import run_full_analysis
from app.core.classifier import get_classifier_config

from tests import fixtures

pytestmark = pytest.mark.landmarker


def run(data: bytes, **kwargs: object):
    return run_full_analysis(
        data,
        declared_mime="image/jpeg",
        filename="face.jpg",
        config=get_classifier_config(),
        max_upload_bytes=10 * 1024 * 1024,
        **kwargs,  # type: ignore[arg-type]
    )


class TestFullPipeline:
    def test_valid_face_produces_complete_result(self) -> None:
        result = run(fixtures.valid_face_bytes())

        # Regions: forehead + both cheeks + combined (order not significant).
        names = [s.region for s in result.samples]
        assert set(names) == {"forehead", "left_cheek", "right_cheek", "combined"}
        assert names[-1] == "combined"
        for regional in result.samples:
            assert regional.usable_pixels > 0

        # Colour values are plausible skin measurements.
        combined = result.combined
        assert 30.0 < combined.lab[0] < 90.0
        assert 0.0 < combined.chroma < 45.0
        assert combined.hex.startswith("#")

        # Classification outputs are present and bounded.
        assert result.undertone.undertone in ("warm", "cool")
        assert -1.0 <= result.undertone.score <= 1.0
        assert result.seasons.season in ("spring", "summer", "autumn", "winter")
        assert set(result.seasons.scores) == {"spring", "summer", "autumn", "winter"}
        assert 0.0 <= result.confidence.confidence <= 1.0
        assert result.confidence.label in ("high", "medium", "low")
        assert result.sub_season.sub_season is not None
        assert result.explanation.summary
        assert result.explanation.evidence
        assert result.classifier_version == "1.0.0"
        assert result.processing_ms >= 0

    def test_pipeline_is_fully_deterministic(self) -> None:
        first = run(fixtures.valid_face_bytes())
        second = run(fixtures.valid_face_bytes())
        assert first.combined.lab == second.combined.lab
        assert first.undertone.score == second.undertone.score
        assert first.seasons.scores == second.seasons.scores
        assert first.confidence.confidence == second.confidence.confidence

    def test_questionnaire_influences_result(self) -> None:
        base = run(fixtures.valid_face_bytes())
        gold = run(
            fixtures.valid_face_bytes(),
            questionnaire={"jewelleryPreference": "gold"},
        )
        silver = run(
            fixtures.valid_face_bytes(),
            questionnaire={"jewelleryPreference": "silver"},
        )
        assert gold.undertone.score >= base.undertone.score
        assert silver.undertone.score <= base.undertone.score

    def test_usable_skin_component_now_measured(self) -> None:
        result = run(fixtures.valid_face_bytes())
        # In the full pipeline the component reflects real filtering output.
        assert 0.0 <= result.quality.components["usableSkinArea"] <= 100.0


class TestAnalysisEndpoint:
    async def post(self, client: httpx.AsyncClient, data: bytes, **form: str) -> httpx.Response:
        return await client.post(
            "/api/v1/analyses",
            files={"image": ("face.jpg", data, "image/jpeg")},
            data=form,
        )

    async def test_guest_analysis_returns_full_result(self, client: httpx.AsyncClient) -> None:
        response = await self.post(client, fixtures.valid_face_bytes())
        assert response.status_code == 200
        body = response.json()

        assert body["analysisId"] is None
        assert body["persisted"] is False
        assert body["classifierVersion"] == "1.0.0"
        assert body["quality"]["acceptable"] is True
        assert len(body["samples"]) == 4
        assert body["undertone"]["undertone"] in ("warm", "cool")
        assert body["season"]["season"] in ("spring", "summer", "autumn", "winter")
        assert 0.0 <= body["confidence"] <= 1.0
        assert body["explanation"]["summary"]
        assert body["explanation"]["improvementTips"] is not None

    async def test_no_face_returns_structured_error(self, client: httpx.AsyncClient) -> None:
        response = await self.post(client, fixtures.no_face_bytes())
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "NO_FACE_DETECTED"

    async def test_blurred_image_rejected_with_quality_details(
        self, client: httpx.AsyncClient
    ) -> None:
        response = await self.post(client, fixtures.blurred_face_bytes())
        assert response.status_code == 422
        body = response.json()
        assert body["error"]["code"] == "QUALITY_TOO_LOW"
        details = body["error"]["details"]
        assert details["retakeTips"]
        assert any(issue["code"] == "IMAGE_TOO_BLURRY" for issue in details["issues"])

    async def test_invalid_questionnaire_rejected(self, client: httpx.AsyncClient) -> None:
        response = await self.post(client, fixtures.valid_face_bytes(), questionnaire="{not json")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"

    async def test_questionnaire_accepted(self, client: httpx.AsyncClient) -> None:
        response = await self.post(
            client,
            fixtures.valid_face_bytes(),
            questionnaire='{"jewelleryPreference": "gold", "ignored_key": "x"}',
        )
        assert response.status_code == 200
