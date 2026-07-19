import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Domain enums                                                        */
/* ------------------------------------------------------------------ */

export const majorSeasonSchema = z.enum(["spring", "summer", "autumn", "winter"]);
export type MajorSeason = z.infer<typeof majorSeasonSchema>;

export const subSeasonSchema = z.enum([
  "light-spring",
  "warm-spring",
  "bright-spring",
  "light-summer",
  "cool-summer",
  "soft-summer",
  "soft-autumn",
  "warm-autumn",
  "deep-autumn",
  "deep-winter",
  "cool-winter",
  "bright-winter",
]);
export type SubSeason = z.infer<typeof subSeasonSchema>;

export const undertoneSchema = z.enum(["warm", "cool"]);
export type Undertone = z.infer<typeof undertoneSchema>;

export const internalUndertoneSchema = z.enum(["warm", "cool", "neutral", "uncertain"]);
export type InternalUndertone = z.infer<typeof internalUndertoneSchema>;

export const confidenceLabelSchema = z.enum(["high", "medium", "low"]);
export type ConfidenceLabel = z.infer<typeof confidenceLabelSchema>;

/* ------------------------------------------------------------------ */
/* Error envelope                                                      */
/* ------------------------------------------------------------------ */

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Stable machine-readable error codes returned by /api/v1. */
export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "RATE_LIMITED",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "IMAGE_DECODE_FAILED",
  "IMAGE_TOO_SMALL",
  "IMAGE_TOO_LARGE",
  "NO_FACE_DETECTED",
  "MULTIPLE_FACES_DETECTED",
  "FACE_TOO_SMALL",
  "FACE_OUT_OF_FRAME",
  "LANDMARKS_UNAVAILABLE",
  "POSE_TOO_EXTREME",
  "IMAGE_TOO_BLURRY",
  "IMAGE_TOO_DARK",
  "IMAGE_TOO_BRIGHT",
  "UNEVEN_LIGHTING",
  "STRONG_COLOUR_CAST",
  "QUALITY_TOO_LOW",
  "INTERNAL_ERROR",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  name: z.string(),
  version: z.string(),
  environment: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const readinessResponseSchema = z.object({
  status: z.enum(["ready", "degraded"]),
  checks: z.record(z.string(), z.enum(["ok", "failed", "skipped"])),
});
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;

/* ------------------------------------------------------------------ */
/* Image quality                                                       */
/* ------------------------------------------------------------------ */

export const qualityComponentScoresSchema = z.object({
  faceDetection: z.number().min(0).max(100),
  faceSize: z.number().min(0).max(100),
  pose: z.number().min(0).max(100),
  sharpness: z.number().min(0).max(100),
  exposure: z.number().min(0).max(100),
  lightingConsistency: z.number().min(0).max(100),
  colourCast: z.number().min(0).max(100),
  usableSkinArea: z.number().min(0).max(100),
});
export type QualityComponentScores = z.infer<typeof qualityComponentScoresSchema>;

export const exposureStatusSchema = z.enum([
  "acceptable",
  "too_dark",
  "too_bright",
  "strong_shadow",
  "uneven_lighting",
  "low_contrast",
]);
export type ExposureStatus = z.infer<typeof exposureStatusSchema>;

export const colourCastSchema = z.enum(["none", "yellow", "blue", "red", "green"]);
export type ColourCast = z.infer<typeof colourCastSchema>;

export const qualityReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  acceptable: z.boolean(),
  components: qualityComponentScoresSchema,
  exposureStatus: exposureStatusSchema,
  colourCast: colourCastSchema,
  pose: z.object({
    yawDegrees: z.number(),
    pitchDegrees: z.number(),
    rollDegrees: z.number(),
  }),
  issues: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      severity: z.enum(["info", "warning", "blocking"]),
    }),
  ),
  retakeTips: z.array(z.string()),
});
export type QualityReport = z.infer<typeof qualityReportSchema>;

/* ------------------------------------------------------------------ */
/* Colour values                                                       */
/* ------------------------------------------------------------------ */

export const rgbSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
});
export type Rgb = z.infer<typeof rgbSchema>;

export const labSchema = z.object({
  l: z.number(),
  a: z.number(),
  b: z.number(),
});
export type Lab = z.infer<typeof labSchema>;

export const colourSampleSchema = z.object({
  region: z.enum(["forehead", "left_cheek", "right_cheek", "combined"]),
  rgb: rgbSchema,
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hsv: z.object({ h: z.number(), s: z.number(), v: z.number() }),
  lab: labSchema,
  chroma: z.number(),
  hueAngleDegrees: z.number(),
  usablePixelRatio: z.number().min(0).max(1),
  pixelCount: z.number().int().nonnegative(),
});
export type ColourSample = z.infer<typeof colourSampleSchema>;

/* ------------------------------------------------------------------ */
/* Analysis result                                                     */
/* ------------------------------------------------------------------ */

export const undertoneResultSchema = z.object({
  undertone: undertoneSchema,
  internalUndertone: internalUndertoneSchema,
  score: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
  confidenceLabel: confidenceLabelSchema,
  evidence: z.array(z.string()),
  warnings: z.array(z.string()),
});
export type UndertoneResult = z.infer<typeof undertoneResultSchema>;

export const seasonResultSchema = z.object({
  season: majorSeasonSchema,
  subSeason: subSeasonSchema.nullable(),
  scores: z.record(majorSeasonSchema, z.number()),
  dimensions: z.object({
    temperature: z.number().min(0).max(1),
    value: z.number().min(0).max(1),
    chroma: z.number().min(0).max(1),
    contrast: z.number().min(0).max(1),
  }),
});
export type SeasonResult = z.infer<typeof seasonResultSchema>;

export const analysisResultSchema = z.object({
  analysisId: z.string().uuid().nullable(),
  persisted: z.boolean(),
  classifierVersion: z.string(),
  processingMs: z.number().nonnegative(),
  quality: qualityReportSchema,
  samples: z.array(colourSampleSchema),
  undertone: undertoneResultSchema,
  season: seasonResultSchema,
  confidence: z.number().min(0).max(1),
  confidenceLabel: confidenceLabelSchema,
  explanation: z.object({
    summary: z.string(),
    evidence: z.array(z.string()),
    qualityNotes: z.array(z.string()),
    improvementTips: z.array(z.string()),
  }),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

/* ------------------------------------------------------------------ */
/* Questionnaire (optional supporting signals)                         */
/* ------------------------------------------------------------------ */

export const questionnaireSchema = z.object({
  naturalHairColour: z
    .enum(["black", "dark-brown", "medium-brown", "light-brown", "blonde", "red", "grey-white"])
    .optional(),
  naturalEyeColour: z.enum(["dark-brown", "brown", "hazel", "green", "blue", "grey"]).optional(),
  perceivedContrast: z.enum(["low", "medium", "high"]).optional(),
  jewelleryPreference: z.enum(["gold", "silver", "both"]).optional(),
  sunReaction: z
    .enum(["burns-easily", "burns-then-tans", "tans-easily", "rarely-burns"])
    .optional(),
});
export type Questionnaire = z.infer<typeof questionnaireSchema>;

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof paginationSchema>;

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    pagination: paginationSchema,
  });
}
