import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";

export type LTPartFamily = "open" | "locked" | "waste";

export type LTPart = {
  id: string;
  family: LTPartFamily;
  tier: number;
  position: number;
  compatible?: boolean;
};

export type LTOrder = {
  id: string;
  type: string;
  requirements: { tier: number; family: string; count: number }[];
  rewards: { cash: number; reputation: number; research: number };
  [key: string]: unknown;
};

export type LTStateSnapshot = {
  boardSize: number;
  board: (LTPart | null)[];
  backpack: (LTPart | null)[];
  cash: number;
  research: number;
  reputation: number;
  dependency: number;
  tutorialComplete: boolean;
  tutorialStep: number;
  tutorialReplay?: boolean;
  firstSessionComplete?: boolean;
  firstSessionOrderIndex?: number;
  firstSessionOrdersCompleted?: number;
  firstSessionForcedDrops?: unknown[];
  firstSessionSecondOfferTriggered?: boolean;
  firstSessionChoiceOffered?: boolean;
  firstSessionChoiceResolved?: boolean;
  firstSessionChoiceMentorOrderId?: string;
  firstSessionChoiceBaronOrderId?: string;
  baronOfferAvailable?: boolean;
  storyQueue?: string[];
  overlayQueue?: unknown[];
  activeStoryBeatId?: string;
  highlightedOrderId?: string;
  settings?: {
    reducedMotion?: boolean;
    soundEnabled?: boolean;
    hapticsEnabled?: boolean;
  };
  tutorialMetrics?: {
    skipped?: boolean;
    [key: string]: unknown;
  };
  orders: LTOrder[];
  [key: string]: unknown;
};

type SaveEnvelope = {
  version: number;
  state: LTStateSnapshot;
};

type LTStatePatch =
  | Partial<LTStateSnapshot>
  | ((state: LTStateSnapshot) => Partial<LTStateSnapshot>);

const STORAGE_KEY = "lighting_tycoon_state_v1";
const STORAGE_BACKUP_KEY = "lighting_tycoon_state_v1_backup";
const SAVE_DEBOUNCE_MS = 1500;
const BOARD_COLS = 6;
const BOARD_ROWS = 5;
const FIXTURE_PATH = path.resolve(__dirname, "../fixtures/base-state.json");
const BASE_ENVELOPE = JSON.parse(
  fs.readFileSync(FIXTURE_PATH, "utf8"),
) as SaveEnvelope;

let partCounter = 0;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function tutorialSkippedPatch(state: LTStateSnapshot) {
  return {
    tutorialComplete: true,
    tutorialReplay: true,
    tutorialStep: 7,
    tutorialOrderId: undefined,
    tutorialHint: undefined,
    firstSessionComplete: true,
    firstSessionOrderIndex: Math.max(3, state.firstSessionOrderIndex ?? 0),
    firstSessionOrdersCompleted: Math.max(
      2,
      state.firstSessionOrdersCompleted ?? 0,
    ),
    firstSessionForcedDrops: [],
    firstSessionSecondOfferTriggered: true,
    firstSessionChoiceOffered: true,
    firstSessionChoiceResolved: true,
    firstSessionChoiceMentorOrderId: undefined,
    firstSessionChoiceBaronOrderId: undefined,
    baronOfferAvailable: false,
    activeStoryBeatId: undefined,
    storyQueue: [],
    overlayQueue: [],
    tutorialMetrics: {
      ...(state.tutorialMetrics ?? {}),
      skipped: true,
    },
    settings: {
      ...(state.settings ?? {}),
      reducedMotion: true,
      soundEnabled: false,
      hapticsEnabled: false,
    },
  };
}

function buildFreshState(): LTStateSnapshot {
  const fixtureState = clone(BASE_ENVELOPE.state);
  return {
    ...fixtureState,
    ...tutorialSkippedPatch(fixtureState),
  };
}

function buildScenarioState(patch?: LTStatePatch): LTStateSnapshot {
  const base = buildFreshState();
  if (!patch) return base;
  const resolvedPatch =
    typeof patch === "function" ? patch(clone(base)) : patch;
  return {
    ...base,
    ...resolvedPatch,
  };
}

function getSelector(page: Page, id: string) {
  return page.locator(`[data-testid="${id}"], [id="${id}"]`);
}

async function getBoardSlotCenter(page: Page, index: number) {
  const boardSize = BOARD_COLS * BOARD_ROWS;
  if (index < 0 || index >= boardSize) {
    throw new Error(`Board index out of range: ${index}`);
  }

  const workbench = page.getByTestId("workbench-station");
  const orders = page.getByTestId("orders-station");
  await expect(workbench).toBeVisible();
  await expect(orders).toBeVisible();

  const workbenchBox = await workbench.boundingBox();
  const ordersBox = await orders.boundingBox();
  if (!workbenchBox || !ordersBox) {
    throw new Error("Could not read board station bounds.");
  }

  const workbenchCenterX = workbenchBox.x + workbenchBox.width / 2;
  const workbenchCenterY = workbenchBox.y + workbenchBox.height / 2;
  const ordersCenterX = ordersBox.x + ordersBox.width / 2;
  let step = (ordersCenterX - workbenchCenterX) / (BOARD_COLS - 1);
  let originX = workbenchCenterX;
  let originY = workbenchCenterY;

  const rdStation = page.getByTestId("rd-station");
  const rdVisible = await rdStation.isVisible().catch(() => false);
  if (rdVisible) {
    const rdBox = await rdStation.boundingBox();
    if (rdBox) {
      const rdCenterY = rdBox.y + rdBox.height / 2;
      const deltaX = ordersCenterX - workbenchCenterX;
      const deltaY = rdCenterY - workbenchCenterY;
      const solvedStep = deltaX - deltaY;
      if (Number.isFinite(solvedStep) && solvedStep > 0) {
        // Stations are rendered with a symmetric offset from board slot centers.
        const stationOffset = (deltaY - (BOARD_ROWS - 1) * solvedStep) / 2;
        step = solvedStep;
        originX = workbenchCenterX + stationOffset;
        originY = workbenchCenterY + stationOffset;
      }
    }
  }

  const col = index % BOARD_COLS;
  const row = Math.floor(index / BOARD_COLS);

  return {
    x: originX + step * col,
    y: originY + step * row,
  };
}

async function waitForGameShell(page: Page) {
  await expect(page.getByTestId("settings-button")).toBeVisible({
    timeout: 30_000,
  });
}

async function dismissTutorialIfVisible(page: Page) {
  const tutorialSkip = getSelector(page, "tutorial-skip");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const isVisible = await tutorialSkip.isVisible().catch(() => false);
    if (!isVisible) {
      return;
    }
    await tutorialSkip.click({ timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(120);
  }

  await expect(tutorialSkip).toBeHidden({ timeout: 8_000 });
}

async function preloadEnvelope(page: Page, envelope: SaveEnvelope) {
  const payload = JSON.stringify(envelope);

  await page.addInitScript(
    ({ storageKey, backupKey, savePayload }) => {
      try {
        localStorage.setItem(storageKey, savePayload);
        localStorage.setItem(backupKey, savePayload);
      } catch {
        // Ignore storage access errors for non-http origins.
      }
    },
    {
      storageKey: STORAGE_KEY,
      backupKey: STORAGE_BACKUP_KEY,
      savePayload: payload,
    },
  );
}

async function bootWithState(page: Page, state: LTStateSnapshot) {
  await preloadEnvelope(page, {
    version: BASE_ENVELOPE.version || 1,
    state,
  });

  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await page.goto(`/?lt-e2e=${nonce}`);
  await waitForGameShell(page);
  await dismissTutorialIfVisible(page);
}

async function readEnvelope(page: Page) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SaveEnvelope;
    } catch {
      return null;
    }
  }, STORAGE_KEY);
}

export async function waitForLTState(
  page: Page,
  predicate?: (state: LTStateSnapshot) => boolean,
  timeoutMs = 10_000,
) {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    const envelope = await readEnvelope(page);
    if (envelope?.state) {
      if (!predicate || predicate(envelope.state)) {
        return envelope.state;
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error("Timed out waiting for persisted Lighting Tycoon state.");
}

export async function getLTState(page: Page) {
  return waitForLTState(page);
}

export async function openFreshGame(page: Page, patch?: LTStatePatch) {
  await bootWithState(page, buildScenarioState(patch));
}

export async function patchLTState(page: Page, patch: LTStatePatch) {
  const current = await waitForLTState(page);
  const resolvedPatch =
    typeof patch === "function"
      ? patch(clone(current))
      : (patch as Partial<LTStateSnapshot>);
  const nextState = {
    ...current,
    ...resolvedPatch,
  };
  await bootWithState(page, nextState);
}

export async function flushLTSave(page: Page) {
  await page.waitForTimeout(SAVE_DEBOUNCE_MS + 300);
}

export async function waitForLTIdle(page: Page) {
  const mergeOverlay = getSelector(page, "merge-animation-active");
  const dragPreview = getSelector(page, "drag-preview-item");
  await mergeOverlay
    .waitFor({ state: "detached", timeout: 8_000 })
    .catch(() => {});
  await dragPreview
    .waitFor({ state: "detached", timeout: 8_000 })
    .catch(() => {});
  await page.waitForTimeout(120);
}

export async function waitForLTRuntime(page: Page) {
  await waitForGameShell(page);
  await dismissTutorialIfVisible(page);
}

export async function dragByTestId(
  page: Page,
  fromTestId: string,
  toTestId: string,
) {
  const from = getSelector(page, fromTestId);
  const to = getSelector(page, toTestId);

  const fromCount = await from.count();
  const toCount = await to.count();

  if (fromCount > 0 && toCount > 0) {
    await expect(from).toBeVisible();
    await expect(to).toBeVisible();

    const fromBox = await from.boundingBox();
    const toBox = await to.boundingBox();
    if (!fromBox || !toBox) {
      throw new Error(
        `Could not read drag bounding boxes (${fromTestId} -> ${toTestId}).`,
      );
    }

    const fromX = fromBox.x + fromBox.width / 2;
    const fromY = fromBox.y + fromBox.height / 2;
    const toX = toBox.x + toBox.width / 2;
    const toY = toBox.y + toBox.height / 2;

    await page.mouse.move(fromX, fromY);
    await page.mouse.down();
    await page.mouse.move(toX, toY, { steps: 12 });
    await page.mouse.up();
    return;
  }

  const fromMatch = /^board-part-(\d+)$/.exec(fromTestId);
  const toMatch = /^board-slot-(\d+)$/.exec(toTestId);
  if (!fromMatch || !toMatch) {
    throw new Error(
      `Could not resolve drag selectors (${fromTestId} -> ${toTestId}).`,
    );
  }

  const fromIndex = Number(fromMatch[1]);
  const toIndex = Number(toMatch[1]);
  const fromPoint = await getBoardSlotCenter(page, fromIndex);
  const toPoint = await getBoardSlotCenter(page, toIndex);

  await page.mouse.move(fromPoint.x, fromPoint.y);
  await page.mouse.down();
  await page.mouse.move(toPoint.x, toPoint.y, { steps: 12 });
  await page.mouse.up();
}

export function buildPart(
  position: number,
  tier: number,
  family: LTPartFamily = "open",
): LTPart {
  partCounter += 1;
  const id = `e2e-${family}-${tier}-${position}-${partCounter}`;
  return {
    id,
    family,
    tier,
    position,
    compatible: family === "open" ? false : undefined,
  };
}
