import { test, expect } from "@playwright/test";

test("Phase 2 skip shows full-screen intro and routes to Orders objective", async ({
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

  await expect(page.getByTestId("orders-modal")).toBeVisible({
    timeout: 15_000,
  });
});

test("Phase 3 skip chains Phase 2 and Phase 3 onboarding handoff", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("e2e-skip-phase3")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("e2e-skip-phase3").click({ force: true });

  const phase2Intro = page.getByTestId("phase2-intro-modal");
  const contractsBrief = page.getByTestId("phase2-contracts-brief-modal");
  const phase3Intro = page.getByTestId("phase3-intro-modal");
  const councilTitle = page.getByText("Standards Council", { exact: true });
  await expect(phase2Intro).toBeVisible({ timeout: 15_000 });
  await expect(contractsBrief).toBeHidden();
  await expect(phase3Intro).toBeHidden();

  await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });
  await expect(phase2Intro).toBeHidden({ timeout: 10_000 });
  await expect(contractsBrief).toBeVisible({ timeout: 10_000 });
  await expect(phase3Intro).toBeHidden();

  await page
    .getByTestId("phase2-contracts-brief-continue")
    .click({ timeout: 10_000 });
  await expect(contractsBrief).toBeHidden({ timeout: 10_000 });
  await expect(phase3Intro).toBeVisible({ timeout: 10_000 });

  await page.getByTestId("phase3-intro-continue").click({ timeout: 10_000 });
  await expect(phase3Intro).toBeHidden({ timeout: 10_000 });
  await expect(councilTitle).toBeVisible({ timeout: 10_000 });
});

test("Phase 2 playbook guide deep-links into glossary playbook section", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("e2e-skip-phase2")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("e2e-skip-phase2").click({ force: true });
  await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });

  const ordersModal = page.getByTestId("orders-modal");
  const ordersVisible = await ordersModal
    .waitFor({ state: "visible", timeout: 6_000 })
    .then(() => true)
    .catch(() => false);
  if (ordersVisible) {
    await page.getByTestId("orders-modal-close").click({ timeout: 10_000 });
    await expect(ordersModal).toBeHidden({ timeout: 10_000 });
  }

  const playbookHelp = page.getByTestId("phase-playbook-help");
  await expect(playbookHelp).toBeVisible({ timeout: 10_000 });
  await playbookHelp.click({ timeout: 10_000 });

  await expect(page.getByText("Glossary", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("glossary-section-phase-playbook")).toBeVisible(
    { timeout: 10_000 },
  );
});

test.describe("Tap Responsiveness", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test("Phase 2 split objective row stays side-by-side and bounded on phone widths", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("e2e-skip-phase2")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("e2e-skip-phase2").click({ force: true });
    await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });

    const goalsCard = page.getByTestId("phase-goals-card");
    const objectiveCard = page.getByTestId("phase-objective-card");
    await expect(goalsCard).toBeVisible({ timeout: 10_000 });
    await expect(objectiveCard).toBeVisible({ timeout: 10_000 });

    const goalsBounds = await goalsCard.boundingBox();
    const objectiveBounds = await objectiveCard.boundingBox();
    expect(goalsBounds).not.toBeNull();
    expect(objectiveBounds).not.toBeNull();

    if (!goalsBounds || !objectiveBounds) return;
    expect(Math.abs(goalsBounds.y - objectiveBounds.y)).toBeLessThan(14);
    expect(objectiveBounds.height).toBeLessThanOrEqual(goalsBounds.height + 10);
  });

  test("Phase 2 objective row never blocks global taps on narrow layouts", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("e2e-skip-phase2")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("e2e-skip-phase2").click({ force: true });

    const phase2Intro = page.getByTestId("phase2-intro-modal");
    const ordersModal = page.getByTestId("orders-modal");
    await expect(phase2Intro).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });
    await expect(phase2Intro).toBeHidden({ timeout: 10_000 });
    if (await ordersModal.isVisible().catch(() => false)) {
      await page.getByTestId("orders-modal-close").click({ timeout: 10_000 });
      await expect(ordersModal).toBeHidden({ timeout: 10_000 });
    }

    await page.getByText("Shop", { exact: true }).click({ timeout: 10_000 });
    await expect(page.getByText("Upgrades", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });
});
