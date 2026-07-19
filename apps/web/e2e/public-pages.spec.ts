import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Public pages", () => {
  test("landing page presents the four seasons and honest positioning", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Find the colours that were made for you",
    );
    await expect(page.getByRole("region", { name: /the four colour seasons/i })).toBeVisible();
    await expect(page.getByText(/rule-based colour science/i).first()).toBeVisible();
  });

  test("product directory lists seeded items and filters by category", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /product directory/i })).toBeVisible();
    await expect(page.getByText(/demo data/i).first()).toBeVisible({ timeout: 15_000 });

    // External links carry the safety attributes.
    const firstLink = page.getByRole("link", { name: /view at/i }).first();
    await expect(firstLink).toHaveAttribute("target", "_blank");
    await expect(firstLink).toHaveAttribute("rel", /noopener/);
    await expect(firstLink).toHaveAttribute("rel", /noreferrer/);
  });

  test("seasons page shows all four seasons with swatches", async ({ page }) => {
    await page.goto("/seasons");
    for (const season of ["Spring", "Summer", "Autumn", "Winter"]) {
      await expect(page.getByRole("heading", { name: season, exact: true }).first()).toBeVisible();
    }
  });

  test("anonymous visitors are redirected away from the admin area", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("anonymous visitors are redirected away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("Accessibility (axe-core, WCAG 2.1 A/AA)", () => {
  for (const [name, url] of [
    ["landing", "/"],
    ["analysis consent", "/analysis"],
    ["sign-in", "/sign-in"],
    ["seasons", "/seasons"],
    ["faq", "/faq"],
  ] as const) {
    test(`${name} page has no serious violations`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      );
      expect(
        serious,
        serious.map((violation) => `${violation.id}: ${violation.description}`).join("\n"),
      ).toEqual([]);
    });
  }
});
