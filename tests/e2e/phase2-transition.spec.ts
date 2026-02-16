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

test("Phase 3 skip defers project handoff until Phase 2 intro is dismissed", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("e2e-skip-phase3")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("e2e-skip-phase3").click({ force: true });

  const phase2Intro = page.getByTestId("phase2-intro-modal");
  const projectBoardTitle = page.getByText("Project Board", { exact: true });
  const revealTitle = page.getByText("New Empire Contract", { exact: true });
  await expect(phase2Intro).toBeVisible({ timeout: 15_000 });
  await expect(projectBoardTitle).toBeHidden();
  await expect(revealTitle).toBeHidden();

  await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });
  await expect(phase2Intro).toBeHidden({ timeout: 10_000 });
  await expect
    .poll(async () => {
      const boardVisible = await projectBoardTitle
        .isVisible()
        .catch(() => false);
      const revealVisible = await revealTitle.isVisible().catch(() => false);
      return boardVisible || revealVisible;
    })
    .toBe(true);
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
    await expect(phase2Intro).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("phase2-intro-continue").click({ timeout: 10_000 });
    await expect(phase2Intro).toBeHidden({ timeout: 10_000 });

    await page.getByText("Shop", { exact: true }).click({ timeout: 10_000 });
    await expect(page.getByText("Upgrades", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });
});
