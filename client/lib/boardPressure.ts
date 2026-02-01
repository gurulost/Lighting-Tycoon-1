import type { GameState } from "@/types/game";
import { getTuning } from "@/lib/tuning";

export type BoardPressureBand = "green" | "yellow" | "red";

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
  const tuning = getTuning();
  if (freeSlots >= tuning.boardPressure.green) return "green";
  if (freeSlots >= tuning.boardPressure.yellow) return "yellow";
  return "red";
}
