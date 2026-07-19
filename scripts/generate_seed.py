#!/usr/bin/env python3
"""Generate supabase/seed.sql from curated palette/cosmetic/product data.

Why a generator: palette and product colours must carry CIE Lab (D65) values
for CIEDE2000 matching. Hand-writing Lab numbers invites errors, so this
script converts each curated hex exactly (sRGB -> linear -> XYZ -> Lab) and
emits deterministic SQL. Re-running produces an identical file.

Usage:
    python3 scripts/generate_seed.py          # writes supabase/seed.sql
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "supabase" / "seed.sql"
CLASSIFIER = ROOT / "packages" / "colour-engine" / "config" / "classifier-v1.json"

# --------------------------------------------------------------------------
# Colour conversion (sRGB D65 -> CIE Lab). Mirrors the tested implementation
# in apps/api/app/analysis/colour_features (Phase 6); kept dependency-free.
# --------------------------------------------------------------------------


def _srgb_to_linear(channel: float) -> float:
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4


def hex_to_lab(hex_code: str) -> tuple[float, float, float]:
    hex_code = hex_code.lstrip("#")
    r = int(hex_code[0:2], 16) / 255.0
    g = int(hex_code[2:4], 16) / 255.0
    b = int(hex_code[4:6], 16) / 255.0
    rl, gl, bl = _srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b)
    # sRGB D65 matrix (IEC 61966-2-1)
    x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl
    y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl
    z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl
    # D65 reference white
    xn, yn, zn = 0.95047, 1.0, 1.08883

    def f(t: float) -> float:
        eps = 216 / 24389
        kappa = 24389 / 27
        if t > eps:
            return t ** (1 / 3)
        return (kappa * t + 16) / 116

    fx, fy, fz = f(x / xn), f(y / yn), f(z / zn)
    lab_l = 116 * fy - 16
    lab_a = 500 * (fx - fy)
    lab_b = 200 * (fy - fz)
    return (round(lab_l, 2), round(lab_a, 2), round(lab_b, 2))


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


# --------------------------------------------------------------------------
# Seasons and sub-seasons
# --------------------------------------------------------------------------

SEASONS = [
    {
        "slug": "spring",
        "name": "Spring",
        "tagline": "Warm, light and fresh",
        "description": (
            "Spring colouring pairs a warm undertone with light-to-medium depth and a clear, "
            "fresh brightness. Warm corals, peaches, golden yellows and lively aqua tones "
            "tend to harmonise well, while very dark or dusty colours can feel heavy."
        ),
        "characteristics": {
            "temperature": "warm",
            "value": "light to medium",
            "chroma": "clear and bright",
            "contrast": "low to medium",
        },
        "display_order": 1,
    },
    {
        "slug": "summer",
        "name": "Summer",
        "tagline": "Cool, soft and gentle",
        "description": (
            "Summer colouring pairs a cool undertone with light-to-medium depth and softly "
            "muted colours. Powder blues, dusty roses, lavenders and gentle grey-greens tend "
            "to harmonise well, while very warm or high-voltage colours can overpower."
        ),
        "characteristics": {
            "temperature": "cool",
            "value": "light to medium",
            "chroma": "soft and muted",
            "contrast": "low to medium",
        },
        "display_order": 2,
    },
    {
        "slug": "autumn",
        "name": "Autumn",
        "tagline": "Warm, rich and earthy",
        "description": (
            "Autumn colouring pairs a warm undertone with medium-to-deep depth and muted, "
            "earthy richness. Terracotta, rust, olive, mustard and warm teal tend to "
            "harmonise well, while icy pastels and stark white can clash with its warmth."
        ),
        "characteristics": {
            "temperature": "warm",
            "value": "medium to deep",
            "chroma": "muted and earthy",
            "contrast": "medium",
        },
        "display_order": 3,
    },
    {
        "slug": "winter",
        "name": "Winter",
        "tagline": "Cool, clear and striking",
        "description": (
            "Winter colouring pairs a cool undertone with medium-to-deep depth and clear, "
            "high-contrast colour. True red, royal blue, emerald and icy brights tend to "
            "harmonise well, while dusty earth tones can dull its natural contrast."
        ),
        "characteristics": {
            "temperature": "cool",
            "value": "medium to deep",
            "chroma": "clear and vivid",
            "contrast": "high",
        },
        "display_order": 4,
    },
]

SUBSEASONS = [
    ("spring", "light-spring", "Light Spring", "Lightest and most delicate Spring: warm and luminous with gentle contrast.", 1),
    ("spring", "warm-spring", "Warm Spring", "The most golden Spring: warmth is the dominant quality.", 2),
    ("spring", "bright-spring", "Bright Spring", "The clearest Spring: fresh warmth with vivid, sparkling colour.", 3),
    ("summer", "light-summer", "Light Summer", "Lightest Summer: cool, airy and delicate.", 1),
    ("summer", "cool-summer", "Cool Summer", "The coolest Summer: rose and blue undertones lead.", 2),
    ("summer", "soft-summer", "Soft Summer", "The most muted Summer: gentle, misty blends.", 3),
    ("autumn", "soft-autumn", "Soft Autumn", "The gentlest Autumn: warmth softened with haze.", 1),
    ("autumn", "warm-autumn", "Warm Autumn", "The most golden Autumn: fire-lit warmth throughout.", 2),
    ("autumn", "deep-autumn", "Deep Autumn", "The darkest Autumn: rich, smouldering depth.", 3),
    ("winter", "deep-winter", "Deep Winter", "The darkest Winter: dramatic depth with cool clarity.", 1),
    ("winter", "cool-winter", "Cool Winter", "The coolest Winter: icy blue and crimson clarity.", 2),
    ("winter", "bright-winter", "Bright Winter", "The most vivid Winter: electric, high-contrast brilliance.", 3),
]

# --------------------------------------------------------------------------
# Palette colours: (name, hex, group, family, recommended_use, priority)
# Groups: neutrals, core, accents, formal, casual, accessories, headwear, cautious
# "Cautious" wording is deliberately gentle — never "forbidden".
# --------------------------------------------------------------------------

PALETTES: dict[str, list[tuple[str, str, str, str, str, int]]] = {
    "spring": [
        ("Warm Ivory", "#f7f1e1", "neutrals", "white", "Bases, shirts and layering pieces.", 10),
        ("Soft Cream", "#f9e9c8", "neutrals", "cream", "Softer alternative to white near the face.", 20),
        ("Camel", "#c19a6b", "neutrals", "brown", "Coats, trousers and structured pieces.", 30),
        ("Light Warm Beige", "#e3cdaa", "neutrals", "beige", "Everyday neutral for tops and knits.", 40),
        ("Golden Tan", "#d2a56d", "neutrals", "brown", "Warm neutral for skirts and bags.", 50),
        ("Coral", "#ff6f61", "core", "coral", "Statement tops and dresses near the face.", 10),
        ("Peach", "#ffbe98", "core", "orange", "Soft feature colour for blouses and knits.", 20),
        ("Warm Yellow", "#f7c948", "core", "yellow", "Cheerful accent for tops and accessories.", 30),
        ("Leaf Green", "#7bb661", "core", "green", "Fresh green for casual and smart pieces.", 40),
        ("Turquoise", "#45d1c5", "core", "blue-green", "Lively colour for tops and scarves.", 50),
        ("Salmon Pink", "#ff8e7f", "core", "pink", "Warm pink for dresses and knitwear.", 60),
        ("Poppy Red", "#ee4035", "accents", "red", "High-energy accent in small or large doses.", 10),
        ("Bright Aqua", "#17c3b2", "accents", "blue-green", "Vivid accent for accessories and prints.", 20),
        ("Periwinkle Blue", "#7c9ed9", "accents", "blue", "Cooler accent that stays soft and warm-friendly.", 30),
        ("Golden Orange", "#f8a13f", "accents", "orange", "Sunny accent for scarves and jewellery.", 40),
        ("Warm Navy", "#34426b", "formal", "blue", "Suits and formal dresses instead of black.", 10),
        ("Honey Camel", "#b98b52", "formal", "brown", "Blazers and tailored trousers.", 20),
        ("Cream White", "#f5ecd7", "formal", "white", "Formal shirts and occasion wear.", 30),
        ("Denim Wash Blue", "#6f8fbf", "casual", "blue", "Jeans and relaxed shirting.", 10),
        ("Apricot", "#f8b878", "casual", "orange", "Weekend tops and casual layers.", 20),
        ("Fresh Mint", "#98d7c2", "casual", "green", "Light casual knits and tees.", 30),
        ("Warm Gold", "#d4af37", "accessories", "metallic", "Jewellery and hardware finishes.", 10),
        ("Tan Leather", "#a97142", "accessories", "brown", "Shoes, belts and bags.", 20),
        ("Peach Blossom", "#f9b7a6", "headwear", "pink", "Hijabs and scarves framing the face.", 10),
        ("Soft Aqua", "#a5dcd3", "headwear", "blue-green", "Light headwear colour for daywear.", 20),
        ("Buttercream", "#f6dfa4", "headwear", "yellow", "Gentle warm tone for headwear.", 30),
        ("Jet Black", "#1a1a1a", "cautious", "black", "Can look heavy against Spring freshness — consider warm navy or chocolate, or keep black away from the face.", 10),
        ("Cool Charcoal", "#4a4e57", "cautious", "grey", "May dull Spring warmth — camel or warm navy usually flatters more.", 20),
        ("Burgundy", "#722f37", "cautious", "red", "Deep and muted for Spring — a clear poppy red is usually more harmonious.", 30),
        ("Icy Blue", "#c8dcec", "cautious", "blue", "Cool pastel that can wash out warm colouring — try aqua or turquoise instead.", 40),
    ],
    "summer": [
        ("Soft White", "#f4f4f2", "neutrals", "white", "Gentler than stark white for shirts and layers.", 10),
        ("Dove Grey", "#c9ced4", "neutrals", "grey", "Light neutral for tops and knits.", 20),
        ("Cool Greige", "#c5beb4", "neutrals", "beige", "Soft beige-grey for trousers and coats.", 30),
        ("Slate Grey", "#8d99a5", "neutrals", "grey", "Mid neutral for tailoring.", 40),
        ("Rose Beige", "#d9c2bd", "neutrals", "pink", "Warm-ish neutral that stays soft and rosy.", 50),
        ("Powder Blue", "#a3c1d9", "core", "blue", "Signature Summer blue for shirts and dresses.", 10),
        ("Rose Pink", "#dfa0af", "core", "pink", "Soft pink for tops near the face.", 20),
        ("Lavender", "#b3a5d3", "core", "purple", "Gentle purple for blouses and knits.", 30),
        ("Sage Green", "#a8b8a0", "core", "green", "Muted green for versatile pieces.", 40),
        ("Dusty Blue", "#7e9cb9", "core", "blue", "Deeper blue that stays soft.", 50),
        ("Muted Raspberry", "#a35d75", "core", "pink", "Berry tone for depth without harshness.", 60),
        ("Periwinkle", "#92a8d1", "accents", "blue", "Softly vivid accent for scarves and prints.", 10),
        ("Orchid", "#b48ab6", "accents", "purple", "Cool floral accent colour.", 20),
        ("Sea Glass", "#9dc3bc", "accents", "blue-green", "Misty green-blue for accessories.", 30),
        ("Watermelon Pink", "#dd7596", "accents", "pink", "Brightest Summer pink — great in small doses.", 40),
        ("Soft Navy", "#46586f", "formal", "blue", "Formal alternative to black.", 10),
        ("French Grey", "#7f8a99", "formal", "grey", "Suits and tailored dresses.", 20),
        ("Rose Taupe", "#8d6b6e", "formal", "brown", "Soft formal brown with a rosy cast.", 30),
        ("Chambray", "#91a8c0", "casual", "blue", "Casual shirts and light denim.", 10),
        ("Dusty Pink", "#d8a7b1", "casual", "pink", "Relaxed knits and tees.", 20),
        ("Cool Mint", "#aecfc2", "casual", "green", "Fresh casual layer colour.", 30),
        ("Polished Silver", "#c0c0c0", "accessories", "metallic", "Jewellery and hardware finishes.", 10),
        ("Cool Pewter", "#8e939b", "accessories", "grey", "Bags, shoes and belts.", 20),
        ("Misty Lilac", "#c9b6d4", "headwear", "purple", "Hijabs and scarves framing the face.", 10),
        ("Powder Pink", "#e8c4cc", "headwear", "pink", "Soft pink headwear tone.", 20),
        ("Cloud Blue", "#bcd2e8", "headwear", "blue", "Airy blue for headwear.", 30),
        ("Bright Orange", "#f26f22", "cautious", "orange", "Strong warmth can overwhelm Summer softness — watermelon pink gives similar energy more gently.", 10),
        ("Mustard", "#c9962a", "cautious", "yellow", "Warm and earthy for Summer — soft lavender or powder blue usually flatters more.", 20),
        ("Jet Black", "#1a1a1a", "cautious", "black", "Harsh against soft colouring — soft navy or French grey are kinder near the face.", 30),
        ("Vivid Lime", "#a4d425", "cautious", "green", "High-voltage brightness may clash — sage or sea glass keep the palette calm.", 40),
    ],
    "autumn": [
        ("Warm Cream", "#f1e3c3", "neutrals", "cream", "Softest Autumn base colour.", 10),
        ("Warm Beige", "#d7b98e", "neutrals", "beige", "Everyday neutral for layers.", 20),
        ("Toffee", "#a87b51", "neutrals", "brown", "Mid brown for trousers and knits.", 30),
        ("Chocolate Brown", "#5e4630", "neutrals", "brown", "Deep neutral instead of black.", 40),
        ("Warm Taupe", "#8a7a5e", "neutrals", "brown", "Muted neutral for tailoring.", 50),
        ("Terracotta", "#c66b3d", "core", "orange", "Signature Autumn colour for tops and dresses.", 10),
        ("Rust", "#b7410e", "core", "orange", "Rich statement colour near the face.", 20),
        ("Mustard", "#cc9c33", "core", "yellow", "Golden feature colour for knits.", 30),
        ("Olive Green", "#737c3f", "core", "green", "Core green for jackets and trousers.", 40),
        ("Warm Teal", "#2f6f7e", "core", "blue-green", "Autumn's best blue-green.", 50),
        ("Burnt Orange", "#cc5500", "core", "orange", "Bold warm orange for statement pieces.", 60),
        ("Golden Amber", "#e0a526", "accents", "yellow", "Glowing accent for scarves and jewellery.", 10),
        ("Forest Green", "#40603f", "accents", "green", "Deep green accent for outerwear.", 20),
        ("Warm Burgundy", "#7c3030", "accents", "red", "Autumn-friendly deep red.", 30),
        ("Copper", "#b66a41", "accents", "metallic", "Metallic-leaning accent tone.", 40),
        ("Espresso", "#4e342e", "formal", "brown", "Formal depth instead of black.", 10),
        ("Deep Olive", "#556036", "formal", "green", "Suits and structured dresses.", 20),
        ("Camel Coat", "#b08d57", "formal", "brown", "Classic formal outer layer.", 30),
        ("Khaki", "#9a8a5c", "casual", "green", "Relaxed trousers and utility pieces.", 10),
        ("Moss", "#8a9a5b", "casual", "green", "Casual knits and tees.", 20),
        ("Pumpkin Spice", "#d0793a", "casual", "orange", "Weekend warmth for layers.", 30),
        ("Antique Gold", "#bd9a45", "accessories", "metallic", "Jewellery and hardware finishes.", 10),
        ("Cognac Leather", "#9a5b33", "accessories", "brown", "Shoes, belts and bags.", 20),
        ("Warm Olive", "#7f7b4d", "headwear", "green", "Hijabs and scarves framing the face.", 10),
        ("Cinnamon Rose", "#b3684f", "headwear", "pink", "Soft warm rose for headwear.", 20),
        ("Golden Cream", "#ead9ac", "headwear", "cream", "Light headwear tone.", 30),
        ("Icy Pink", "#f3d6e4", "cautious", "pink", "Cool pastel that can clash with Autumn warmth — cinnamon rose is a warmer swap.", 10),
        ("Pure White", "#ffffff", "cautious", "white", "Stark against earthy richness — warm cream usually sits more naturally.", 20),
        ("Vivid Fuchsia", "#d1358f", "cautious", "pink", "Cool brightness may fight the palette — warm burgundy carries similar drama.", 30),
        ("Icy Blue-Grey", "#9db2c9", "cautious", "blue", "Cool haze can dull warmth — try warm teal instead.", 40),
    ],
    "winter": [
        ("Pure White", "#ffffff", "neutrals", "white", "Crisp base that suits Winter contrast.", 10),
        ("True Black", "#111111", "neutrals", "black", "Core neutral for tailoring and layers.", 20),
        ("Charcoal", "#3b3f46", "neutrals", "grey", "Deep neutral for suits and coats.", 30),
        ("Cool Navy", "#22304f", "neutrals", "blue", "Alternative deep neutral.", 40),
        ("Silver Grey", "#b9c0c9", "neutrals", "grey", "Light neutral for shirts and knits.", 50),
        ("True Red", "#c8102e", "core", "red", "Signature clear red for statement pieces.", 10),
        ("Royal Blue", "#4169e1", "core", "blue", "Vivid blue for dresses and tops.", 20),
        ("Emerald Green", "#009b77", "core", "green", "Jewel green near the face.", 30),
        ("Fuchsia", "#ca2c92", "core", "pink", "Cool vivid pink for impact.", 40),
        ("Regal Purple", "#612e9e", "core", "purple", "Deep jewel purple.", 50),
        ("Peacock Teal", "#00707d", "core", "blue-green", "Clear deep teal.", 60),
        ("Icy Blue", "#cfe8f5", "accents", "blue", "Frosted accent for shirts and scarves.", 10),
        ("Icy Pink", "#f3d9e5", "accents", "pink", "Cool pastel accent.", 20),
        ("Icy Lilac", "#ddd4ef", "accents", "purple", "Frosted lilac accent.", 30),
        ("Lemon Ice", "#f6f2c5", "accents", "yellow", "Winter's icy yellow accent.", 40),
        ("Midnight Navy", "#16213e", "formal", "blue", "Eveningwear and suits.", 10),
        ("Graphite", "#34373c", "formal", "grey", "Sharp formal grey.", 20),
        ("Ruby Red", "#9e1030", "formal", "red", "Occasion red with cool depth.", 30),
        ("Cool Denim", "#48679f", "casual", "blue", "Jeans and casual shirting.", 10),
        ("Bright White", "#f8f9fb", "casual", "white", "Crisp tees and casual shirts.", 20),
        ("Dark Berry", "#802a5b", "casual", "purple", "Weekend depth with Winter clarity.", 30),
        ("Polished Silver", "#c7ccd4", "accessories", "metallic", "Jewellery and hardware finishes.", 10),
        ("Gunmetal", "#52565e", "accessories", "grey", "Bags, shoes and belts.", 20),
        ("Ice Grey", "#dee4ea", "headwear", "grey", "Hijabs and scarves framing the face.", 10),
        ("Deep Plum", "#4e2a5a", "headwear", "purple", "Rich headwear tone.", 20),
        ("Sapphire", "#24549e", "headwear", "blue", "Clear blue for headwear.", 30),
        ("Warm Beige", "#d9b98c", "cautious", "beige", "Earthy warmth can dull Winter contrast — silver grey or icy blue stay crisper.", 10),
        ("Mustard", "#cc9c33", "cautious", "yellow", "Golden and muted for Winter — lemon ice keeps yellow icy instead.", 20),
        ("Rust Orange", "#b7410e", "cautious", "orange", "Warm earth tone that fights cool clarity — true red carries the energy better.", 30),
        ("Muted Salmon", "#d3826b", "cautious", "pink", "Soft warm pink may look faded — fuchsia or icy pink suit the palette more.", 40),
    ],
}

# Sub-season signature colours: (subseason_slug, name, hex, group, family, use)
SUBSEASON_COLOURS = [
    ("light-spring", "Light Peach", "#ffd3b6", "core", "orange", "Delicate feature colour for Light Spring."),
    ("light-spring", "Aqua Whisper", "#bfe8e0", "core", "blue-green", "Airy aqua for Light Spring."),
    ("light-spring", "Sunlight Yellow", "#ffe08a", "core", "yellow", "Soft luminous yellow for Light Spring."),
    ("warm-spring", "Marigold", "#f0a53c", "core", "yellow", "Golden signature for Warm Spring."),
    ("warm-spring", "Warm Coral", "#ff7a5c", "core", "coral", "Sun-warmed coral for Warm Spring."),
    ("warm-spring", "Grass Green", "#6fae4e", "core", "green", "Living green for Warm Spring."),
    ("bright-spring", "Bright Coral", "#ff5349", "accents", "coral", "Vivid coral for Bright Spring."),
    ("bright-spring", "Vivid Turquoise", "#10c0b5", "accents", "blue-green", "Electric turquoise for Bright Spring."),
    ("bright-spring", "Clear Yellow", "#ffcf26", "accents", "yellow", "High-clarity yellow for Bright Spring."),
    ("light-summer", "Baby Blue", "#b7d3ea", "core", "blue", "Feather-light blue for Light Summer."),
    ("light-summer", "Ballet Pink", "#eac6d3", "core", "pink", "Delicate pink for Light Summer."),
    ("light-summer", "Pale Lavender", "#d3c6e8", "core", "purple", "Misty lavender for Light Summer."),
    ("cool-summer", "Cool Rose", "#c97d97", "core", "pink", "Rose signature for Cool Summer."),
    ("cool-summer", "Slate Blue", "#6f83a8", "core", "blue", "Blue-grey depth for Cool Summer."),
    ("cool-summer", "Blue Spruce", "#5e7d7e", "core", "blue-green", "Cool conifer tone for Cool Summer."),
    ("soft-summer", "Dusty Mauve", "#a58a94", "core", "purple", "Hazy mauve for Soft Summer."),
    ("soft-summer", "Grey Sage", "#99a396", "core", "green", "Smoked sage for Soft Summer."),
    ("soft-summer", "Soft Denim", "#7d92ab", "core", "blue", "Washed denim blue for Soft Summer."),
    ("soft-autumn", "Soft Camel", "#c0a67b", "core", "brown", "Gentle camel for Soft Autumn."),
    ("soft-autumn", "Sage Olive", "#8f9779", "core", "green", "Softened olive for Soft Autumn."),
    ("soft-autumn", "Dusty Coral", "#cb8e7c", "core", "coral", "Muted coral for Soft Autumn."),
    ("warm-autumn", "Pumpkin", "#c9711f", "core", "orange", "Glowing pumpkin for Warm Autumn."),
    ("warm-autumn", "Golden Olive", "#90802e", "core", "green", "Sun-baked olive for Warm Autumn."),
    ("warm-autumn", "Brick Red", "#9e3b32", "core", "red", "Fired brick for Warm Autumn."),
    ("deep-autumn", "Mahogany", "#6c2f22", "core", "brown", "Polished depth for Deep Autumn."),
    ("deep-autumn", "Deep Teal", "#175f5e", "core", "blue-green", "Dark teal for Deep Autumn."),
    ("deep-autumn", "Dark Chocolate", "#3f2a20", "core", "brown", "Near-black brown for Deep Autumn."),
    ("deep-winter", "Black Cherry", "#521831", "core", "red", "Blackened cherry for Deep Winter."),
    ("deep-winter", "Ink Navy", "#131f40", "core", "blue", "Ink depth for Deep Winter."),
    ("deep-winter", "Deep Pine", "#0a463d", "core", "green", "Darkest pine for Deep Winter."),
    ("cool-winter", "Ice White", "#f4f8fb", "core", "white", "Glacial white for Cool Winter."),
    ("cool-winter", "Cool Crimson", "#af1a3f", "core", "red", "Blue-based crimson for Cool Winter."),
    ("cool-winter", "Cobalt Blue", "#0047ab", "core", "blue", "Pure cobalt for Cool Winter."),
    ("bright-winter", "Electric Blue", "#0892d0", "accents", "blue", "Charged blue for Bright Winter."),
    ("bright-winter", "Shocking Pink", "#e5399e", "accents", "pink", "High-voltage pink for Bright Winter."),
    ("bright-winter", "Vivid Emerald", "#00a878", "accents", "green", "Luminous emerald for Bright Winter."),
]

# --------------------------------------------------------------------------
# Cosmetics: (season, type, name, hex, intensity, occasion, note, priority)
# --------------------------------------------------------------------------

COSMETICS = [
    ("spring", "lipstick", "Warm Coral", "#e96a53", "medium", "day", "Fresh coral that lifts warm, clear colouring.", 10),
    ("spring", "lipstick", "Peachy Nude", "#d98a6f", "soft", "any", "Everyday nude with a warm peach base.", 20),
    ("spring", "blusher", "Peach Glow", "#f0a37e", "soft", "day", "Soft peach flush for daytime.", 10),
    ("spring", "blusher", "Coral Flush", "#ef7e6a", "medium", "any", "Livelier coral cheek colour.", 20),
    ("spring", "eyeshadow", "Champagne Shimmer", "#e8cfae", "soft", "day", "Luminous wash for the lid.", 10),
    ("spring", "eyeshadow", "Warm Bronze", "#b07b4f", "medium", "any", "Golden-bronze definition shade.", 20),
    ("spring", "eyeshadow", "Aqua Pop", "#58c2b8", "bold", "evening", "Playful aqua liner-or-lid accent.", 30),
    ("spring", "eyeliner", "Warm Brown", "#5f4630", "medium", "any", "Softer than black for warm colouring.", 10),
    ("spring", "eyeliner", "Teal Accent", "#226f6a", "bold", "evening", "Evening alternative to dark liner.", 20),
    ("spring", "highlighter", "Golden Glow", "#f2d59a", "medium", "any", "Warm gold sheen on high points.", 10),
    ("spring", "highlighter", "Pearl Cream", "#f6e7cd", "soft", "day", "Subtle warm pearl finish.", 20),
    ("spring", "foundation", "Warm / Golden Direction", "#e9b98b", "soft", "any", "Look for bases labelled warm or golden; yellow-leaning rather than pink. Always test on the jawline in daylight.", 10),
    ("summer", "lipstick", "Rose Pink", "#c76e84", "soft", "day", "Cool rose that stays gentle.", 10),
    ("summer", "lipstick", "Berry Tint", "#a35d75", "medium", "any", "Muted berry for extra depth.", 20),
    ("summer", "blusher", "Soft Rose", "#dba4ad", "soft", "day", "Misty rose flush.", 10),
    ("summer", "blusher", "Cool Pink", "#d590a4", "medium", "any", "Cooler pink cheek colour.", 20),
    ("summer", "eyeshadow", "Dove Grey", "#aab0b7", "soft", "day", "Soft grey wash for the lid.", 10),
    ("summer", "eyeshadow", "Mauve Mist", "#b195a2", "medium", "any", "Rosy mauve crease shade.", 20),
    ("summer", "eyeshadow", "Slate Smoke", "#6e7686", "bold", "evening", "Smoky slate for evening definition.", 30),
    ("summer", "eyeliner", "Taupe Liner", "#6b5f5c", "soft", "day", "Gentler than black for soft colouring.", 10),
    ("summer", "eyeliner", "Navy Smoke", "#3c4a63", "medium", "evening", "Cool navy definition.", 20),
    ("summer", "highlighter", "Icy Pearl", "#e9edf2", "soft", "any", "Cool pearl sheen.", 10),
    ("summer", "highlighter", "Rose Pearl", "#eccfd4", "soft", "day", "Rose-tinted glow.", 20),
    ("summer", "foundation", "Cool / Rosy Direction", "#ddb19f", "soft", "any", "Look for bases labelled cool or rosy; pink-leaning rather than yellow. Always test on the jawline in daylight.", 10),
    ("autumn", "lipstick", "Terracotta", "#b35a3c", "medium", "any", "Earthy terracotta that mirrors the palette.", 10),
    ("autumn", "lipstick", "Warm Nude", "#b97d5e", "soft", "day", "Caramel-leaning everyday nude.", 20),
    ("autumn", "blusher", "Apricot Warmth", "#d38a5f", "soft", "day", "Sun-warmed apricot flush.", 10),
    ("autumn", "blusher", "Bronzed Rose", "#b46a52", "medium", "any", "Deeper bronze-rose cheek colour.", 20),
    ("autumn", "eyeshadow", "Golden Khaki", "#a2874a", "soft", "day", "Golden-green lid wash.", 10),
    ("autumn", "eyeshadow", "Copper Shimmer", "#b76b3d", "medium", "any", "Molten copper accent.", 20),
    ("autumn", "eyeshadow", "Deep Olive", "#585c33", "bold", "evening", "Smoky olive for evening.", 30),
    ("autumn", "eyeliner", "Espresso", "#46332b", "medium", "any", "Rich brown definition.", 10),
    ("autumn", "eyeliner", "Bronze Liner", "#7f5233", "bold", "evening", "Metallic-leaning warm liner.", 20),
    ("autumn", "highlighter", "Amber Gold", "#e2b26b", "medium", "any", "Deep golden glow.", 10),
    ("autumn", "highlighter", "Warm Champagne", "#e6c69a", "soft", "day", "Soft champagne sheen.", 20),
    ("autumn", "foundation", "Warm / Golden-Olive Direction", "#cf9a68", "soft", "any", "Look for bases labelled warm, golden or olive-friendly. Always test on the jawline in daylight.", 10),
    ("winter", "lipstick", "True Red", "#c0143c", "bold", "any", "Classic blue-based red.", 10),
    ("winter", "lipstick", "Cool Fuchsia", "#b92e80", "bold", "evening", "Vivid cool pink for impact.", 20),
    ("winter", "blusher", "Cool Berry", "#ab5070", "medium", "any", "Berry flush with cool depth.", 10),
    ("winter", "blusher", "Icy Rose", "#d9a2b6", "soft", "day", "Frosted rose for daytime.", 20),
    ("winter", "eyeshadow", "Icy Silver", "#d5dbe4", "soft", "day", "Glacial lid wash.", 10),
    ("winter", "eyeshadow", "Cool Plum", "#6b4a75", "medium", "any", "Plum crease definition.", 20),
    ("winter", "eyeshadow", "Charcoal Smoke", "#3b3f47", "bold", "evening", "True smoky eye shade.", 30),
    ("winter", "eyeliner", "Jet Black", "#17171a", "bold", "any", "Winter carries true black liner well.", 10),
    ("winter", "eyeliner", "Deep Navy", "#1c2b52", "medium", "evening", "Inky navy alternative.", 20),
    ("winter", "highlighter", "Icy Pearl", "#e9eef5", "soft", "any", "Cool crystalline sheen.", 10),
    ("winter", "highlighter", "Silver Sheen", "#cdd5df", "medium", "evening", "Silvered glow for evening.", 20),
    ("winter", "foundation", "Cool / Neutral Direction", "#d6a795", "soft", "any", "Look for bases labelled cool or neutral; avoid strongly golden bases. Always test on the jawline in daylight.", 10),
]

# --------------------------------------------------------------------------
# Stores and demo products
# --------------------------------------------------------------------------

STORES = [
    ("coloursense-demo-boutique", "ColourSense Demo Boutique", "https://example.com/demo-boutique", "MY"),
    ("demo-modest-wear", "Demo Modest Wear", "https://example.com/demo-modest-wear", "MY"),
    ("demo-mens-essentials", "Demo Men's Essentials", "https://example.com/demo-mens", "MY"),
    ("demo-beauty-counter", "Demo Beauty Counter", "https://example.com/demo-beauty", "MY"),
]

# (store, name, category, gender, colour_name, hex, seasons, price, description)
PRODUCTS = [
    ("coloursense-demo-boutique", "Coral Satin Blouse", "tops", "women", "Coral", "#ff6f61", ["spring"], 89.00, "Fluid satin blouse in a fresh warm coral."),
    ("coloursense-demo-boutique", "Peach Linen Shirt Dress", "dresses", "women", "Peach", "#ffbe98", ["spring"], 129.00, "Breathable linen dress in a soft peach."),
    ("demo-mens-essentials", "Warm Navy Oxford Shirt", "shirts", "men", "Warm Navy", "#34426b", ["spring", "autumn"], 79.00, "Classic oxford in a warm-leaning navy."),
    ("coloursense-demo-boutique", "Turquoise Knit Top", "tops", "women", "Turquoise", "#45d1c5", ["spring"], 69.00, "Lightweight knit in lively turquoise."),
    ("demo-modest-wear", "Peach Blossom Chiffon Hijab", "hijabs", "women", "Peach Blossom", "#f9b7a6", ["spring"], 25.00, "Airy chiffon hijab in a face-brightening peach."),
    ("coloursense-demo-boutique", "Camel Trench Coat", "outerwear", "unisex", "Camel", "#c19a6b", ["spring", "autumn"], 199.00, "Timeless trench in warm camel."),
    ("demo-beauty-counter", "Coral Cream Lipstick", "cosmetics", "unisex", "Warm Coral", "#e96a53", ["spring"], 39.00, "Creamy lipstick in a fresh warm coral."),
    ("coloursense-demo-boutique", "Golden Tan Leather Tote", "bags", "unisex", "Golden Tan", "#d2a56d", ["spring", "autumn"], 149.00, "Structured tote in golden tan."),
    ("coloursense-demo-boutique", "Powder Blue Poplin Shirt", "shirts", "women", "Powder Blue", "#a3c1d9", ["summer"], 75.00, "Crisp poplin shirt in powder blue."),
    ("coloursense-demo-boutique", "Lavender Knit Cardigan", "tops", "women", "Lavender", "#b3a5d3", ["summer"], 95.00, "Soft cardigan in gentle lavender."),
    ("demo-mens-essentials", "Slate Grey Polo", "tops", "men", "Slate Grey", "#8d99a5", ["summer"], 59.00, "Everyday polo in a cool slate grey."),
    ("coloursense-demo-boutique", "Dusty Rose Midi Skirt", "skirts", "women", "Dusty Pink", "#d8a7b1", ["summer"], 99.00, "Flowing midi skirt in dusty rose."),
    ("demo-modest-wear", "Misty Lilac Satin Hijab", "hijabs", "women", "Misty Lilac", "#c9b6d4", ["summer"], 29.00, "Satin-finish hijab in misty lilac."),
    ("coloursense-demo-boutique", "Soft Navy Blazer", "outerwear", "women", "Soft Navy", "#46586f", ["summer", "winter"], 189.00, "Tailored blazer in a softened navy."),
    ("demo-beauty-counter", "Rose Pink Lipstick", "cosmetics", "unisex", "Rose Pink", "#c76e84", ["summer"], 39.00, "Satin lipstick in a cool rose."),
    ("coloursense-demo-boutique", "Sea Glass Scarf", "scarves", "unisex", "Sea Glass", "#9dc3bc", ["summer"], 45.00, "Featherweight scarf in misty sea glass."),
    ("coloursense-demo-boutique", "Terracotta Wrap Dress", "dresses", "women", "Terracotta", "#c66b3d", ["autumn"], 139.00, "Wrap dress in earthy terracotta."),
    ("demo-mens-essentials", "Olive Field Jacket", "outerwear", "men", "Olive Green", "#737c3f", ["autumn"], 179.00, "Utility jacket in core olive."),
    ("coloursense-demo-boutique", "Mustard Ribbed Knit", "tops", "women", "Mustard", "#cc9c33", ["autumn"], 79.00, "Ribbed knit in golden mustard."),
    ("demo-mens-essentials", "Rust Flannel Shirt", "shirts", "men", "Rust", "#b7410e", ["autumn"], 85.00, "Brushed flannel in rich rust."),
    ("demo-modest-wear", "Warm Olive Jersey Hijab", "hijabs", "women", "Warm Olive", "#7f7b4d", ["autumn"], 25.00, "Everyday jersey hijab in warm olive."),
    ("coloursense-demo-boutique", "Chocolate Wide-Leg Trousers", "trousers", "women", "Chocolate Brown", "#5e4630", ["autumn"], 119.00, "Wide-leg trousers in deep chocolate."),
    ("demo-beauty-counter", "Terracotta Lipstick", "cosmetics", "unisex", "Terracotta", "#b35a3c", ["autumn"], 39.00, "Matte lipstick in earthy terracotta."),
    ("coloursense-demo-boutique", "Cognac Leather Belt", "accessories", "unisex", "Cognac Leather", "#9a5b33", ["autumn"], 59.00, "Full-grain belt in cognac."),
    ("coloursense-demo-boutique", "True Red Shift Dress", "dresses", "women", "True Red", "#c8102e", ["winter"], 149.00, "Sharp shift dress in clear true red."),
    ("demo-mens-essentials", "Royal Blue Merino Jumper", "tops", "men", "Royal Blue", "#4169e1", ["winter"], 129.00, "Fine merino in vivid royal blue."),
    ("coloursense-demo-boutique", "Emerald Satin Blouse", "tops", "women", "Emerald Green", "#009b77", ["winter"], 99.00, "Lustrous blouse in jewel emerald."),
    ("demo-mens-essentials", "Charcoal Wool Overcoat", "outerwear", "men", "Charcoal", "#3b3f46", ["winter"], 259.00, "Structured overcoat in deep charcoal."),
    ("demo-modest-wear", "Ice Grey Satin Hijab", "hijabs", "women", "Ice Grey", "#dee4ea", ["winter"], 29.00, "Cool satin hijab in ice grey."),
    ("coloursense-demo-boutique", "Fuchsia Evening Skirt", "skirts", "women", "Fuchsia", "#ca2c92", ["winter"], 109.00, "Statement skirt in cool fuchsia."),
    ("demo-beauty-counter", "True Red Lipstick", "cosmetics", "unisex", "True Red", "#c0143c", ["winter"], 39.00, "Blue-based classic red lipstick."),
    ("coloursense-demo-boutique", "Silver Chain Necklace", "accessories", "unisex", "Polished Silver", "#c7ccd4", ["winter", "summer"], 49.00, "Cool-toned chain necklace."),
]

CONTENT_PAGES = [
    (
        "about-demo-data",
        "About the demonstration data",
        (
            "The stores and products shown in this application are **seeded demonstration "
            "records** created for the Final Year Project evaluation. They illustrate how "
            "colour-matched product recommendations work. External links point to placeholder "
            "pages; no live marketplace data is used and no purchases can be made here."
        ),
        True,
    ),
]

SYSTEM_SETTINGS = [
    ("app.product_name", json.dumps("ColourSense"), "Display name of the product; configurable without refactoring."),
    ("analysis.allow_low_quality_continuation", json.dumps(False), "Permit analyses below the minimum quality score (results flagged low-confidence)."),
    ("products.max_recommendations", json.dumps(24), "Maximum products returned by the recommendation endpoint."),
    ("storage.signed_url_ttl_seconds", json.dumps(300), "Lifetime of signed URLs issued for stored analysis images."),
]


def main() -> None:
    classifier = json.loads(CLASSIFIER.read_text(encoding="utf-8"))
    lines: list[str] = []
    add = lines.append

    add("-- supabase/seed.sql — GENERATED FILE, do not edit by hand.")
    add("-- Regenerate with: python3 scripts/generate_seed.py")
    add("-- CIE Lab values are computed from each hex (sRGB, D65) at generation time.")
    add("")
    add("begin;")
    add("")

    # Seasons -----------------------------------------------------------
    add("-- Colour seasons ----------------------------------------------------")
    for s in SEASONS:
        add(
            "insert into public.colour_seasons (slug, name, tagline, description, characteristics, display_order)\n"
            f"values ({sql_str(s['slug'])}, {sql_str(s['name'])}, {sql_str(s['tagline'])}, "
            f"{sql_str(s['description'])}, {sql_str(json.dumps(s['characteristics']))}::jsonb, {s['display_order']})\n"
            "on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, "
            "description = excluded.description, characteristics = excluded.characteristics, "
            "display_order = excluded.display_order;"
        )
    add("")

    # Sub-seasons --------------------------------------------------------
    add("-- Colour sub-seasons ------------------------------------------------")
    for season_slug, slug, name, description, order in SUBSEASONS:
        add(
            "insert into public.colour_subseasons (season_id, slug, name, description, display_order)\n"
            f"select id, {sql_str(slug)}, {sql_str(name)}, {sql_str(description)}, {order}\n"
            f"from public.colour_seasons where slug = {sql_str(season_slug)}\n"
            "on conflict (slug) do update set name = excluded.name, description = excluded.description, "
            "display_order = excluded.display_order;"
        )
    add("")

    # Palette colours ------------------------------------------------------
    add("-- Palette colours (season-wide) --------------------------------------")
    add("delete from public.palette_colours;")
    for season_slug, colours in PALETTES.items():
        for name, hex_code, group, family, use, priority in colours:
            lab_l, lab_a, lab_b = hex_to_lab(hex_code)
            add(
                "insert into public.palette_colours "
                "(season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)\n"
                f"select s.id, null, {sql_str(name)}, {sql_str(hex_code)}, {lab_l}, {lab_a}, {lab_b}, "
                f"{sql_str(group)}, {sql_str(family)}, {sql_str(use)}, {priority}\n"
                f"from public.colour_seasons s where s.slug = {sql_str(season_slug)};"
            )
    add("")
    add("-- Palette colours (sub-season signatures) ---------------------------")
    for sub_slug, name, hex_code, group, family, use in SUBSEASON_COLOURS:
        lab_l, lab_a, lab_b = hex_to_lab(hex_code)
        add(
            "insert into public.palette_colours "
            "(season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)\n"
            f"select ss.season_id, ss.id, {sql_str(name)}, {sql_str(hex_code)}, {lab_l}, {lab_a}, {lab_b}, "
            f"{sql_str(group)}, {sql_str(family)}, {sql_str(use)}, 5\n"
            f"from public.colour_subseasons ss where ss.slug = {sql_str(sub_slug)};"
        )
    add("")

    # Cosmetics ----------------------------------------------------------
    add("-- Cosmetic recommendations ------------------------------------------")
    add("delete from public.cosmetic_recommendations;")
    for season_slug, ptype, name, hex_code, intensity, occasion, note, priority in COSMETICS:
        add(
            "insert into public.cosmetic_recommendations "
            "(season_id, product_type, name, hex, intensity, occasion, usage_note, priority)\n"
            f"select s.id, {sql_str(ptype)}, {sql_str(name)}, {sql_str(hex_code)}, {sql_str(intensity)}, "
            f"{sql_str(occasion)}, {sql_str(note)}, {priority}\n"
            f"from public.colour_seasons s where s.slug = {sql_str(season_slug)};"
        )
    add("")

    # Stores ----------------------------------------------------------------
    add("-- Demo stores ---------------------------------------------------------")
    for slug, name, url, country in STORES:
        add(
            "insert into public.stores (slug, name, website_url, country)\n"
            f"values ({sql_str(slug)}, {sql_str(name)}, {sql_str(url)}, {sql_str(country)})\n"
            "on conflict (slug) do update set name = excluded.name, website_url = excluded.website_url;"
        )
    add("")

    # Products ----------------------------------------------------------------
    add("-- Demo products (clearly labelled via is_demo = true) ------------------")
    add("delete from public.products where is_demo;")
    for idx, (store, name, category, gender, colour_name, hex_code, seasons, price, desc) in enumerate(
        PRODUCTS, start=1
    ):
        lab_l, lab_a, lab_b = hex_to_lab(hex_code)
        slug_name = name.lower().replace(" ", "-").replace("'", "")
        url = f"https://example.com/demo/products/{idx:03d}-{slug_name}"
        add(
            "with new_product as (\n"
            "  insert into public.products "
            "(store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)\n"
            f"  select st.id, {sql_str(name)}, 'ColourSense Demo', {sql_str(category)}, {sql_str(gender)}, "
            f"{sql_str(desc)}, {sql_str(url)}, {price}, 'MYR', 'in_stock', true\n"
            f"  from public.stores st where st.slug = {sql_str(store)}\n"
            "  returning id\n"
            ")\n"
            "insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)\n"
            f"select id, {sql_str(colour_name)}, {sql_str(hex_code)}, {lab_l}, {lab_a}, {lab_b}, true from new_product;"
        )
        for season in seasons:
            add(
                "insert into public.product_season_tags (product_id, season_slug)\n"
                f"select p.id, {sql_str(season)} from public.products p\n"
                f"where p.product_url = {sql_str(url)};"
            )
    add("")

    # Algorithm version -----------------------------------------------------
    add("-- Algorithm version (full classifier config snapshot) -----------------")
    add(
        "insert into public.algorithm_versions (version, name, config, notes, is_active)\n"
        f"values ({sql_str(classifier['version'])}, {sql_str(classifier['name'])}, "
        f"{sql_str(json.dumps(classifier, separators=(',', ':')))}::jsonb, "
        "'Initial rule-based classifier baseline.', true)\n"
        "on conflict (version) do update set config = excluded.config, name = excluded.name;"
    )
    add("")

    # Content pages ----------------------------------------------------------
    add("-- Content pages ---------------------------------------------------------")
    for slug, title, body, published in CONTENT_PAGES:
        add(
            "insert into public.content_pages (slug, title, body_markdown, is_published)\n"
            f"values ({sql_str(slug)}, {sql_str(title)}, {sql_str(body)}, {'true' if published else 'false'})\n"
            "on conflict (slug) do update set title = excluded.title, "
            "body_markdown = excluded.body_markdown, is_published = excluded.is_published;"
        )
    add("")

    # System settings ---------------------------------------------------------
    add("-- System settings --------------------------------------------------------")
    for key, value, description in SYSTEM_SETTINGS:
        add(
            "insert into public.system_settings (key, value, description)\n"
            f"values ({sql_str(key)}, {sql_str(value)}::jsonb, {sql_str(description)})\n"
            "on conflict (key) do update set value = excluded.value, description = excluded.description;"
        )
    add("")
    add("commit;")
    add("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    palette_rows = sum(len(v) for v in PALETTES.values()) + len(SUBSEASON_COLOURS)
    print(  # noqa: T201
        f"Wrote {OUT} — {len(SEASONS)} seasons, {len(SUBSEASONS)} sub-seasons, "
        f"{palette_rows} palette colours, {len(COSMETICS)} cosmetics, "
        f"{len(STORES)} stores, {len(PRODUCTS)} products."
    )


if __name__ == "__main__":
    main()
