export type OverlayType =
  | "lockout"
  | "story"
  | "tutorial_tip"
  | "toast"
  | "milestone"
  | "system_hint"
  | "unlock_banner";

export interface OverlayItem {
  id: string;
  type: OverlayType;
  createdAt: number;
  payload?: Record<string, any>;
  sticky?: boolean;
  dedupeKey?: string;
}

export const OVERLAY_PRIORITY: Record<OverlayType, number> = {
  lockout: 100,
  story: 80,
  tutorial_tip: 70,
  toast: 50,
  milestone: 40,
  system_hint: 30,
  unlock_banner: 60,
};

export const OVERLAY_QUEUE_MAX = 8;
export const OVERLAY_STARVATION_MS = 20000;
export const OVERLAY_STARVATION_BOOST = 15;

export const OVERLAY_AUTO_DISMISS_MS: Partial<Record<OverlayType, number>> = {
  toast: 2200,
  milestone: 1800,
  system_hint: 2400,
  unlock_banner: 3600,
};

export const OVERLAY_SECONDARY_TYPES: OverlayType[] = [
  "toast",
  "milestone",
  "system_hint",
  "unlock_banner",
];

export const OVERLAY_COEXISTENCE: Record<OverlayType, OverlayType[]> = {
  lockout: [],
  story: ["toast", "milestone", "system_hint", "unlock_banner"],
  tutorial_tip: ["toast", "system_hint"],
  toast: [],
  milestone: [],
  system_hint: [],
  unlock_banner: [],
};
