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
