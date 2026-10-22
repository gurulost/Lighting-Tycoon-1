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
      .getByTestId("settings-open-playtest-lab")
      .click({ timeout: 10_000 });
    const presetsModal = page.getByTestId("playtest-lab-modal");
    await expect(presetsModal).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("playtest-lab-close").click({ timeout: 10_000 });
    await expect(presetsModal).toBeHidden({ timeout: 10_000 });

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

    await page.getByTestId("settings-open-playtest-lab").click();
    const lab = page.getByTestId("playtest-lab-modal");
    await expect(lab).toBeVisible({ timeout: 10_000 });
    await page
      .getByTestId("playtest-variant-control")
      .click({ timeout: 10_000 });
    await page
      .getByTestId("playtest-variant-build_default")
      .click({ timeout: 10_000 });
    await expect(lab).toBeVisible();
  });

  test("Settings accessibility and Lab controls survive live tablet and split-view resizing", async ({
    page,
  }, testInfo) => {
    await bootstrapInteractiveState(page);
    await page.getByTestId("settings-button").click();
    await expect(
      page.getByRole("switch", { name: "Sound Effects", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Settings", exact: true }),
    ).toHaveCount(0);
    for (const viewport of [
      { width: 1024, height: 1366 },
      { width: 1366, height: 1024 },
      { width: 320, height: 700 },
    ]) {
      await page.setViewportSize(viewport);
      const close = page.getByRole("button", {
        name: "Close Settings",
        exact: true,
      });
      await expect(close).toBeInViewport();
      const toggle = page.getByRole("switch", {
        name: "Enhanced Part Cues",
        exact: true,
      });
      await toggle.scrollIntoViewIfNeeded();
      await expect(toggle).toBeInViewport();
      await toggle.click();
      await toggle.click();
    }
    await page.getByTestId("settings-open-playtest-lab").click();
    for (const viewport of [
      { width: 1366, height: 1024 },
      { width: 507, height: 900 },
      { width: 320, height: 700 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(
        page.getByRole("button", { name: "Close Playtest Lab" }),
      ).toBeInViewport();
      const lastScenario = page.getByTestId(
        "playtest-preset-phase3_ratify_ready",
      );
      await lastScenario.scrollIntoViewIfNeeded();
      await lastScenario.click();
      await expect(page.getByTestId("playtest-lab-apply")).toBeInViewport();
      await page.screenshot({
        path: testInfo.outputPath(
          `lab-${viewport.width}x${viewport.height}.png`,
        ),
      });
    }
    await page.getByRole("button", { name: "Close Playtest Lab" }).click();
    // Wait for the native-web modal's exit transition and focus trap to unmount
    // before targeting the workshop behind it.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Settings", exact: true }),
    ).toBeVisible();
    const settingsButton = page.getByRole("button", {
      name: "Settings",
      exact: true,
    });
    await settingsButton.focus();
    await expect(settingsButton).toBeFocused();
    await page.keyboard.press("Enter");
    const settings = page.getByTestId("settings-modal");
    await expect(settings).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close Settings" }).focus();
    await page.keyboard.press("Tab");
    await expect(settings.locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(settings).toBeHidden();
    await expect(settingsButton).toBeFocused();
  });
});
