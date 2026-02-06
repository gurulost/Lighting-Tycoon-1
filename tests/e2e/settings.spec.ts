import { test, expect } from "@playwright/test";

test("opens the settings modal", async ({ page }) => {
  await page.goto("/");

  const skipButton = page.getByTestId("tutorial-skip");
  for (let i = 0; i < 8; i += 1) {
    const isVisible = await skipButton
      .isVisible({ timeout: 1_000 })
      .catch(() => false);
    if (!isVisible) break;
    await skipButton.click({ force: true, timeout: 1_500 }).catch(() => {});
    await page.waitForTimeout(120);
  }

  await expect(skipButton).toBeHidden({ timeout: 10_000 });

  const settingsButton = page.getByTestId("settings-button");
  await expect(settingsButton).toBeVisible({ timeout: 30_000 });

  await settingsButton.click();

  await expect(page.getByTestId("settings-modal")).toBeVisible();
});
