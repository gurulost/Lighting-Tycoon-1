import { test, expect } from "@playwright/test";

test("opens the settings modal", async ({ page }) => {
  await page.goto("/");

  const skipButton = page.getByTestId("tutorial-skip");

  for (let i = 0; i < 16; i += 1) {
    const isVisible = await skipButton.isVisible().catch(() => false);
    if (!isVisible) break;

    await skipButton.click({ force: true, timeout: 1_500 }).catch(() => {});
    await page.waitForTimeout(80);
    await skipButton.click({ force: true, timeout: 1_500 }).catch(() => {});
    await page.waitForTimeout(220);
  }
  await expect(skipButton).toBeHidden({ timeout: 20_000 });

  const settingsButton = page.getByTestId("settings-button");
  await expect(settingsButton).toBeVisible({ timeout: 30_000 });

  await settingsButton.click({ timeout: 5_000 }).catch(async () => {
    await page.waitForTimeout(250);
    await settingsButton.click({ force: true });
  });

  await expect(page.getByTestId("settings-modal")).toBeVisible();
});
