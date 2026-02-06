import { test, expect } from "@playwright/test";
import {
  buildPart,
  dragByTestId,
  flushLTSave,
  getLTState,
  openFreshGame,
  waitForLTIdle,
  waitForLTState,
  waitForLTRuntime,
} from "./helpers/lightingTycoon";

function emptyBoard(size: number) {
  return Array.from({ length: size }, () => null);
}

test("opens the orders modal from the orders station", async ({ page }) => {
  await openFreshGame(page);

  const ordersStation = page.getByTestId("orders-station");
  await expect(ordersStation).toBeVisible();
  await ordersStation.click();

  await expect(page.getByTestId("orders-modal")).toBeVisible();
});

test("merges two parts via drag and drop", async ({ page }) => {
  await openFreshGame(page, (state) => {
    const board = emptyBoard(state.boardSize);
    board[1] = buildPart(1, 1, "open");
    board[2] = buildPart(2, 1, "open");
    return {
      board,
      orders: [],
      highlightedOrderId: undefined,
    };
  });

  await dragByTestId(page, "board-part-1", "board-slot-2");
  await waitForLTIdle(page);

  const after = await waitForLTState(
    page,
    (state) => !!state.board[2] && state.board[2]?.tier === 2,
    12_000,
  );
  expect(after.board[1]).toBeNull();
  expect(after.board[2]).toMatchObject({ tier: 2, family: "open" });
});

test("fulfills a deterministic order and pays rewards", async ({ page }) => {
  const expectedStartingCash = 300;
  const orderPart = buildPart(1, 1, "open");
  const readyOrder = {
    id: "e2e-order-ready",
    title: "E2E Ready Order",
    type: "basic",
    requirements: [{ tier: 1, family: "open", count: 1 }],
    rewards: { cash: 15, reputation: 2, research: 1 },
  };

  await openFreshGame(page, (state) => {
    const board = emptyBoard(state.boardSize);
    board[1] = orderPart;
    return {
      board,
      orders: [readyOrder],
      highlightedOrderId: readyOrder.id,
      cash: expectedStartingCash,
      research: 10,
      reputation: 5,
    };
  });

  await page.getByTestId("orders-station").click();
  await expect(page.getByTestId("orders-modal")).toBeVisible();
  await expect(page.getByTestId("order-fulfill-0")).toBeVisible();

  await page.getByTestId("order-fulfill-0").click();
  await waitForLTIdle(page);

  const after = await waitForLTState(
    page,
    (state) =>
      !state.orders.some((order) => order.id === readyOrder.id) &&
      state.cash >= expectedStartingCash + readyOrder.rewards.cash,
    12_000,
  );
  expect(after.orders.some((order) => order.id === readyOrder.id)).toBe(false);
  expect(after.board.some((part) => part?.id === orderPart.id)).toBe(false);
  expect(after.cash).toBeGreaterThanOrEqual(
    expectedStartingCash + readyOrder.rewards.cash,
  );
});

test("persists state across reload", async ({ page }) => {
  const expectedCash = 177;
  const expectedResearch = 11;
  const expectedReputation = 5;
  const persistedPart = buildPart(1, 3, "open");

  await openFreshGame(page, (state) => {
    const board = emptyBoard(state.boardSize);
    board[1] = persistedPart;
    return {
      board,
      orders: [],
      highlightedOrderId: undefined,
      cash: expectedCash,
      research: expectedResearch,
      reputation: expectedReputation,
    };
  });
  await flushLTSave(page);

  await page.reload();
  await waitForLTRuntime(page);
  await waitForLTIdle(page);

  const afterReload = await getLTState(page);
  expect(afterReload.cash).toBe(expectedCash);
  expect(afterReload.research).toBe(expectedResearch);
  expect(afterReload.reputation).toBe(expectedReputation);
  expect(afterReload.board[1]).toMatchObject({
    id: persistedPart.id,
    tier: 3,
    family: "open",
  });
});
