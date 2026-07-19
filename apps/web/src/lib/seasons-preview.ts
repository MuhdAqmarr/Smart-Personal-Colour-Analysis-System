/**
 * Static display data for the marketing pages (landing + seasons overview).
 * Slugs and hex values mirror the seeded catalogue; live palette data is
 * served by the API on the analysis/palette screens.
 */
export interface SeasonPreview {
  slug: "spring" | "summer" | "autumn" | "winter";
  name: string;
  tagline: string;
  summary: string;
  traits: { temperature: string; value: string; chroma: string; contrast: string };
  swatches: { name: string; hex: string }[];
  subSeasons: { slug: string; name: string; note: string }[];
}

export const seasonPreviews: SeasonPreview[] = [
  {
    slug: "spring",
    name: "Spring",
    tagline: "Warm, light and fresh",
    summary:
      "A warm undertone with light-to-medium depth and clear, fresh brightness. Corals, peaches, golden yellows and lively aqua tones tend to harmonise well.",
    traits: {
      temperature: "Warm",
      value: "Light–medium",
      chroma: "Clear",
      contrast: "Low–medium",
    },
    swatches: [
      { name: "Coral", hex: "#ff6f61" },
      { name: "Peach", hex: "#ffbe98" },
      { name: "Warm Yellow", hex: "#f7c948" },
      { name: "Leaf Green", hex: "#7bb661" },
      { name: "Turquoise", hex: "#45d1c5" },
      { name: "Camel", hex: "#c19a6b" },
    ],
    subSeasons: [
      { slug: "light-spring", name: "Light Spring", note: "Lightest and most delicate" },
      { slug: "warm-spring", name: "Warm Spring", note: "The most golden" },
      { slug: "bright-spring", name: "Bright Spring", note: "The clearest and most vivid" },
    ],
  },
  {
    slug: "summer",
    name: "Summer",
    tagline: "Cool, soft and gentle",
    summary:
      "A cool undertone with light-to-medium depth and softly muted colour. Powder blues, dusty roses, lavenders and gentle grey-greens tend to harmonise well.",
    traits: {
      temperature: "Cool",
      value: "Light–medium",
      chroma: "Muted",
      contrast: "Low–medium",
    },
    swatches: [
      { name: "Powder Blue", hex: "#a3c1d9" },
      { name: "Rose Pink", hex: "#dfa0af" },
      { name: "Lavender", hex: "#b3a5d3" },
      { name: "Sage Green", hex: "#a8b8a0" },
      { name: "Dusty Blue", hex: "#7e9cb9" },
      { name: "Rose Beige", hex: "#d9c2bd" },
    ],
    subSeasons: [
      { slug: "light-summer", name: "Light Summer", note: "Lightest and airiest" },
      { slug: "cool-summer", name: "Cool Summer", note: "The coolest, rose and blue led" },
      { slug: "soft-summer", name: "Soft Summer", note: "The most muted and misty" },
    ],
  },
  {
    slug: "autumn",
    name: "Autumn",
    tagline: "Warm, rich and earthy",
    summary:
      "A warm undertone with medium-to-deep depth and muted, earthy richness. Terracotta, rust, olive, mustard and warm teal tend to harmonise well.",
    traits: {
      temperature: "Warm",
      value: "Medium–deep",
      chroma: "Muted",
      contrast: "Medium",
    },
    swatches: [
      { name: "Terracotta", hex: "#c66b3d" },
      { name: "Rust", hex: "#b7410e" },
      { name: "Mustard", hex: "#cc9c33" },
      { name: "Olive Green", hex: "#737c3f" },
      { name: "Warm Teal", hex: "#2f6f7e" },
      { name: "Chocolate", hex: "#5e4630" },
    ],
    subSeasons: [
      { slug: "soft-autumn", name: "Soft Autumn", note: "The gentlest and haziest" },
      { slug: "warm-autumn", name: "Warm Autumn", note: "The most golden" },
      { slug: "deep-autumn", name: "Deep Autumn", note: "The darkest and richest" },
    ],
  },
  {
    slug: "winter",
    name: "Winter",
    tagline: "Cool, clear and striking",
    summary:
      "A cool undertone with medium-to-deep depth and clear, high-contrast colour. True red, royal blue, emerald and icy brights tend to harmonise well.",
    traits: {
      temperature: "Cool",
      value: "Medium–deep",
      chroma: "Clear",
      contrast: "High",
    },
    swatches: [
      { name: "True Red", hex: "#c8102e" },
      { name: "Royal Blue", hex: "#4169e1" },
      { name: "Emerald", hex: "#009b77" },
      { name: "Fuchsia", hex: "#ca2c92" },
      { name: "Icy Blue", hex: "#cfe8f5" },
      { name: "True Black", hex: "#111111" },
    ],
    subSeasons: [
      { slug: "deep-winter", name: "Deep Winter", note: "The darkest and most dramatic" },
      { slug: "cool-winter", name: "Cool Winter", note: "The iciest and coolest" },
      { slug: "bright-winter", name: "Bright Winter", note: "The most electric" },
    ],
  },
];
