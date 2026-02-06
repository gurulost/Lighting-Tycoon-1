import { test, expect } from "@playwright/test";
import { openFreshGame } from "./helpers/lightingTycoon";

test("opens the settings modal", async ({ page }) => {
  await openFreshGame(page);

  const settingsButton = page.getByTestId("settings-button");
  await expect(settingsButton).toBeVisible({ timeout: 30_000 });

  await settingsButton.click();

  await expect(page.getByTestId("settings-modal")).toBeVisible();
});
