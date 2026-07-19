from __future__ import annotations

import pytest
from app.services.csv_import import EXPECTED_COLUMNS, parse_csv

HEADER = ",".join(EXPECTED_COLUMNS)


def row(**overrides: str) -> str:
    base = {
        "product_name": "Terracotta Blouse",
        "brand": "TestBrand",
        "store_slug": "coloursense-demo-boutique",
        "category": "tops",
        "gender": "women",
        "description": "desc",
        "image_url": "",
        "product_url": "https://example.com/p/1",
        "price": "79.00",
        "original_price": "",
        "currency": "MYR",
        "availability": "in_stock",
        "colour_name": "Terracotta",
        "colour_hex": "#c66b3d",
        "season_tags": "autumn",
        "subseason_tags": "",
        "active": "true",
    }
    base.update(overrides)
    return ",".join(base[column] for column in EXPECTED_COLUMNS)


def build_csv(*rows: str) -> bytes:
    return ("\n".join([HEADER, *rows])).encode("utf-8")


def test_valid_row_parses_with_lab_values() -> None:
    preview = parse_csv(build_csv(row()))
    assert preview.total_rows == 1
    assert len(preview.valid_rows) == 1
    assert not preview.errors
    data = preview.valid_rows[0].data
    assert data["colour_hex"] == "#c66b3d"
    # Lab computed from hex at parse time (terracotta ≈ L*55 warm).
    assert 50 < data["lab_l"] < 60
    assert data["lab_b"] > 25
    assert data["season_tags"] == ["autumn"]


def test_missing_columns_rejected() -> None:
    with pytest.raises(ValueError, match="Missing required columns"):
        parse_csv(b"product_name,brand\nA,B")


def test_invalid_hex_reported_per_row() -> None:
    preview = parse_csv(build_csv(row(colour_hex="notahex")))
    assert not preview.valid_rows
    assert any(e.column == "colour_hex" for e in preview.errors)
    assert preview.errors[0].row_number == 2  # header is row 1


def test_javascript_url_rejected() -> None:
    preview = parse_csv(build_csv(row(product_url="javascript:alert(1)")))
    assert not preview.valid_rows
    assert any(e.column == "product_url" for e in preview.errors)


def test_unknown_season_rejected() -> None:
    preview = parse_csv(build_csv(row(season_tags="monsoon")))
    assert any(e.column == "season_tags" for e in preview.errors)


def test_negative_price_rejected() -> None:
    preview = parse_csv(build_csv(row(price="-5")))
    assert any(e.column == "price" for e in preview.errors)


def test_duplicate_product_urls_detected() -> None:
    preview = parse_csv(build_csv(row(), row(product_name="Second Copy")))
    assert len(preview.valid_rows) == 1
    assert preview.duplicate_urls == ["https://example.com/p/1"]
    assert any("Duplicate" in e.message for e in preview.errors)


def test_multiple_season_tags_split_on_pipe() -> None:
    preview = parse_csv(
        build_csv(row(season_tags="summer|spring", product_url="https://example.com/p/2"))
    )
    assert preview.valid_rows[0].data["season_tags"] == ["summer", "spring"]


def test_mixed_valid_and_invalid_rows() -> None:
    preview = parse_csv(
        build_csv(
            row(),
            row(product_url="https://example.com/p/2", category="spaceships"),
            row(product_url="https://example.com/p/3"),
        )
    )
    assert preview.total_rows == 3
    assert len(preview.valid_rows) == 2
    assert len(preview.errors) == 1
    assert preview.errors[0].column == "category"


def test_sample_csv_file_is_valid() -> None:
    from pathlib import Path

    sample = Path(__file__).resolve().parents[3] / "scripts" / "sample-products.csv"
    preview = parse_csv(sample.read_bytes())
    assert preview.total_rows == 3
    assert len(preview.valid_rows) == 3
    assert not preview.errors
