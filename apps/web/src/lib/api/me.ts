import { apiFetch } from "@/lib/api/client";

export interface Preferences {
  defaultImageStorage: boolean;
  preferredCurrency: string;
  reducedMotion: boolean;
}

export function getPreferences(): Promise<Preferences> {
  return apiFetch<Preferences>("/me/preferences");
}

export function updatePreferences(update: Partial<Preferences>): Promise<Preferences> {
  return apiFetch<Preferences>("/me/preferences", { method: "PATCH", body: update });
}

export function recordConsent(
  consentType: "image_analysis" | "image_storage" | "questionnaire",
  granted: boolean,
): Promise<void> {
  return apiFetch<void>("/me/consents", { method: "POST", body: { consentType, granted } });
}

export function updateDisplayName(displayName: string): Promise<void> {
  return apiFetch<void>("/me", { method: "PATCH", body: { displayName } });
}

export function deleteAccount(): Promise<void> {
  return apiFetch<void>("/me", { method: "DELETE" });
}
