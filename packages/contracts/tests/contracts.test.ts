import { describe, expect, it } from "vitest";

import {
  analysisResultSchema,
  apiErrorSchema,
  healthResponseSchema,
  majorSeasonSchema,
  paginatedSchema,
  qualityReportSchema,
  subSeasonSchema,
  z,
} from "./helpers";

describe("contracts", () => {
  it("accepts a valid error envelope", () => {
    const parsed = apiErrorSchema.safeParse({
      error: {
        code: "IMAGE_TOO_DARK",
        message: "The image is too dark for a reliable colour analysis.",
        details: { brightnessScore: 0.31 },
        requestId: "req-123",
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an error envelope without a code", () => {
    const parsed = apiErrorSchema.safeParse({ error: { message: "nope" } });
    expect(parsed.success).toBe(false);
  });

  it("accepts a valid health response", () => {
    expect(
      healthResponseSchema.safeParse({
        status: "ok",
        name: "coloursense-api",
        version: "0.1.0",
        environment: "test",
      }).success,
    ).toBe(true);
  });

  it("knows all four major seasons and twelve sub-seasons", () => {
    expect(majorSeasonSchema.options).toHaveLength(4);
    expect(subSeasonSchema.options).toHaveLength(12);
  });

  it("validates quality report bounds", () => {
    const base = {
      overallScore: 101,
      acceptable: true,
      components: {
        faceDetection: 100,
        faceSize: 90,
        pose: 80,
        sharpness: 70,
        exposure: 60,
        lightingConsistency: 50,
        colourCast: 40,
        usableSkinArea: 30,
      },
      exposureStatus: "acceptable",
      colourCast: "none",
      pose: { yawDegrees: 1, pitchDegrees: 2, rollDegrees: 3 },
      issues: [],
      retakeTips: [],
    };
    expect(qualityReportSchema.safeParse(base).success).toBe(false);
    expect(qualityReportSchema.safeParse({ ...base, overallScore: 88 }).success).toBe(true);
  });

  it("builds paginated schemas", () => {
    const schema = paginatedSchema(z.object({ id: z.string() }));
    expect(
      schema.safeParse({
        items: [{ id: "a" }],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      }).success,
    ).toBe(true);
  });

  it("requires persisted flag and classifier version on analysis results", () => {
    const shape = analysisResultSchema.shape;
    expect(shape.persisted).toBeDefined();
    expect(shape.classifierVersion).toBeDefined();
  });
});
