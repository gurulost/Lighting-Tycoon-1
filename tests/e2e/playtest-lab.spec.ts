import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

async function dismissBlockingHandoff(page: Page) {
  // A preset can intentionally enqueue several visible onboarding/project
  // handoffs. Dismiss each real affordance in order before exercising the
  // persistent banner beneath them.
  for (let pass = 0; pass < 12; pass += 1) {
    await page.waitForTimeout(250);
    const phase2Intro = page.getByTestId("phase2-intro-modal");
    if (await phase2Intro.isVisible().catch(() => false)) {
      await page.getByTestId("phase2-intro-continue").click();
      await page.waitForTimeout(100);
    }
    const phase3Intro = page.getByTestId("phase3-intro-modal");
    if (await phase3Intro.isVisible().catch(() => false)) {
      await page.getByTestId("phase3-intro-continue").click();
      await page.waitForTimeout(100);
    }
    const contractsBrief = page.getByTestId("phase2-contracts-brief-modal");
    if (await contractsBrief.isVisible().catch(() => false)) {
      await page.getByTestId("phase2-contracts-brief-continue").click();
      await page.waitForTimeout(100);
    }
    const hearingIntro = page.getByTestId("phase3-hearing-intro-modal");
    if (await hearingIntro.isVisible().catch(() => false)) {
      await page.getByTestId("phase3-hearing-lobby-back").click();
      await page.waitForTimeout(100);
    }
    const ratifyReady = page.getByTestId("phase3-ratify-ready-modal");
    if (await ratifyReady.isVisible().catch(() => false)) {
      await page.getByTestId("phase3-ratify-ready-dismiss").click();
      await page.waitForTimeout(100);
    }
    const ordersModal = page.getByTestId("orders-modal");
    if (await ordersModal.isVisible().catch(() => false)) {
      await page.getByTestId("orders-modal-close").click();
      await page.waitForTimeout(100);
    }
    const councilModal = page.getByTestId("council-modal");
    if (await councilModal.isVisible().catch(() => false)) {
      await page.getByTestId("council-modal-close").click();
      await page.waitForTimeout(100);
    }
    const projectBoard = page.getByTestId("project-board-modal");
    if (await projectBoard.isVisible().catch(() => false)) {
      await page.getByTestId("project-board-modal-close").click();
      await page.waitForTimeout(100);
    }
    const projectRevealClose = page.getByTestId("project-reveal-modal-close");
    if (await projectRevealClose.isVisible().catch(() => false)) {
      await projectRevealClose.click();
      // The next queued offer may replace the dismissed one immediately.
      await page.waitForTimeout(100);
    }
  }
}

test("playtest sandbox survives reload and restores the unchanged main save", async ({
  page,
}) => {
  await page.goto("/");
  const skip = page.getByTestId("e2e-skip-phase2");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click({ force: true });

  const banner = page.getByTestId("playtest-session-banner");
  await expect(banner).toContainText("Phase 2 Gate Active", {
    timeout: 15_000,
  });
  const normalBaseline = await page.evaluate(() =>
    window.localStorage.getItem("lighting_tycoon_state_v1"),
  );
  expect(normalBaseline).not.toBeNull();

  await page.reload();
  await expect(banner).toContainText("Phase 2 Gate Active", {
    timeout: 15_000,
  });
  await dismissBlockingHandoff(page);
  await page.getByTestId("playtest-banner-restore").click();
  await expect(banner).toBeHidden({ timeout: 15_000 });

  const restoredNormal = await page.evaluate(() =>
    window.localStorage.getItem("lighting_tycoon_state_v1"),
  );
  expect(restoredNormal).toBe(normalBaseline);
});

test("Lab can jump backward and forward and exposes the capstone scenario", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("e2e-skip-phase3")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("e2e-skip-phase3").click({ force: true });
  await expect(page.getByTestId("playtest-session-banner")).toContainText(
    "Phase 3 Council Live",
  );
  await dismissBlockingHandoff(page);

  await page.getByTestId("playtest-banner-change").click();
  const lab = page.getByTestId("playtest-lab-modal");
  await expect(lab).toBeVisible();
  await page.getByTestId("playtest-preset-phase2_capstone_ready").click();
  await expect(lab).toContainText("First action: Open Projects");
  await page.getByTestId("playtest-lab-apply").click();
  await expect(lab).toBeHidden({ timeout: 15_000 });
  await expect(page.getByTestId("playtest-session-banner")).toContainText(
    "Phase 2 Capstone Ready",
  );
});

test("every deterministic scenario can be applied and restarted", async ({
  page,
}) => {
  const scenarios = [
    ["pre_phase2_transition", "Transition Rehearsal"],
    ["phase2_gate", "Phase 2 Gate Active"],
    ["phase2_contracts_ready", "Phase 2 Contracts Ready"],
    ["phase2_rep_gate", "Phase 2 Rep Gate"],
    ["phase2_capstone_ready", "Phase 2 Capstone Ready"],
    ["phase3_council_live", "Phase 3 Council Live"],
    ["phase3_hearing_recovery", "Phase 3 Hearing Recovery"],
    ["phase3_ratify_ready", "Phase 3 Ratify Ready"],
  ] as const;

  await page.goto("/");
  await expect(page.getByTestId("e2e-skip-phase2")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("e2e-skip-phase2").click({ force: true });
  const banner = page.getByTestId("playtest-session-banner");
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await dismissBlockingHandoff(page);

  for (const [presetId, title] of scenarios) {
    await page.getByTestId("playtest-banner-change").click();
    const lab = page.getByTestId("playtest-lab-modal");
    await expect(lab).toBeVisible({ timeout: 10_000 });
    await page.getByTestId(`playtest-preset-${presetId}`).click();
    await page.getByTestId("playtest-lab-apply").click();
    await expect(lab).toBeHidden({ timeout: 15_000 });
    await expect(banner).toContainText(title, { timeout: 15_000 });
    await dismissBlockingHandoff(page);
  }

  await page.getByTestId("playtest-banner-restart").click();
  await expect(banner).toContainText("Phase 3 Ratify Ready", {
    timeout: 15_000,
  });
});
