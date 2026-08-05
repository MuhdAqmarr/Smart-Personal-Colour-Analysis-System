"""Crawl a Shopify store's public /products.json and emit a product-import CSV.

Shopify exposes a public, structured JSON endpoint (`/products.json`) — no HTML
scraping, no bot-circumvention. For each product we take the primary image,
extract a representative colour (dominant non-background cluster), convert it to
CIE Lab with the app's own converter, assign the nearest colour season from the
app palette, and write a row in the format expected by
`apps/api/app/services/csv_import.py`.

Import is additive: the importer upserts by product_url, so nothing is deleted.

Usage (from repo root):
  uv --project apps/api run python scripts/crawl_store_products.py \
      --store tudungpeople --limit 30 \
      --palette /path/to/palette.json --out /path/to/out.csv
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sys
import time

import cv2
import httpx
import numpy as np
from PIL import Image

# Reuse the app's exact sRGB->Lab conversion so season assignment matches the
# engine (the importer recomputes Lab from the hex we emit anyway).
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))
from app.analysis.colour_features.conversions import rgb_to_lab  # noqa: E402

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"

# A compact reference palette for naming the extracted colour (cosmetic only).
NAMED_COLOURS: list[tuple[str, tuple[int, int, int]]] = [
    ("Black", (20, 20, 22)),
    ("Charcoal", (54, 54, 58)),
    ("Grey", (128, 128, 130)),
    ("Silver", (192, 192, 194)),
    ("White", (245, 245, 244)),
    ("Cream", (240, 232, 214)),
    ("Beige", (222, 205, 175)),
    ("Camel", (193, 154, 107)),
    ("Brown", (120, 82, 55)),
    ("Tan", (210, 180, 140)),
    ("Rust", (170, 80, 45)),
    ("Terracotta", (200, 110, 80)),
    ("Coral", (240, 128, 110)),
    ("Red", (190, 45, 50)),
    ("Maroon", (110, 35, 45)),
    ("Pink", (232, 160, 180)),
    ("Rose", (200, 105, 120)),
    ("Fuchsia", (200, 60, 130)),
    ("Purple", (120, 70, 150)),
    ("Lilac", (190, 165, 210)),
    ("Navy", (35, 45, 85)),
    ("Blue", (55, 95, 175)),
    ("Sky Blue", (135, 180, 220)),
    ("Teal", (35, 130, 130)),
    ("Aqua", (120, 200, 195)),
    ("Green", (70, 130, 75)),
    ("Sage", (150, 165, 130)),
    ("Olive", (120, 120, 60)),
    ("Mustard", (200, 165, 60)),
    ("Yellow", (230, 205, 90)),
    ("Gold", (200, 160, 90)),
    ("Orange", (225, 140, 55)),
    ("Mint", (170, 215, 185)),
    ("Lavender", (200, 190, 225)),
    ("Nude", (225, 195, 170)),
]


def named_colour(rgb: tuple[int, int, int]) -> str:
    r, g, b = rgb
    return min(NAMED_COLOURS, key=lambda c: (c[1][0] - r) ** 2 + (c[1][1] - g) ** 2 + (c[1][2] - b) ** 2)[0]


# The colour usually trails the product title after "in" or a dash. Reject
# segments that read like a size/quantity rather than a colour.
_COLOUR_SEPS = (" in ", " - ", " – ", " — ")
_NON_COLOUR_RE = re.compile(r"\d|\bml\b|\bg\b|pack|pcs|\bcm\b|size|\bset\b", re.IGNORECASE)


def colour_name_from_title(title: str, rgb: tuple[int, int, int]) -> str:
    """Store's own colour label (segment after 'in'/dash); else nearest basic name."""
    for sep in _COLOUR_SEPS:
        if sep in title:
            candidate = title.rsplit(sep, 1)[-1].strip()
            if candidate and len(candidate) <= 30 and not _NON_COLOUR_RE.search(candidate):
                return candidate[:60]
    return named_colour(rgb)


def load_palette(path: str) -> list[dict]:
    with open(path) as fh:
        return json.load(fh)


def nearest_season(lab: np.ndarray, palette: list[dict]) -> tuple[str, str | None]:
    """Return (season, subseason|None) of the closest palette colour (Lab ΔE≈Euclidean)."""
    best = min(
        palette,
        key=lambda p: (p["l"] - lab[0]) ** 2 + (p["a"] - lab[1]) ** 2 + (p["b"] - lab[2]) ** 2,
    )
    return best["season"], best.get("sub")


def _kmeans_pick(pixels: np.ndarray, weight_saturation: bool) -> tuple[int, int, int]:
    """Cluster `pixels` and return the dominant centre. When weighting by
    saturation, favour the colourful garment cluster over residual neutral
    (background/skin) pixels that survived filtering."""
    k = min(5, max(2, pixels.shape[0] // 40))
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(
        pixels.astype(np.float32), k, None, criteria, 3, cv2.KMEANS_PP_CENTERS
    )
    labels = labels.flatten()
    counts = np.bincount(labels, minlength=k).astype(np.float64)
    if weight_saturation:
        hsv = cv2.cvtColor(centers.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2HSV)
        sat = hsv.reshape(-1, 3)[:, 1].astype(np.float64)
        score = counts * (sat + 10.0)  # population weighted toward colourfulness
    else:
        score = counts
    r, g, b = centers[int(np.argmax(score))]
    return int(round(r)), int(round(g)), int(round(b))


def dominant_rgb(image_bytes: bytes) -> tuple[int, int, int] | None:
    """Representative colour of a product image.

    Product shots sit on neutral (white/grey) backdrops, often with a model, so
    the background/skin dominates a naive count. We first isolate colourful
    pixels (HSV saturation) and take the dominant colourful cluster; only when a
    product is genuinely neutral (few saturated pixels) do we fall back to the
    dominant mid-luminance colour.
    """
    try:
        im = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        return None
    im.thumbnail((200, 200))
    arr = np.asarray(im).reshape(-1, 3).astype(np.float32)
    if arr.shape[0] < 40:
        return None

    hsv = cv2.cvtColor(arr.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2HSV).reshape(-1, 3)
    sat, val = hsv[:, 1], hsv[:, 2]
    colourful = arr[(sat > 45) & (val > 35) & (val < 245)]
    if colourful.shape[0] >= max(40, int(0.03 * arr.shape[0])):
        return _kmeans_pick(colourful, weight_saturation=True)

    # Neutral product (white/grey/beige): drop pure white/black backdrop.
    lum = arr.mean(axis=1)
    neutral = arr[(lum > 40) & (lum < 232)]
    if neutral.shape[0] < 40:
        neutral = arr
    return _kmeans_pick(neutral, weight_saturation=False)


def tudungpeople_category(product: dict) -> str:
    hay = " ".join(
        [product.get("title", ""), product.get("product_type", ""), " ".join(product.get("tags", []))]
    ).lower()
    if any(w in hay for w in ("dress", "jubah", "kaftan", "abaya", "kurung", "dress")):
        return "dresses"
    if any(w in hay for w in ("shawl", "khimar", "instant", "bawal", "hijab", "tudung")):
        return "hijabs"
    if any(w in hay for w in ("scarf", "scarves", "square", "bawal")):
        return "scarves"
    if any(w in hay for w in ("inner", "bonnet", "brooch", "pin", "magnet")):
        return "accessories"
    return "hijabs"


STORES: dict[str, dict] = {
    "tudungpeople": {
        "slug": "tudungpeople",
        "base": "https://tudungpeople.com",
        "gender": "women",
        "category_fn": tudungpeople_category,
    },
    "hermo": {
        "slug": "hermo",
        "base": "https://www.hermobeauty.com",
        "gender": "unisex",
        "category_fn": lambda p: "cosmetics",
    },
}


def crawl(store_key: str, limit: int, palette: list[dict], client: httpx.Client) -> list[dict]:
    cfg = STORES[store_key]
    base = cfg["base"]
    rows: list[dict] = []
    page = 1
    while len(rows) < limit and page <= 10:
        resp = client.get(f"{base}/products.json", params={"limit": 250, "page": page})
        resp.raise_for_status()
        products = resp.json().get("products", [])
        if not products:
            break
        for product in products:
            if len(rows) >= limit:
                break
            images = product.get("images") or []
            variants = product.get("variants") or []
            if not images or not variants:
                continue
            image_url = images[0].get("src")
            if not image_url:
                continue
            try:
                img_resp = client.get(image_url, timeout=20)
                img_resp.raise_for_status()
            except Exception:
                continue
            rgb = dominant_rgb(img_resp.content)
            if rgb is None:
                continue
            lab = rgb_to_lab(np.array(rgb, dtype=np.uint8))
            season, sub = nearest_season(lab, palette)
            title = (product.get("title") or "").strip()
            colour_label = colour_name_from_title(title, rgb)
            variant = variants[0]
            price = variant.get("price")
            compare = variant.get("compare_at_price")
            available = any(v.get("available") for v in variants)
            rows.append(
                {
                    "product_name": (product.get("title") or "").strip()[:200],
                    "brand": (product.get("vendor") or cfg["slug"]).strip()[:120],
                    "store_slug": cfg["slug"],
                    "category": cfg["category_fn"](product),
                    "gender": cfg["gender"],
                    "description": (product.get("product_type") or "").strip()[:300],
                    "image_url": image_url,
                    "product_url": f"{base}/products/{product.get('handle')}",
                    "price": price or "",
                    "original_price": compare or "",
                    "currency": "MYR",
                    "availability": "in_stock" if available else "unknown",
                    "colour_name": colour_label,
                    "colour_hex": "#%02x%02x%02x" % rgb,
                    "season_tags": season,
                    "subseason_tags": sub or "",
                    "active": "true",
                }
            )
            time.sleep(0.15)  # be polite
        page += 1
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--store", required=True, choices=list(STORES))
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--palette", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    palette = load_palette(args.palette)
    columns = [
        "product_name", "brand", "store_slug", "category", "gender", "description",
        "image_url", "product_url", "price", "original_price", "currency", "availability",
        "colour_name", "colour_hex", "season_tags", "subseason_tags", "active",
    ]
    with httpx.Client(headers={"User-Agent": UA}, timeout=30, follow_redirects=True) as client:
        rows = crawl(args.store, args.limit, palette, client)

    with open(args.out, "w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
    print(f"{args.store}: wrote {len(rows)} rows -> {args.out}")


if __name__ == "__main__":
    main()
