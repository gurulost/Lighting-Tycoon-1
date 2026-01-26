import type { GameState } from "@/types/game";

export type BoardPressureBand = "green" | "yellow" | "red";

export const BOARD_PRESSURE_THRESHOLDS = {
  green: 5,
  yellow: 2,
} as const;

type BoardPressureState = Pick<
  GameState,
  "board" | "boardSize" | "stationSlots" | "blockedSlots" | "unlockedSlots"
>;

export function countFreeSlots(state: BoardPressureState): number {
  let count = 0;
  for (let i = 0; i < state.boardSize; i += 1) {
    if (state.stationSlots.includes(i)) continue;
    if (state.blockedSlots.includes(i) && !state.unlockedSlots.includes(i)) continue;
    if (state.board[i] === null) count += 1;
  }
  return count;
}

export function getBoardPressureBand(freeSlots: number): BoardPressureBand {
  if (freeSlots >= BOARD_PRESSURE_THRESHOLDS.green) return "green";
  if (freeSlots >= BOARD_PRESSURE_THRESHOLDS.yellow) return "yellow";
  return "red";
}
