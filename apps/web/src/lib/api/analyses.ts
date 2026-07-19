import type { AnalysisResult, Questionnaire, QualityReport } from "@coloursense/contracts";

import { apiFetch } from "@/lib/api/client";

export interface AnalyseOptions {
  saveImage: boolean;
  questionnaire?: Questionnaire;
  signal?: AbortSignal;
}

/** Fast, non-persisting quality gate (POST /analyses/preview-quality). */
export async function previewQuality(
  imageBlob: Blob,
  signal?: AbortSignal,
): Promise<QualityReport> {
  const form = new FormData();
  form.set("image", imageBlob, "photo.jpg");
  return apiFetch<QualityReport>("/analyses/preview-quality", {
    method: "POST",
    body: form,
    signal,
  });
}

/** Full analysis (POST /analyses). Persists only for authenticated users. */
export async function runAnalysis(
  imageBlob: Blob,
  { saveImage, questionnaire, signal }: AnalyseOptions,
): Promise<AnalysisResult> {
  const form = new FormData();
  form.set("image", imageBlob, "photo.jpg");
  form.set("save_image", String(saveImage));
  if (questionnaire && Object.keys(questionnaire).length > 0) {
    form.set("questionnaire", JSON.stringify(questionnaire));
  }
  return apiFetch<AnalysisResult>("/analyses", {
    method: "POST",
    body: form,
    signal,
  });
}

/* ------------------------------------------------------------------ */
/* Saved analyses (authenticated)                                      */
/* ------------------------------------------------------------------ */

export interface AnalysisSummary {
  id: string;
  undertone: "warm" | "cool";
  seasonSlug: string;
  subseasonSlug: string | null;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low";
  classifierVersion: string;
  overallScore: number | null;
  combinedHex: string | null;
  hasImage: boolean;
  createdAt: string;
}

export interface AnalysisListResponse {
  items: AnalysisSummary[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export interface StoredSample {
  region: string;
  r: number;
  g: number;
  b: number;
  hex: string;
  hsvH: number;
  hsvS: number;
  hsvV: number;
  labL: number;
  labA: number;
  labB: number;
  chroma: number;
  hueAngleDegrees: number;
  usablePixelRatio: number;
  pixelCount: number;
}

export interface AnalysisDetail {
  id: string;
  undertone: "warm" | "cool";
  internalUndertone: "warm" | "cool" | "neutral" | "uncertain";
  undertoneScore: number;
  seasonSlug: string;
  subseasonSlug: string | null;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low";
  classifierVersion: string;
  processingMs: number;
  createdAt: string;
  quality: Record<string, unknown> | null;
  classification: Record<string, unknown> | null;
  samples: StoredSample[];
  hasImage: boolean;
  imageUrl: string | null;
}

export function listAnalyses(page = 1, pageSize = 12): Promise<AnalysisListResponse> {
  return apiFetch<AnalysisListResponse>(`/analyses?page=${page}&page_size=${pageSize}`);
}

export function getAnalysis(id: string): Promise<AnalysisDetail> {
  return apiFetch<AnalysisDetail>(`/analyses/${id}`);
}

export function deleteAnalysis(id: string): Promise<void> {
  return apiFetch<void>(`/analyses/${id}`, { method: "DELETE" });
}

export function deleteAllAnalyses(): Promise<void> {
  return apiFetch<void>("/me/analyses", { method: "DELETE" });
}

export function saveAnalysisImage(
  id: string,
  imageBlob: Blob,
): Promise<{ analysisId: string; stored: boolean; imageUrl: string | null }> {
  const form = new FormData();
  form.set("image", imageBlob, "photo.jpg");
  return apiFetch(`/analyses/${id}/save-image`, { method: "POST", body: form });
}

export function deleteAnalysisImage(id: string): Promise<void> {
  return apiFetch<void>(`/analyses/${id}/image`, { method: "DELETE" });
}
