import { expect, test } from "@playwright/test";

const widths = [320, 375, 390, 430, 768, 1024, 1280];
const themes = ["light", "dark"] as const;

for (const theme of themes) {
  for (const width of widths) {
    test(`${width}px ${theme} has no horizontal page scroll`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((preference) => {
        localStorage.setItem("atlas_theme", preference);
      }, theme);
      await page.goto("/");
      await expect(page.locator("#root > *").first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const isDark = await page.locator("html").evaluate((element) => element.classList.contains("dark"));
      expect(isDark).toBe(theme === "dark");

      const widths = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(widths.document, "document must not extend past the viewport").toBeLessThanOrEqual(widths.viewport);
      expect(widths.body, "body must not extend past the viewport").toBeLessThanOrEqual(widths.viewport);

      await page.screenshot({
        path: testInfo.outputPath(`${theme}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    });
  }
}
