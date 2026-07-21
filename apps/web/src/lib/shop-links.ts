/**
 * External marketplace search links, derived from a user's palette.
 *
 * These are deep links into each platform's own search — we never scrape or
 * claim a measured colour match for the results. The listings (and their
 * colours) are provided by the store and may differ from the palette. This
 * complements, and is deliberately separate from, the internal CIEDE2000
 * product ranking, which is the only place colour distance is measured.
 *
 * Region: Malaysia (`.com.my`). Change the hosts here to retarget.
 */

export interface ShopPlatform {
  id: string;
  name: string;
  buildUrl: (query: string) => string;
}

export const SHOP_PLATFORMS: ShopPlatform[] = [
  {
    id: "shopee",
    name: "Shopee",
    buildUrl: (q) => `https://shopee.com.my/search?keyword=${encodeURIComponent(q)}`,
  },
  {
    id: "lazada",
    name: "Lazada",
    buildUrl: (q) => `https://www.lazada.com.my/catalog/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "zalora",
    name: "Zalora",
    buildUrl: (q) => `https://www.zalora.com.my/search/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "tiktok",
    name: "TikTok",
    buildUrl: (q) => `https://www.tiktok.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "google",
    name: "Google Shopping",
    buildUrl: (q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`,
  },
];

/**
 * Category refinements. `term` is appended to the colour name to build the
 * search query; an empty term searches the colour alone.
 */
export const SHOP_CATEGORIES: { value: string; label: string; term: string }[] = [
  { value: "all", label: "All items", term: "" },
  { value: "tops", label: "Tops", term: "top" },
  { value: "dresses", label: "Dresses", term: "dress" },
  { value: "outerwear", label: "Outerwear", term: "jacket" },
  { value: "hijab", label: "Hijab & scarves", term: "hijab" },
  { value: "trousers", label: "Trousers", term: "trousers" },
  { value: "shoes", label: "Shoes", term: "shoes" },
  { value: "bags", label: "Bags", term: "bag" },
  { value: "accessories", label: "Accessories", term: "accessories" },
  { value: "cosmetics", label: "Makeup", term: "makeup" },
];

/** Compose the search query: colour name plus an optional category term. */
export function buildShopQuery(colourName: string, categoryTerm: string): string {
  return [colourName.trim(), categoryTerm.trim()].filter(Boolean).join(" ");
}
