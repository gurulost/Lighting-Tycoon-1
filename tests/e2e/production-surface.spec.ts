import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });
test.skip(
  process.env.PLAYWRIGHT_RELEASE_CHANNEL !== "production",
  "Production-surface assertions run against the dedicated production build.",
);

test("production build exposes no tester controls", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("e2e-skip-phase2")).toHaveCount(0);
  await expect(page.getByTestId("e2e-skip-phase3")).toHaveCount(0);
  await expect(page.getByTestId("playtest-session-banner")).toHaveCount(0);

  const settingsButton = page.getByTestId("settings-button");
  await expect(settingsButton).toBeVisible({ timeout: 20_000 });
  // This test inspects the production Settings surface, while first-run story
  // choreography is independently covered by the interaction suites.
  await settingsButton.evaluate((element: HTMLElement) => element.click());
  await expect(page.getByTestId("settings-modal")).toBeVisible();
  await expect(page.getByTestId("settings-open-playtest-lab")).toHaveCount(0);
  await expect(page.getByTestId("playtest-lab-modal")).toHaveCount(0);
});
