import { test, expect, type Page } from "@playwright/test";

async function bootstrapInteractiveState(page: Page) {
  await page.goto("/");

  const e2eSkipPhase2 = page.getByTestId("e2e-skip-phase2");
  const hasE2ESkip = await e2eSkipPhase2
    .waitFor({ state: "visible", timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (hasE2ESkip) {
    await e2eSkipPhase2.click({ force: true, timeout: 10_000 });
    const phase2Intro = page.getByTestId("phase2-intro-modal");
    if (await phase2Intro.isVisible().catch(() => false)) {
      await page
        .getByTestId("phase2-intro-continue")
        .click({ timeout: 10_000 });
      await expect(phase2Intro).toBeHidden({ timeout: 10_000 });
    }
    const ordersModal = page.getByTestId("orders-modal");
    if (await ordersModal.isVisible().catch(() => false)) {
      await page.getByTestId("orders-modal-close").click({ timeout: 10_000 });
      await expect(ordersModal).toBeHidden({ timeout: 10_000 });
    }
    return;
  }

  const skipButton = page.getByTestId("tutorial-skip");
  const settingsButton = page.getByTestId("settings-button");
  for (let i = 0; i < 30; i += 1) {
    const settingsReady = await settingsButton.isVisible().catch(() => false);
    if (settingsReady) break;

    const isVisible = await skipButton.isVisible().catch(() => false);
    if (isVisible) {
      await skipButton.click({ force: true, timeout: 1_500 }).catch(() => {});
      await page.waitForTimeout(80);
      await skipButton.click({ force: true, timeout: 1_500 }).catch(() => {});
    }
    await page.waitForTimeout(220);
  }
  await expect(settingsButton).toBeVisible({ timeout: 30_000 });
}

test.describe("Settings Modal", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test("phase 2 intro handoff does not steal focus back from settings", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("e2e-skip-phase2")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("e2e-skip-phase2").click({ force: true });

    const phase2Intro = page.getByTestId("phase2-intro-modal");
    await expect(phase2Intro).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });

    const ordersModal = page.getByTestId("orders-modal");
    const ordersVisible = await ordersModal
      .waitFor({ state: "visible", timeout: 1_500 })
      .then(() => true)
      .catch(() => false);
    if (ordersVisible) {
      await page.getByTestId("orders-modal-close").click({ timeout: 10_000 });
      await expect(ordersModal).toBeHidden({ timeout: 10_000 });
    }

    await page
      .getByTestId("settings-button")
      .click({ timeout: 10_000, force: true });

    const settingsModal = page.getByTestId("settings-modal");
    await expect(settingsModal).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1_500);
    await expect(settingsModal).toBeVisible({ timeout: 10_000 });
    await expect(ordersModal).toBeHidden({ timeout: 10_000 });
  });

  test("opens and closes settings via reachable close button", async ({
    page,
  }) => {
    await bootstrapInteractiveState(page);
    const settingsButton = page.getByTestId("settings-button");
    await expect(settingsButton).toBeVisible({ timeout: 30_000 });
    await settingsButton.click({ timeout: 10_000 });

    const settingsModal = page.getByTestId("settings-modal");
    await expect(settingsModal).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("settings-modal-close").click({ timeout: 10_000 });
    await expect(settingsModal).toBeHidden({ timeout: 10_000 });
  });

  test("dialog flow leaves screen responsive after closing", async ({
    page,
  }) => {
    await bootstrapInteractiveState(page);
    await page.getByTestId("settings-button").click({ timeout: 10_000 });

    const settingsModal = page.getByTestId("settings-modal");
    await expect(settingsModal).toBeVisible({ timeout: 10_000 });

    await page
      .getByTestId("settings-playtest-presets")
      .click({ timeout: 10_000 });
    const presetsModal = page.getByTestId("playtest-preset-modal");
    await expect(presetsModal).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("playtest-preset-close").click({ timeout: 10_000 });
    await expect(presetsModal).toBeHidden({ timeout: 10_000 });

    await page.getByTestId("settings-modal-close").click({ timeout: 10_000 });
    await expect(settingsModal).toBeHidden({ timeout: 10_000 });

    await page.getByText("Shop", { exact: true }).click({ timeout: 10_000 });
    await expect(page.getByText("Upgrades", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Phase 3 onboarding mode can be changed in playtest settings", async ({
    page,
  }) => {
    await bootstrapInteractiveState(page);
    await page.getByTestId("settings-button").click({ timeout: 10_000 });

    const settingsModal = page.getByTestId("settings-modal");
    await expect(settingsModal).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByTestId("settings-phase3-onboarding-mode"),
    ).toBeVisible({
      timeout: 10_000,
    });

    await page
      .getByTestId("settings-phase3-variant-control")
      .click({ timeout: 10_000 });
    await expect(
      page.getByTestId("settings-phase3-variant-current"),
    ).toContainText("Control override active", { timeout: 10_000 });

    await page
      .getByTestId("settings-phase3-variant-build_default")
      .click({ timeout: 10_000 });
    await expect(
      page.getByTestId("settings-phase3-variant-current"),
    ).toContainText("via build default", { timeout: 10_000 });
  });
});
