import { test, expect, type Page } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
});

async function bootstrapInteractiveState(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("e2e-skip-phase2")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("e2e-skip-phase2").click({ force: true });

  const phase2Intro = page.getByTestId("phase2-intro-modal");
  if (await phase2Intro.isVisible().catch(() => false)) {
    await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });
    await expect(phase2Intro).toBeHidden({ timeout: 10_000 });
  }

  const ordersModal = page.getByTestId("orders-modal");
  if (await ordersModal.isVisible().catch(() => false)) {
    await page.getByTestId("orders-modal-close").click({ timeout: 10_000 });
    await expect(ordersModal).toBeHidden({ timeout: 10_000 });
  }
}

async function applyPlaytestPreset(page: Page, presetId: string) {
  await page.getByTestId("settings-button").click({ timeout: 10_000 });
  const settingsModal = page.getByTestId("settings-modal");
  await expect(settingsModal).toBeVisible({ timeout: 10_000 });

  await page
    .getByTestId("settings-open-playtest-lab")
    .click({ timeout: 10_000 });
  const presetModal = page.getByTestId("playtest-lab-modal");
  await expect(presetModal).toBeVisible({ timeout: 10_000 });

  await page
    .getByTestId(`playtest-preset-${presetId}`)
    .click({ timeout: 10_000 });
  await page.getByTestId("playtest-lab-apply").click({ timeout: 10_000 });
  await expect(presetModal).toBeHidden({ timeout: 10_000 });
  await expect(settingsModal).toBeHidden({ timeout: 10_000 });
}

async function setPhase3OnboardingVariant(
  page: Page,
  variant: "control" | "phase3_handoff_only" | "build_default",
) {
  await page
    .getByTestId("settings-button")
    .click({ timeout: 10_000, force: true });
  const settingsModal = page.getByTestId("settings-modal");
  await expect(settingsModal).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("settings-open-playtest-lab").click();
  const lab = page.getByTestId("playtest-lab-modal");
  await expect(lab).toBeVisible({ timeout: 10_000 });
  const variantButton = page.getByTestId(`playtest-variant-${variant}`);
  await variantButton.scrollIntoViewIfNeeded();
  await variantButton.click({ timeout: 10_000 });
  await page.getByTestId("playtest-lab-close").click({ timeout: 10_000 });
  await expect(lab).toBeHidden({ timeout: 10_000 });
}

test("Phase 3 handoff highlights campaign activation and first Set Active action", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("e2e-skip-phase3")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("e2e-skip-phase3").click({ force: true });

  await expect(page.getByTestId("phase2-intro-modal")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });
  await expect(page.getByTestId("phase2-contracts-brief-modal")).toBeVisible({
    timeout: 10_000,
  });
  await page
    .getByTestId("phase2-contracts-brief-continue")
    .click({ timeout: 10_000 });
  await expect(page.getByTestId("phase3-intro-modal")).toBeVisible({
    timeout: 10_000,
  });
  await page.getByTestId("phase3-intro-continue").click({ timeout: 10_000 });

  const councilModal = page.getByTestId("council-modal");
  await expect(councilModal).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText("Start here: set this as your active campaign.", {
      exact: true,
    }),
  ).toBeVisible({ timeout: 10_000 });

  await page.locator('[data-testid^="council-set-active-"]').first().click({
    timeout: 10_000,
  });
  await expect(
    page.getByText("Active campaign tracking progress.", { exact: true }),
  ).toBeVisible({ timeout: 10_000 });
});

test("Phase 3 hearing recovery guides to Council and exposes Orders/Projects recovery CTAs", async ({
  page,
}) => {
  await bootstrapInteractiveState(page);
  await applyPlaytestPreset(page, "phase3_hearing_recovery");

  const hearingIntro = page.getByTestId("phase3-hearing-intro-modal");
  await expect(hearingIntro).toBeVisible({ timeout: 15_000 });
  await page
    .getByTestId("phase3-hearing-clear-by-play")
    .click({ timeout: 10_000 });
  await expect(hearingIntro).toBeHidden({ timeout: 10_000 });

  const councilClose = page.getByTestId("council-modal-close");
  await expect(councilClose).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("council-hearing-entry-hint")).toBeVisible({
    timeout: 10_000,
  });
  await councilClose.click({ timeout: 10_000 });
  await expect(councilClose).toBeHidden({ timeout: 10_000 });

  await page.getByText("Orders", { exact: true }).click({ timeout: 10_000 });
  const ordersModal = page.getByTestId("orders-modal");
  await expect(ordersModal).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("orders-hearing-open-council")).toBeVisible({
    timeout: 10_000,
  });
  await page
    .getByTestId("orders-hearing-open-council")
    .click({ timeout: 10_000 });
  await expect(councilClose).toBeVisible({ timeout: 10_000 });
  await councilClose.click({ timeout: 10_000 });
  await expect(councilClose).toBeHidden({ timeout: 10_000 });

  await page.getByText("Projects", { exact: true }).click({ timeout: 10_000 });
  await expect(page.getByTestId("project-board-modal")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("projects-hearing-open-council")).toBeVisible({
    timeout: 10_000,
  });
  await page
    .getByTestId("projects-hearing-open-council")
    .click({ timeout: 10_000 });
  await expect(councilClose).toBeVisible({ timeout: 10_000 });
});

test("Phase 3 hearing lobby-back path clears hearing and leaves taps responsive", async ({
  page,
}) => {
  await bootstrapInteractiveState(page);
  await applyPlaytestPreset(page, "phase3_hearing_recovery");

  const hearingIntro = page.getByTestId("phase3-hearing-intro-modal");
  await expect(hearingIntro).toBeVisible({ timeout: 15_000 });
  await page
    .getByTestId("phase3-hearing-lobby-back")
    .click({ timeout: 10_000 });
  await expect(hearingIntro).toBeHidden({ timeout: 10_000 });

  const councilClose = page.getByTestId("council-modal-close");
  await expect(councilClose).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("council-hearing-lobby-back")).toBeVisible({
    timeout: 10_000,
  });
  await page
    .getByTestId("council-hearing-lobby-back")
    .click({ timeout: 10_000 });
  await expect(page.getByText(/No hearings active/i)).toBeVisible({
    timeout: 10_000,
  });
  await councilClose.click({ timeout: 10_000 });
  await expect(councilClose).toBeHidden({ timeout: 10_000 });

  await page.getByText("Shop", { exact: true }).click({ timeout: 10_000 });
  await expect(page.getByText("Upgrades", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});

test("Phase 3 ratify-ready reminder hands off to Orders", async ({ page }) => {
  await bootstrapInteractiveState(page);
  await applyPlaytestPreset(page, "phase3_ratify_ready");

  const ratifyReadyModal = page.getByTestId("phase3-ratify-ready-modal");
  await expect(ratifyReadyModal).toBeVisible({ timeout: 10_000 });

  await page
    .getByTestId("phase3-ratify-ready-open-orders")
    .click({ timeout: 10_000 });

  const ordersModal = page.getByTestId("orders-modal");
  await expect(ordersModal).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText("Council Showcase: Residential Open Standard", {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 10_000,
  });
});

test("Phase 3 ratify reminder dismiss path releases global taps", async ({
  page,
}) => {
  await bootstrapInteractiveState(page);
  await applyPlaytestPreset(page, "phase3_ratify_ready");

  const ratifyReadyModal = page.getByTestId("phase3-ratify-ready-modal");
  await expect(ratifyReadyModal).toBeVisible({ timeout: 10_000 });
  await page
    .getByTestId("phase3-ratify-ready-dismiss")
    .click({ timeout: 10_000 });
  await expect(ratifyReadyModal).toBeHidden({ timeout: 10_000 });

  await page.getByText("Shop", { exact: true }).click({ timeout: 10_000 });
  await expect(page.getByText("Upgrades", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});

test("Phase 3 ratify reminder backdrop dismiss releases global taps", async ({
  page,
}) => {
  await bootstrapInteractiveState(page);
  await applyPlaytestPreset(page, "phase3_ratify_ready");

  const ratifyReadyModal = page.getByTestId("phase3-ratify-ready-modal");
  await expect(ratifyReadyModal).toBeVisible({ timeout: 10_000 });
  await page
    .getByTestId("phase3-ratify-ready-backdrop")
    .click({ position: { x: 10, y: 10 }, timeout: 10_000 });
  await expect(ratifyReadyModal).toBeHidden({ timeout: 10_000 });

  await page.getByText("Shop", { exact: true }).click({ timeout: 10_000 });
  await expect(page.getByText("Upgrades", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});

test("Phase 3 control variant skips the Phase 3 intro takeover", async ({
  page,
}) => {
  await bootstrapInteractiveState(page);
  await setPhase3OnboardingVariant(page, "control");
  await applyPlaytestPreset(page, "phase3_council_live");

  await expect(page.getByTestId("phase3-intro-modal")).toBeHidden({
    timeout: 4_000,
  });
});

test("Phase 3 handoff-only variant suppresses adaptive hearing intro modal", async ({
  page,
}) => {
  await bootstrapInteractiveState(page);
  await setPhase3OnboardingVariant(page, "phase3_handoff_only");
  await applyPlaytestPreset(page, "phase3_hearing_recovery");

  await expect(page.getByTestId("phase3-hearing-intro-modal")).toBeHidden({
    timeout: 4_000,
  });
  await page.getByText("Shop", { exact: true }).click({ timeout: 10_000 });
  await expect(page.getByText("Upgrades", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});
