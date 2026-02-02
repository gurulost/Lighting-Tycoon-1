import { CouncilObjectiveDef } from "@/constants/councilCampaigns";

export type CouncilHearingPenalty = {
  globalRewardMult?: { cash?: number; reputation?: number; research?: number };
  compatRewardMult?: { cash?: number; reputation?: number; research?: number };
  ecoAuditResearchBonusMult?: number;
  rushRewardMult?: { cash?: number; reputation?: number; research?: number };
  refreshCostMult?: number;
  projectDepositMult?: number;
  compatOrderWeightMult?: number;
};

export interface CouncilHearingDefinition {
  id: string;
  title: string;
  description: string;
  penalty: CouncilHearingPenalty;
  constraints?: {
    disallowRefresh?: boolean;
  };
  clearObjectives: CouncilObjectiveDef[];
  payToClear: {
    cash: number;
    research: number;
  };
  onClear: {
    lobbyPressureDrop: number;
    bonus?: { cash?: number; research?: number; reputation?: number };
  };
  story: {
    triggered: string;
    cleared: string;
    paid: string;
  };
}

export const COUNCIL_HEARINGS: CouncilHearingDefinition[] = [
  {
    id: "hear_public_hearing",
    title: "Public Hearing",
    description:
      "The committee wants proof in public. The lobby wants you to look uncertain.",
    penalty: {
      globalRewardMult: { cash: 0.9 },
    },
    clearObjectives: [
      {
        id: "clear_open_only_2",
        type: "FULFILL_OPEN_ONLY",
        target: 2,
        label: "Complete 2 open-only installs",
      },
    ],
    payToClear: { cash: 2800, research: 40 },
    onClear: { lobbyPressureDrop: 10, bonus: { reputation: 15 } },
    story: {
      triggered:
        "A public hearing is called. Keep your installs clean - show them what 'open' looks like at speed.",
      cleared:
        "The testimony lands. Even the skeptics have to admit the work speaks louder than the lobbying.",
      paid: "You fund a public demo and drown the noise in proof. The hearing dissolves - quietly.",
    },
  },
  {
    id: "hear_safety_audit",
    title: "Safety Audit",
    description:
      "An inspection team arrives with clipboards and deadlines. No mistakes. No excuses.",
    penalty: {
      ecoAuditResearchBonusMult: 0.5,
      globalRewardMult: { reputation: 0.95 },
    },
    constraints: { disallowRefresh: true },
    clearObjectives: [
      {
        id: "clear_eco_1",
        type: "FULFILL_ECO_AUDIT",
        target: 1,
        label: "Complete 1 eco-audit install (no refreshes during the audit)",
      },
    ],
    payToClear: { cash: 4200, research: 120 },
    onClear: { lobbyPressureDrop: 12, bonus: { research: 30 } },
    story: {
      triggered:
        "Safety audit. They're looking for any crack in the process. Don't give them one.",
      cleared:
        "Audit passed. The paperwork turns into precedent - and precedent turns into leverage.",
      paid: "You bring in an external lab and fast-track certification. Expensive. Effective.",
    },
  },
  {
    id: "hear_lobby_smear",
    title: "Lobby Smear Campaign",
    description:
      "Incumbents flood the Council with 'concerns.' Your reputation takes the hit unless you respond with results.",
    penalty: {
      globalRewardMult: { reputation: 0.85 },
    },
    clearObjectives: [
      {
        id: "clear_compat_1",
        type: "FULFILL_COMPAT_REQUIRED",
        target: 1,
        label: "Complete 1 compatibility install",
      },
    ],
    payToClear: { cash: 3600, research: 60 },
    onClear: { lobbyPressureDrop: 8, bonus: { reputation: 10 } },
    story: {
      triggered:
        "The smear hits. Ignore it and your standing slips. Counter it with a flawless compatibility install.",
      cleared:
        "The smear stalls. It's hard to argue with a system that just... works.",
      paid: "You run a transparent disclosure campaign. Costly, but it starves the smear of oxygen.",
    },
  },
  {
    id: "hear_committee_filibuster",
    title: "Committee Filibuster",
    description:
      "They can't defeat the standard, so they try to bury it in procedure.",
    penalty: {
      projectDepositMult: 1.1,
      refreshCostMult: 1.2,
    },
    clearObjectives: [
      {
        id: "clear_any_2",
        type: "FULFILL_ANY",
        target: 2,
        label: "Complete any 2 installs to show momentum",
      },
    ],
    payToClear: { cash: 5200, research: 80 },
    onClear: { lobbyPressureDrop: 10 },
    story: {
      triggered:
        "A filibuster. It's not about evidence - it's about delay. Push forward anyway.",
      cleared:
        "Momentum wins. The filibuster collapses when the work keeps landing on time.",
      paid: "You secure procedural allies and expedite the calendar. It hurts, but it works.",
    },
  },
  {
    id: "hear_procurement_challenge",
    title: "Procurement Challenge",
    description:
      "A trade group challenges whether open standards can meet supply at scale.",
    penalty: {
      globalRewardMult: { cash: 0.95 },
      compatOrderWeightMult: 1.1,
    },
    clearObjectives: [
      {
        id: "clear_open_only_1",
        type: "FULFILL_OPEN_ONLY",
        target: 1,
        label: "Complete 1 open-only install",
      },
      {
        id: "clear_eco_1",
        type: "FULFILL_ECO_AUDIT",
        target: 1,
        label: "Complete 1 eco-audit install",
      },
    ],
    payToClear: { cash: 4800, research: 70 },
    onClear: { lobbyPressureDrop: 12, bonus: { cash: 1200 } },
    story: {
      triggered:
        "They call it 'unscalable.' Prove them wrong with clean, auditable delivery.",
      cleared:
        "The challenge backfires. Your installs become the evidence they didn't want entered into record.",
      paid: "You fund a public procurement demo. Pricey - then profitable.",
    },
  },
  {
    id: "hear_standards_confusion",
    title: "Standards Confusion",
    description:
      "Competing drafts appear overnight. Confusion is the lobby's favorite tool.",
    penalty: {
      compatOrderWeightMult: 1.2,
      globalRewardMult: { research: 0.95 },
    },
    clearObjectives: [
      {
        id: "clear_compat_2",
        type: "FULFILL_COMPAT_REQUIRED",
        target: 2,
        label: "Complete 2 compatibility installs",
      },
    ],
    payToClear: { cash: 3100, research: 90 },
    onClear: { lobbyPressureDrop: 8, bonus: { research: 20 } },
    story: {
      triggered:
        "They flood the room with alternatives. Cut through it: deliver compatibility installs that are undeniable.",
      cleared:
        "Clarity returns. Confusion doesn't survive contact with working systems.",
      paid: "You publish a reference implementation and collapse the debate into reality.",
    },
  },
  {
    id: "hear_trade_group_objection",
    title: "Trade Group Objection",
    description:
      "A formal objection is filed - designed to drain your time and cash.",
    penalty: {
      refreshCostMult: 1.25,
      globalRewardMult: { cash: 0.95 },
    },
    clearObjectives: [
      {
        id: "clear_eco_1",
        type: "FULFILL_ECO_AUDIT",
        target: 1,
        label: "Complete 1 eco-audit install",
      },
    ],
    payToClear: { cash: 4500, research: 50 },
    onClear: { lobbyPressureDrop: 10 },
    story: {
      triggered:
        "An objection lands with a thousand pages. Don't argue - deliver audited work and move the vote.",
      cleared:
        "The objection dissolves. It turns out 'concerns' are hard to maintain when the data is clean.",
      paid: "You retain counsel and file a rebuttal that ends the objection on paperwork alone.",
    },
  },
  {
    id: "hear_emergency_review",
    title: "Emergency Review",
    description:
      "A last-minute emergency review tries to stall a vote. You can clear it fast - or pay to bulldoze it.",
    penalty: {
      rushRewardMult: { cash: 0.85 },
      globalRewardMult: { reputation: 0.95 },
    },
    clearObjectives: [
      {
        id: "clear_rush_1",
        type: "FULFILL_RUSH",
        target: 1,
        label: "Complete 1 rush install",
      },
    ],
    payToClear: { cash: 5200, research: 110 },
    onClear: { lobbyPressureDrop: 8, bonus: { reputation: 10 } },
    story: {
      triggered:
        "Emergency review. They're betting you can't respond quickly without breaking your own principles.",
      cleared: "You respond fast - and correctly. The review loses its teeth.",
      paid: "You pull political favors and clear the agenda. Effective - and expensive.",
    },
  },
];

export const COUNCIL_HEARING_BY_ID: Record<string, CouncilHearingDefinition> =
  Object.fromEntries(COUNCIL_HEARINGS.map((h) => [h.id, h]));
