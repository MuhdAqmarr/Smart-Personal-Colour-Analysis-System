import { apiFetch } from "@/lib/api/client";

export interface ProductColour {
  colourName: string;
  hex: string;
  labL: number;
  labA: number;
  labB: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  gender: string;
  description: string;
  imageUrl: string | null;
  productUrl: string;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  availability: string;
  isDemo: boolean;
  storeSlug: string;
  storeName: string;
  colours: ProductColour[];
  seasonTags: { seasonSlug: string; subseasonSlug: string | null }[];
  isFavourite: boolean;
  matchScore: number | null;
  minDeltaE: number | null;
}

export interface ProductListResponse {
  items: Product[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export interface ProductFilters {
  category?: string;
  gender?: string;
  season?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export function listProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.season) params.set("season", filters.season);
  if (filters.q) params.set("q", filters.q);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(filters.page ?? 1));
  params.set("page_size", String(filters.pageSize ?? 12));
  return apiFetch<ProductListResponse>(`/products?${params.toString()}`, { auth: false });
}

export function getRecommendedProducts(analysisId: string): Promise<Product[]> {
  return apiFetch<Product[]>(`/analyses/${analysisId}/recommended-products`);
}

export function listFavouriteProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/me/favourite-products");
}

export function favouriteProduct(productId: string): Promise<void> {
  return apiFetch<void>(`/products/${productId}/favourite`, { method: "POST" });
}

export function unfavouriteProduct(productId: string): Promise<void> {
  return apiFetch<void>(`/products/${productId}/favourite`, { method: "DELETE" });
}
