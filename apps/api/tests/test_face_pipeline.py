"""Face detection + quality-stage tests using the vendored MediaPipe model
and public-domain fixtures. Marked `landmarker`; they run by default since
the model is committed to the repository."""

from __future__ import annotations

import pytest
from app.analysis.face_detection.detector import detect_faces
from app.analysis.landmarks.geometry import extract_pose
from app.analysis.pipeline import run_quality_stage
from app.analysis.preprocessing.validation import UploadLimits, validate_and_decode
from app.core.classifier import get_classifier_config
from app.core.errors import AnalysisRejectedError

from tests import fixtures

pytestmark = pytest.mark.landmarker

LIMITS = UploadLimits(
    max_bytes=10 * 1024 * 1024,
    max_decoded_pixels=50_000_000,
    min_edge_pixels=320,
    max_analysis_edge_pixels=1600,
    allowed_formats=("jpeg", "png", "webp"),
)


def decode(data: bytes):
    return validate_and_decode(data, declared_mime=None, filename=None, limits=LIMITS)


def run(data: bytes):
    return run_quality_stage(
        data,
        declared_mime="image/jpeg",
        filename="test.jpg",
        config=get_classifier_config(),
        max_upload_bytes=10 * 1024 * 1024,
    )


class TestDetection:
    def test_detects_exactly_one_face_on_valid_fixture(self) -> None:
        faces = detect_faces(decode(fixtures.valid_face_bytes()).rgb)
        assert len(faces) == 1
        assert faces[0].landmarks_px.shape == (478, 2)
        assert faces[0].transform is not None

    def test_detects_no_face_on_gradient(self) -> None:
        faces = detect_faces(decode(fixtures.no_face_bytes()).rgb)
        assert len(faces) == 0

    def test_detects_two_faces_on_composite(self) -> None:
        faces = detect_faces(decode(fixtures.multiple_faces_bytes()).rgb)
        assert len(faces) == 2

    def test_frontal_face_has_small_pose_angles(self) -> None:
        faces = detect_faces(decode(fixtures.valid_face_bytes()).rgb)
        pose = extract_pose(faces[0])
        assert abs(pose.yaw_degrees) < 15
        assert abs(pose.pitch_degrees) < 15
        assert abs(pose.roll_degrees) < 12

    def test_rotated_image_shows_roll(self) -> None:
        faces = detect_faces(decode(fixtures.rotated_face_bytes(20.0)).rgb)
        assert len(faces) == 1
        pose = extract_pose(faces[0])
        # The image was rotated 20° in-plane; detected roll should reflect
        # that (sign depends on convention, magnitude matters).
        assert 10 < abs(pose.roll_degrees) < 32


class TestQualityStage:
    def test_valid_face_passes(self) -> None:
        result = run(fixtures.valid_face_bytes())
        assert result.report.acceptable is True
        assert result.report.overall_score >= 55
        assert result.report.components["faceDetection"] == 100.0
        assert result.report.exposure.status == "acceptable"
        assert result.report.cast.direction == "none"

    def test_no_face_rejected(self) -> None:
        with pytest.raises(AnalysisRejectedError) as excinfo:
            run(fixtures.no_face_bytes())
        assert excinfo.value.code == "NO_FACE_DETECTED"

    def test_multiple_faces_rejected(self) -> None:
        with pytest.raises(AnalysisRejectedError) as excinfo:
            run(fixtures.multiple_faces_bytes())
        assert excinfo.value.code == "MULTIPLE_FACES_DETECTED"
        assert excinfo.value.details == {"faceCount": 2}

    def test_dark_image_rejected_or_flagged(self) -> None:
        # Very dark: either the detector fails (no face) or quality flags it.
        try:
            result = run(fixtures.dark_face_bytes())
        except AnalysisRejectedError as error:
            assert error.code in ("NO_FACE_DETECTED", "IMAGE_TOO_DARK")
        else:
            assert result.report.acceptable is False
            assert any(i.code == "IMAGE_TOO_DARK" for i in result.report.issues)

    def test_blurred_image_flagged(self) -> None:
        result = run(fixtures.blurred_face_bytes())
        assert result.report.acceptable is False
        assert any(issue.code == "IMAGE_TOO_BLURRY" for issue in result.report.issues)
        assert result.report.components["sharpness"] < 40

    def test_bright_image_flagged(self) -> None:
        try:
            result = run(fixtures.bright_face_bytes())
        except AnalysisRejectedError as error:
            assert error.code == "NO_FACE_DETECTED"
        else:
            assert result.report.acceptable is False
            assert any(i.code == "IMAGE_TOO_BRIGHT" for i in result.report.issues)

    def test_yellow_cast_flagged(self) -> None:
        result = run(fixtures.colour_cast_bytes("yellow"))
        assert result.report.cast.direction == "yellow"
        cast_issues = [i for i in result.report.issues if "COLOUR_CAST" in i.code]
        assert cast_issues, "expected a colour-cast issue"

    def test_tiny_face_rejected(self) -> None:
        with pytest.raises(AnalysisRejectedError) as excinfo:
            run(fixtures.tiny_face_bytes())
        assert excinfo.value.code in ("FACE_TOO_SMALL", "NO_FACE_DETECTED")

    def test_pipeline_is_deterministic(self) -> None:
        first = run(fixtures.valid_face_bytes())
        second = run(fixtures.valid_face_bytes())
        assert first.report.overall_score == second.report.overall_score
        assert first.report.components == second.report.components
