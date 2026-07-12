import type { GameState } from "@/types/game";

export interface SaveEnvelopeV2 {
  version: 2;
  savedAt: number;
  state: GameState;
}
