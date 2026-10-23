import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function enterPhase(page: Page, phase: 2 | 3) {
  await page.goto("/");
  await expect(page.getByTestId(`e2e-skip-phase${phase}`)).toBeVisible({
    timeout: 15000,
  });
  await page.getByTestId(`e2e-skip-phase${phase}`).click({ force: true });
  await expect(page.getByTestId("playtest-session-banner")).toBeVisible();
  const dismissIds = [
    "phase2-intro-continue",
    "phase3-intro-continue",
    "phase2-contracts-brief-continue",
    "phase3-hearing-lobby-back",
    "phase3-ratify-ready-dismiss",
    "orders-modal-close",
    "council-modal-close",
    "project-board-modal-close",
    "project-reveal-modal-close",
  ];
  for (let pass = 0; pass < 12; pass++) {
    await page.waitForTimeout(200);
    for (const id of dismissIds) {
      const control = page.getByTestId(id);
      if (await control.isVisible().catch(() => false)) {
        await control.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(200);
      }
    }
  }
  await expect(page.getByTestId("settings-button")).toBeVisible();
}

for (const phase of [2, 3] as const) {
  test(`phase ${phase} HUD/navigation remain reachable across narrow and resized layouts`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterPhase(page, phase);
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(page.getByTestId("settings-button")).toBeInViewport();
      const cashBox = await page.getByTestId("currency-cash").boundingBox();
      const researchBox = await page
        .getByTestId("currency-research")
        .boundingBox();
      const settingsBox = await page
        .getByTestId("settings-button")
        .boundingBox();
      expect(cashBox).not.toBeNull();
      expect(researchBox).not.toBeNull();
      expect(settingsBox).not.toBeNull();
      expect(researchBox!.x + researchBox!.width).toBeLessThanOrEqual(
        viewport.width,
      );
      if (viewport.width < 520) {
        expect(researchBox!.y + researchBox!.height).toBeLessThanOrEqual(
          settingsBox!.y,
        );
      }
      if (viewport.width < 360) {
        const goalsBox = await page
          .getByTestId("phase-goals-card")
          .boundingBox();
        const objectiveBox = await page
          .getByTestId("phase-objective-card")
          .boundingBox();
        expect(goalsBox!.height).toBeGreaterThan(44);
        expect(goalsBox!.y + goalsBox!.height).toBeLessThanOrEqual(
          objectiveBox!.y,
        );
      }
      const navigation = page.getByTestId("workshop-navigation");
      await expect(navigation).toBeInViewport();
      const collapse = page.getByRole("button", {
        name: "Collapse HUD",
        exact: true,
      });
      await collapse.click();
      await expect(page.getByTestId("hud-details-scroll")).toBeHidden();
      await page
        .getByRole("button", { name: "Expand HUD", exact: true })
        .click();
      await expect(page.getByTestId("hud-details-scroll")).toBeVisible();
      const boardViewport = await page
        .getByTestId("workshop-board-scroll")
        .boundingBox();
      expect(boardViewport!.height).toBeGreaterThan(44);
      for (const id of phase === 3
        ? ["nav-orders", "nav-projects", "nav-council", "nav-shop", "nav-rd"]
        : ["nav-orders", "nav-projects", "nav-shop", "nav-rd"]) {
        const button = page.getByTestId(id);
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
        await expect(button).toHaveAttribute("role", "button");
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
      const goals = page.getByTestId("goals-button");
      await goals.scrollIntoViewIfNeeded();
      await expect(goals).toBeInViewport();
      await goals.focus();
      await goals.press("Enter");
      await expect(
        page.getByRole("button", { name: "Close Goals" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Close Goals" }).click();
      await expect(
        page.getByRole("button", { name: "Close Goals" }),
      ).toBeHidden();
      await page.waitForTimeout(250);
      const objective = page.getByTestId("phase-objective-action");
      await objective.scrollIntoViewIfNeeded();
      const title = objective.locator("[dir=auto]").filter({ hasText: /./ });
      expect(await title.count()).toBeGreaterThan(0);
      await page.getByTestId("board-utilities").scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", { name: /^Backpack\./ }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: /^Backpack\./ })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", { name: /^Backpack\./ }),
      ).toBeInViewport({ ratio: 0.99 });
      await page
        .getByRole("button", { name: /^Recycle help\./ })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", { name: /^Recycle help\./ }),
        // Allow subpixel scroll rounding (<1px), not partial controls.
      ).toBeInViewport({ ratio: 0.99 });
      await page.screenshot({
        path: path.resolve(
          `output/hud-review/phase${phase}-${viewport.width}x${viewport.height}-utilities.png`,
        ),
      });
      await page.getByTestId("workbench-station").scrollIntoViewIfNeeded();
      await page.getByTestId("workbench-station").click();
      await expect(
        page.getByRole("button", { name: "Close Suppliers" }),
      ).toBeInViewport();
      await page.getByRole("button", { name: "Close Suppliers" }).click();
      await expect(
        page.getByRole("button", { name: "Close Suppliers" }),
      ).toBeHidden();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: path.resolve(
          `output/hud-review/phase${phase}-${viewport.width}x${viewport.height}-board.png`,
        ),
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  });
}

test("board moves, keyboard backpack transfers and Undo survive board scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await enterPhase(page, 2);
  const readSave = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("lighting_tycoon_playtest_state_v1")!)
          .state,
    );
  await expect.poll(async () => (await readSave())?.board?.[1]?.tier).toBe(4);
  const partId = (await readSave()).board[1].id;
  await page
    .getByRole("button", { name: /^Recycle help\./ })
    .scrollIntoViewIfNeeded();
  await page.getByTestId("board-tile-1").scrollIntoViewIfNeeded();
  const source = (await page.getByTestId("board-tile-1").boundingBox())!;
  const target = (await page.getByTestId("board-tile-2").boundingBox())!;
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    source.x + source.width / 2 + 8,
    source.y + source.height / 2,
    { steps: 4 },
  );
  await page.mouse.move(
    target.x + target.width / 2,
    target.y + target.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect.poll(async () => (await readSave()).board[2]?.id).toBe(partId);
  const boardPart = page.getByTestId("board-tile-2").getByRole("button");
  await boardPart.focus();
  await boardPart.press("Enter");
  const store = page.getByRole("button", {
    name: "Move to Backpack",
    exact: true,
  });
  await store.scrollIntoViewIfNeeded();
  await store.click();
  await expect(store).toBeHidden();
  await expect
    .poll(async () =>
      (await readSave()).backpack.some(
        (part: { id: string } | null) => part?.id === partId,
      ),
    )
    .toBe(true);
  const storedPart = page.getByRole("button", {
    name: "Tier 4 open-standard part, compatible",
    exact: true,
  });
  await storedPart.scrollIntoViewIfNeeded();
  await storedPart.focus();
  await storedPart.press("Enter");
  await expect
    .poll(async () =>
      (await readSave()).backpack.some(
        (part: { id: string } | null) => part?.id === partId,
      ),
    )
    .toBe(false);
  const undo = page.getByRole("button", {
    name: "Undo last move",
    exact: true,
  });
  await undo.scrollIntoViewIfNeeded();
  await undo.click();
  await expect
    .poll(async () =>
      (await readSave()).backpack.some(
        (part: { id: string } | null) => part?.id === partId,
      ),
    )
    .toBe(true);
});
