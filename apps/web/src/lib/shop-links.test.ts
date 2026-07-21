import { describe, expect, it } from "vitest";

import { buildShopQuery, SHOP_CATEGORIES, SHOP_PLATFORMS } from "./shop-links";

describe("buildShopQuery", () => {
  it("joins colour and category term", () => {
    expect(buildShopQuery("Terracotta", "top")).toBe("Terracotta top");
  });

  it("uses the colour alone when the category term is empty", () => {
    expect(buildShopQuery("Warm Teal", "")).toBe("Warm Teal");
  });

  it("trims stray whitespace", () => {
    expect(buildShopQuery("  Rust ", " dress ")).toBe("Rust dress");
  });
});

describe("SHOP_PLATFORMS", () => {
  it("every platform builds an https URL with the query encoded", () => {
    const query = buildShopQuery("Cool Berry", "top"); // has a space
    for (const platform of SHOP_PLATFORMS) {
      const url = platform.buildUrl(query);
      expect(url.startsWith("https://")).toBe(true);
      // Space is percent-encoded, never left raw in the URL.
      expect(url).not.toContain("Cool Berry");
      expect(url).toContain(encodeURIComponent(query));
    }
  });

  it("covers the marketplaces the product targets", () => {
    const ids = SHOP_PLATFORMS.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["shopee", "lazada", "zalora", "tiktok", "google"]));
  });
});

describe("SHOP_CATEGORIES", () => {
  it("defaults to an all-items option with no refinement term", () => {
    expect(SHOP_CATEGORIES[0]).toMatchObject({ value: "all", term: "" });
  });
});
