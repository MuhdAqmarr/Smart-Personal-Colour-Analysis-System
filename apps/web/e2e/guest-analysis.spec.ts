import path from "node:path";

import { expect, test } from "@playwright/test";

const VALID_FACE = path.join(__dirname, "fixtures", "valid-face.jpg");
const NO_FACE = path.join(__dirname, "fixtures", "no-face.jpg");

/** Walk the wizard to the capture step (consent → guidance). */
async function reachCaptureStep(page: import("@playwright/test").Page) {
  await page.goto("/analysis");
  await page.getByRole("checkbox", { name: /i agree to the analysis/i }).click();
  await page.getByRole("button", { name: /i agree — continue/i }).click();
  await page.getByRole("button", { name: /i'm ready/i }).click();
  await expect(page.getByText("Add your photo")).toBeVisible();
}

async function uploadFixture(page: import("@playwright/test").Page, file: string) {
  await page.getByRole("tab", { name: "Upload" }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByText(/happy with this photo\?/i)).toBeVisible({ timeout: 15_000 });
}

test.describe("Guest analysis journey", () => {
  test("consent gate blocks continuing without agreement", async ({ page }) => {
    await page.goto("/analysis");
    await page.getByRole("button", { name: /i agree — continue/i }).click();
    await expect(page.getByText(/consent is required/i)).toBeVisible();
  });

  test("guest completes a temporary analysis end to end", async ({ page }) => {
    await reachCaptureStep(page);
    await uploadFixture(page, VALID_FACE);
    await page.getByRole("button", { name: /analyse this photo/i }).click();

    // Full pipeline runs against the local API.
    await expect(page.getByText(/estimated undertone/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/why this result/i)).toBeVisible();
    await expect(page.getByText(/confidence/i).first()).toBeVisible();
    // Palette renders for guests via the public season endpoint.
    await expect(page.getByText(/your colours to explore/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Core colours" })).toBeVisible();
    // Honest disclaimer is always present; the sign-up-to-save prompt only
    // renders when Supabase auth is configured for the deployment.
    await expect(page.getByText(/styling estimates from a rule-based engine/i)).toBeVisible();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await expect(page.getByText(/guest result is not stored/i)).toBeVisible();
    }
  });

  test("a photo without a face gets a retake message", async ({ page }) => {
    await reachCaptureStep(page);
    await uploadFixture(page, NO_FACE);
    await page.getByRole("button", { name: /analyse this photo/i }).click();
    await expect(page.getByText(/cannot be analysed reliably/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /retake photo/i })).toBeVisible();
  });

  test("camera denial falls back to upload guidance", async ({ browser }) => {
    const context = await browser.newContext();
    // Playwright ships fake media devices that auto-grant; emulate a real
    // denial deterministically instead.
    await context.addInitScript(() => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = () =>
          Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
      }
    });
    const page = await context.newPage();
    await reachCaptureStep(page);
    await page.getByRole("button", { name: /enable camera/i }).click();

    // Designed fallback: denial switches straight to the Upload tab, where
    // the flow continues without a camera. (Camera-tab state intentionally
    // resets on tab switch — remounting also guarantees tracks are stopped.)
    await expect(page.getByText(/drag a photo here or browse/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("tab", { name: "Upload" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await context.close();
  });
});
