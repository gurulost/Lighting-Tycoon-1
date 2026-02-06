import { test, expect } from "@playwright/test";

test("opens the settings modal", async ({ page }) => {
  await page.goto("/");

  const skipButton = page.getByTestId("tutorial-skip");

  for (let i = 0; i < 6; i += 1) {
    const isVisible = await skipButton.isVisible().catch(() => false);
    if (!isVisible) break;

    const box = await skipButton.boundingBox();
    if (!box) {
      await skipButton.click({ force: true, timeout: 1_500 }).catch(() => {});
      await page.waitForTimeout(120);
      continue;
    }

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();

    await page.waitForTimeout(180);
  }

  const settingsButton = page.getByTestId("settings-button");
  await expect(settingsButton).toBeVisible({ timeout: 30_000 });

  await settingsButton.click();

  await expect(page.getByTestId("settings-modal")).toBeVisible();
});
