from __future__ import annotations

import json
from pathlib import Path

import pytest
from app.core.classifier import (
    ClassifierConfigError,
    get_classifier_config,
    load_classifier_config,
)


def test_bundled_config_loads_and_validates() -> None:
    config = get_classifier_config()
    assert config.version == "1.0.0"
    assert config.name == "coloursense-rule-based-classifier"
    assert set(config.seasons.prototypes) == {"spring", "summer", "autumn", "winter"}
    assert config.image.allowedFormats == ("jpeg", "png", "webp")


def test_missing_config_raises_clear_error(tmp_path: Path) -> None:
    with pytest.raises(ClassifierConfigError, match="not found"):
        load_classifier_config(tmp_path / "missing.json")


def test_invalid_json_raises_clear_error(tmp_path: Path) -> None:
    path = tmp_path / "broken.json"
    path.write_text("{not json", encoding="utf-8")
    with pytest.raises(ClassifierConfigError, match="not valid JSON"):
        load_classifier_config(path)


def test_unbalanced_weights_rejected(tmp_path: Path) -> None:
    from app.core.config import get_settings

    bundled_path = get_settings().classifier_config_path
    config = json.loads(bundled_path.read_text(encoding="utf-8"))
    config["quality"]["componentWeights"]["exposure"] = 0.9
    path = tmp_path / "bad-weights.json"
    path.write_text(json.dumps(config), encoding="utf-8")
    with pytest.raises(ClassifierConfigError, match="sum to 1.0"):
        load_classifier_config(path)
