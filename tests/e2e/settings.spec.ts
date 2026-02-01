import { test, expect } from "@playwright/test";

test("opens the settings modal", async ({ page }) => {
  await page.goto("/");

  const skipPrompt = page.getByText(/Skip Tutorial|Tap again to skip/, {
    exact: true,
  });

  for (let i = 0; i < 2; i += 1) {
    if (await skipPrompt.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await skipPrompt.click();
    }
  }

  await expect(skipPrompt).toBeHidden({ timeout: 10_000 });

  const settingsButton = page.getByTestId("settings-button");
  await expect(settingsButton).toBeVisible({ timeout: 30_000 });

  await settingsButton.click();

  await expect(page.getByTestId("settings-modal")).toBeVisible();
});
