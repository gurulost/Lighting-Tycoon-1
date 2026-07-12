import type {
  DailyGoalAction,
  DailyGoalState,
  MissionReward,
} from "@/types/game";

export type { DailyGoalAction, DailyGoalState } from "@/types/game";

export interface DailyGoalTemplate {
  id: string;
  type: DailyGoalAction;
  label: string;
  description: string;
  target: number;
  reward: MissionReward;
}

export const DAILY_GOAL_TEMPLATES: readonly DailyGoalTemplate[] = [
  {
    id: "daily_merge",
    type: "merge_count",
    label: "Merge 8 parts",
    description: "Keep the workshop moving with eight merges.",
    target: 8,
    reward: { cash: 60, reputation: 5 },
  },
  {
    id: "daily_install",
    type: "complete_order",
    label: "Complete 3 installs",
    description: "Finish three customer installs today.",
    target: 3,
    reward: { cash: 90, reputation: 8 },
  },
  {
    id: "daily_open",
    type: "complete_order_no_locked",
    label: "Complete 2 open installs",
    description: "Deliver two installs without locked components.",
    target: 2,
    reward: { research: 10, reputation: 8 },
  },
  {
    id: "daily_locked",
    type: "complete_order_with_locked",
    label: "Complete 2 locked installs",
    description: "Deliver two installs that use locked components.",
    target: 2,
    reward: { cash: 120, reputation: 5 },
  },
  {
    id: "daily_compatible",
    type: "complete_order_compatible",
    label: "Complete a compatible install",
    description: "Use compatible open-standard technology in one install.",
    target: 1,
    reward: { research: 16, reputation: 10 },
  },
] as const;

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashDateKey(dateKey: string): number {
  let hash = 2166136261;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash ^= dateKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createDailyGoal(dateKey: string): DailyGoalState {
  const template =
    DAILY_GOAL_TEMPLATES[hashDateKey(dateKey) % DAILY_GOAL_TEMPLATES.length];
  return {
    dateKey,
    templateId: template.id,
    type: template.type,
    label: template.label,
    description: template.description,
    target: template.target,
    progress: 0,
    reward: { ...template.reward },
  };
}

export function ensureDailyGoal(
  existing: DailyGoalState | undefined,
  now: Date,
  eligible: boolean,
): DailyGoalState | undefined {
  if (!eligible) return existing;
  const today = getLocalDateKey(now);
  if (existing && existing.dateKey >= today) return existing;
  return createDailyGoal(today);
}

export function advanceDailyGoal(
  goal: DailyGoalState | undefined,
  action: DailyGoalAction,
  now: number,
  amount = 1,
): DailyGoalState | undefined {
  if (!goal || goal.claimedAt || goal.type !== action) return goal;
  if (goal.completedAt) return goal;
  const progress = Math.min(
    goal.target,
    goal.progress + Math.max(0, Math.floor(amount)),
  );
  return {
    ...goal,
    progress,
    completedAt: progress >= goal.target ? now : undefined,
  };
}

export function markDailyGoalClaimed(
  goal: DailyGoalState | undefined,
  now: number,
): DailyGoalState | undefined {
  if (!goal?.completedAt || goal.claimedAt) return goal;
  return { ...goal, claimedAt: now };
}
