import { apiFetch } from "@/lib/api/client";

export interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  analysesLast7Days: number;
  averageConfidence: number | null;
  confidenceDistribution: Record<string, number>;
  seasonDistribution: Record<string, number>;
  averageProcessingMs: number | null;
  activeProducts: number;
  activeStores: number;
  paletteColours: number;
  classifierVersion: string | null;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: Record<string, unknown>;
  requestId: string;
  createdAt: string;
}

export interface AlgorithmVersion {
  id: string;
  version: string;
  name: string;
  notes: string;
  isActive: boolean;
  releasedAt: string;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  description: string;
}

export interface AdminStore {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string | null;
  country: string;
  isActive: boolean;
}

export interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  gender: string;
  price: number | null;
  currency: string;
  availability: string;
  isActive: boolean;
  isDemo: boolean;
  productUrl: string;
  storeName: string;
  hex: string | null;
}

export interface AdminProductList {
  items: AdminProduct[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export interface ImportResult {
  jobId: string;
  dryRun: boolean;
  totalRows: number;
  validRows: number;
  insertedRows: number;
  updatedRows: number;
  errorRows: number;
  errors: { rowNumber: number; column: string; message: string }[];
}

export interface ImportJob {
  id: string;
  filename: string;
  status: string;
  dryRun: boolean;
  totalRows: number;
  validRows: number;
  insertedRows: number;
  updatedRows: number;
  errorRows: number;
  createdAt: string;
}

export const getAdminStats = () => apiFetch<AdminStats>("/admin/stats");
export const listAuditLogs = (page = 1) =>
  apiFetch<AuditLogEntry[]>(`/admin/audit-logs?page=${page}`);
export const listAlgorithmVersions = () =>
  apiFetch<AlgorithmVersion[]>("/admin/algorithm-versions");
export const listSettings = () => apiFetch<SystemSetting[]>("/admin/settings");
export const updateSetting = (key: string, value: unknown) =>
  apiFetch<SystemSetting>(`/admin/settings/${key}`, { method: "PUT", body: { value } });

export const listAdminStores = () => apiFetch<AdminStore[]>("/admin/stores");
export const createStore = (store: {
  slug: string;
  name: string;
  websiteUrl?: string | null;
  country?: string;
}) => apiFetch<AdminStore>("/admin/stores", { method: "POST", body: store });
export const updateStore = (
  id: string,
  update: Partial<Pick<AdminStore, "name" | "websiteUrl" | "country" | "isActive">>,
) => apiFetch<AdminStore>(`/admin/stores/${id}`, { method: "PATCH", body: update });

export const listAdminProducts = (page = 1, q?: string) =>
  apiFetch<AdminProductList>(
    `/admin/products?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ""}`,
  );
export const createAdminProduct = (product: {
  storeSlug: string;
  name: string;
  brand?: string;
  category: string;
  gender?: string;
  description?: string;
  productUrl: string;
  price?: number | null;
  currency?: string;
  availability?: string;
  colourName?: string;
  colourHex: string;
  seasonTags?: string[];
}) => apiFetch<{ id: string }>("/admin/products", { method: "POST", body: product });
export const updateAdminProduct = (
  id: string,
  update: {
    name?: string;
    brand?: string;
    description?: string;
    price?: number;
    availability?: string;
    isActive?: boolean;
  },
) => apiFetch<{ ok: boolean }>(`/admin/products/${id}`, { method: "PATCH", body: update });

export const createPaletteColour = (colour: {
  seasonSlug: string;
  subseasonSlug?: string | null;
  name: string;
  hex: string;
  paletteGroup: string;
  colourFamily?: string;
  recommendedUse?: string;
  priority?: number;
}) => apiFetch<{ id: string }>("/admin/palette-colours", { method: "POST", body: colour });
export const updatePaletteColour = (
  id: string,
  update: { name?: string; recommendedUse?: string; priority?: number; isActive?: boolean },
) => apiFetch<{ ok: boolean }>(`/admin/palette-colours/${id}`, { method: "PATCH", body: update });
export const deletePaletteColour = (id: string) =>
  apiFetch<void>(`/admin/palette-colours/${id}`, { method: "DELETE" });

export const createCosmetic = (cosmetic: {
  seasonSlug: string;
  productType: string;
  name: string;
  hex: string;
  intensity?: string;
  occasion?: string;
  usageNote?: string;
}) => apiFetch<{ id: string }>("/admin/cosmetics", { method: "POST", body: cosmetic });
export const deleteCosmetic = (id: string) =>
  apiFetch<void>(`/admin/cosmetics/${id}`, { method: "DELETE" });

export const importProductsCsv = (file: File, dryRun: boolean) => {
  const form = new FormData();
  form.set("file", file, file.name);
  return apiFetch<ImportResult>(`/admin/products/import?dry_run=${dryRun}`, {
    method: "POST",
    body: form,
  });
};
export const listImportJobs = () => apiFetch<ImportJob[]>("/admin/products/imports");
export const listImportErrors = (jobId: string) =>
  apiFetch<{ rowNumber: number; columnName: string; errorMessage: string }[]>(
    `/admin/products/imports/${jobId}/errors`,
  );

export interface MeProfile {
  id: string;
  email: string | null;
  displayName: string;
  role: string;
  defaultImageStorage: boolean;
}

export const getMe = () => apiFetch<MeProfile>("/me");
