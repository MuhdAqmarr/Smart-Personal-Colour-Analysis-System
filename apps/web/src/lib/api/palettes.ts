import { apiFetch } from "@/lib/api/client";

export interface PaletteColour {
  id: string;
  name: string;
  hex: string;
  labL: number;
  labA: number;
  labB: number;
  paletteGroup: string;
  colourFamily: string;
  recommendedUse: string;
  subseasonSlug: string | null;
  isFavourite: boolean;
}

export interface Cosmetic {
  id: string;
  productType: string;
  name: string;
  hex: string;
  intensity: string;
  occasion: string;
  usageNote: string;
}

export interface SeasonDetail {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  characteristics: Record<string, string>;
  appliedSubseason: string | null;
  groups: Record<string, PaletteColour[]>;
  cosmetics: Cosmetic[];
}

export interface SeasonSummary {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  characteristics: Record<string, string>;
  subSeasons: { slug: string; name: string; description: string }[];
}

export interface FavouriteColour {
  id: string;
  name: string;
  hex: string;
  paletteGroup: string;
  recommendedUse: string;
  seasonSlug: string;
  seasonName: string;
}

export function listSeasons(): Promise<SeasonSummary[]> {
  return apiFetch<SeasonSummary[]>("/seasons");
}

export function getSeasonDetail(slug: string, subseason?: string | null): Promise<SeasonDetail> {
  const query = subseason ? `?subseason=${encodeURIComponent(subseason)}` : "";
  return apiFetch<SeasonDetail>(`/seasons/${slug}${query}`);
}

export function getAnalysisPalette(analysisId: string): Promise<SeasonDetail> {
  return apiFetch<SeasonDetail>(`/analyses/${analysisId}/palette`);
}

export function favouriteColour(colourId: string): Promise<void> {
  return apiFetch<void>(`/colours/${colourId}/favourite`, { method: "POST" });
}

export function unfavouriteColour(colourId: string): Promise<void> {
  return apiFetch<void>(`/colours/${colourId}/favourite`, { method: "DELETE" });
}

export function listFavouriteColours(): Promise<FavouriteColour[]> {
  return apiFetch<FavouriteColour[]>("/me/favourite-colours");
}
