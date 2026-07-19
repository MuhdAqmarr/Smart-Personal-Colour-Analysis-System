import classifierV1 from "../config/classifier-v1.json";

/** The four major seasons supported by the engine. */
export const MAJOR_SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type MajorSeason = (typeof MAJOR_SEASONS)[number];

/** The twelve sub-seasons, keyed by their parent major season. */
export const SUB_SEASONS = {
  spring: ["light-spring", "warm-spring", "bright-spring"],
  summer: ["light-summer", "cool-summer", "soft-summer"],
  autumn: ["soft-autumn", "warm-autumn", "deep-autumn"],
  winter: ["deep-winter", "cool-winter", "bright-winter"],
} as const satisfies Record<MajorSeason, readonly string[]>;
export type SubSeason = (typeof SUB_SEASONS)[MajorSeason][number];

/** User-facing undertone classes. */
export const UNDERTONES = ["warm", "cool"] as const;
export type Undertone = (typeof UNDERTONES)[number];

/** Internal undertone classes (superset of the user-facing ones). */
export const INTERNAL_UNDERTONES = ["warm", "cool", "neutral", "uncertain"] as const;
export type InternalUndertone = (typeof INTERNAL_UNDERTONES)[number];

export type ClassifierConfig = typeof classifierV1;

/**
 * The active classifier configuration. The Python backend loads the same JSON
 * file directly; this export exists so the frontend can display engine
 * metadata (version, thresholds) without re-declaring constants.
 */
export const classifierConfig: ClassifierConfig = classifierV1;

export const CLASSIFIER_VERSION: string = classifierV1.version;
