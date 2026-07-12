import path from "node:path";

import { expect, test } from "@playwright/test";

test.skip(
  process.env.PLAYWRIGHT_VISUAL_REVIEW !== "1",
  "Screenshot review runs only through the dedicated visual-review command.",
);

const outputDir = path.resolve("output/playwright/automated-first-review");

test("captures reachable Playtest Lab layouts across target viewports", async ({
  page,
}) => {
  const viewports = [
    { name: "narrow", width: 320, height: 568 },
    { name: "phone", width: 390, height: 844 },
    { name: "tablet", width: 768, height: 1024 },
  ];

  await page.setViewportSize(viewports[0]);
  await page.goto("/");
  await expect(page.getByTestId("e2e-skip-phase2")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("e2e-skip-phase2").click({ force: true });
  await expect(page.getByTestId("playtest-session-banner")).toBeVisible({
    timeout: 15_000,
  });
  const phase2Intro = page.getByTestId("phase2-intro-modal");
  if (await phase2Intro.isVisible().catch(() => false)) {
    await page.getByTestId("phase2-intro-continue").click();
    await expect(phase2Intro).toBeHidden();
  }
  const ordersModal = page.getByTestId("orders-modal");
  if (await ordersModal.isVisible().catch(() => false)) {
    await page.getByTestId("orders-modal-close").click();
    await expect(ordersModal).toBeHidden();
  }

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.getByTestId("playtest-banner-change").click({ force: true });
    const lab = page.getByTestId("playtest-lab-modal");
    const close = page.getByTestId("playtest-lab-close");
    await expect(lab).toBeVisible({ timeout: 10_000 });
    await expect(close).toBeVisible();
    await page.waitForTimeout(450);
    const closeBox = await close.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox?.x).toBeGreaterThanOrEqual(0);
    expect(closeBox?.y).toBeGreaterThanOrEqual(0);
    expect((closeBox?.x ?? 0) + (closeBox?.width ?? 0)).toBeLessThanOrEqual(
      viewport.width,
    );
    expect((closeBox?.y ?? 0) + (closeBox?.height ?? 0)).toBeLessThanOrEqual(
      viewport.height,
    );
    await page.screenshot({
      path: path.join(outputDir, `playtest-lab-${viewport.name}.png`),
      fullPage: true,
    });
    await close.click();
    await expect(lab).toBeHidden();
  }
});
