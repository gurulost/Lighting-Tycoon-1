import { PartTier } from "@/types/game";

export type CouncilObjectiveType =
  | "FULFILL_ANY"
  | "FULFILL_OPEN_ONLY"
  | "FULFILL_COMPAT_REQUIRED"
  | "FULFILL_ECO_AUDIT"
  | "FULFILL_RUSH"
  | "REACH_INSTALL_STREAK"
  | "COMPLETE_PROJECT";

export interface CouncilObjectiveDef {
  id: string;
  type: CouncilObjectiveType;
  target: number;
  label: string;
  params?: {
    consecutive?: boolean;
    minStreak?: number;
    projectId?: string;
    minTier?: PartTier;
  };
}

export interface CouncilRatifyOrderSpec {
  title: string;
  tierMin: PartTier;
  tierMax: PartTier;
  requiresOpenOnly?: boolean;
  requiresCompatibility?: boolean;
  requiresEcoAudit?: boolean;
  requiresRush?: boolean;
  rewardMultiplier: number;
  deadlineInstalls?: number;
}

export interface CouncilCampaignDefinition {
  id: string;
  title: string;
  tagline: string;
  sortIndex: number;
  unlock: {
    minRepTier?: number;
    minProjectsCompleted?: number;
    minCampaignsCompleted?: number;
    requiredProjectIds?: string[];
    requiredCampaignIds?: string[];
  };
  draftCost: {
    cash: number;
    research: number;
    allowPartial: boolean;
  };
  pressure: {
    onDraftComplete: number;
    onPilotMilestone: number;
    onRatifyComplete: number;
  };
  pilotObjectives: CouncilObjectiveDef[];
  ratifyOrder: CouncilRatifyOrderSpec;
  perkId: string;
  story: {
    intro: string;
    draftComplete: string;
    pilotComplete: string;
    ratifyComplete: string;
  };
}

export const COUNCIL_CAMPAIGNS: CouncilCampaignDefinition[] = [
  {
    id: "camp_residential_open_standard",
    title: "Residential Open Standard",
    tagline: "Make open installs the default in every home.",
    sortIndex: 10,
    unlock: {
      minRepTier: 6,
    },
    draftCost: { cash: 12000, research: 280, allowPartial: true },
    pressure: { onDraftComplete: 6, onPilotMilestone: 2, onRatifyComplete: 8 },
    pilotObjectives: [
      {
        id: "pilot_open_only_5",
        type: "FULFILL_OPEN_ONLY",
        target: 5,
        label: "Complete 5 open-only installs",
      },
      {
        id: "pilot_compat_2",
        type: "FULFILL_COMPAT_REQUIRED",
        target: 2,
        label: "Complete 2 compatibility installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Residential Open Standard",
      tierMin: 8,
      tierMax: 9,
      requiresCompatibility: true,
      rewardMultiplier: 2.0,
    },
    perkId: "perk_open_baseline",
    story: {
      intro:
        "The Council invites you to draft a residential standard. The lobby calls it 'unnecessary.' The Mentor calls it 'inevitable.'",
      draftComplete:
        "Draft submitted. Now prove it works in the real world - clean installs, no lock-in shortcuts.",
      pilotComplete:
        "Pilot success. The room quiets. One last step: a public showcase install for the Council floor.",
      ratifyComplete:
        "Ratified. Contractors start copying your approach. Open installs stop feeling like an exception.",
    },
  },
  {
    id: "camp_commercial_interop_standard",
    title: "Commercial Interop Standard",
    tagline: "Turn interoperability into a business expectation, not a bonus.",
    sortIndex: 20,
    unlock: {
      requiredCampaignIds: ["camp_residential_open_standard"],
    },
    draftCost: { cash: 18000, research: 420, allowPartial: true },
    pressure: { onDraftComplete: 8, onPilotMilestone: 3, onRatifyComplete: 10 },
    pilotObjectives: [
      {
        id: "pilot_compat_6",
        type: "FULFILL_COMPAT_REQUIRED",
        target: 6,
        label: "Complete 6 compatibility installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Commercial Interop Standard",
      tierMin: 9,
      tierMax: 10,
      requiresCompatibility: true,
      rewardMultiplier: 2.4,
    },
    perkId: "perk_interop_premium",
    story: {
      intro:
        "A coalition of builders wants interop guarantees. The incumbents want 'flexible interpretations.'",
      draftComplete:
        "Draft filed. The lobby responds with memos and smiles. Your response is output.",
      pilotComplete:
        "Pilot metrics land. Interop reduces callbacks. The Council schedules a ratification vote.",
      ratifyComplete:
        "Ratified. Commercial clients start paying extra for compatibility - because now it means something.",
    },
  },
  {
    id: "camp_municipal_procurement_reform",
    title: "Municipal Procurement Reform",
    tagline:
      "Rewrite how cities buy light - open, auditable, and hard to sabotage.",
    sortIndex: 30,
    unlock: {
      minProjectsCompleted: 3,
    },
    draftCost: { cash: 26000, research: 380, allowPartial: true },
    pressure: {
      onDraftComplete: 10,
      onPilotMilestone: 3,
      onRatifyComplete: 12,
    },
    pilotObjectives: [
      {
        id: "pilot_eco_3",
        type: "FULFILL_ECO_AUDIT",
        target: 3,
        label: "Complete 3 eco-audit installs",
      },
      {
        id: "pilot_open_only_3",
        type: "FULFILL_OPEN_ONLY",
        target: 3,
        label: "Complete 3 open-only installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Municipal Procurement Reform",
      tierMin: 9,
      tierMax: 10,
      requiresOpenOnly: true,
      requiresEcoAudit: true,
      rewardMultiplier: 2.6,
    },
    perkId: "perk_municipal_grants",
    story: {
      intro:
        "City contracts are where monopolies hide. Reform means visibility - and the lobby hates visibility.",
      draftComplete:
        "Draft circulated to municipalities. Now you need proof that the process doesn't slow the work down.",
      pilotComplete:
        "Pilot complete. The Council can't argue with results - only with politics.",
      ratifyComplete:
        "Ratified. Cities start issuing grants that blunt lobbying spikes when they flare up.",
    },
  },
  {
    id: "camp_safety_certification_framework",
    title: "Safety Certification Framework",
    tagline:
      "Make audits routine, not punitive - and convert scrutiny into research momentum.",
    sortIndex: 40,
    unlock: {
      requiredCampaignIds: ["camp_municipal_procurement_reform"],
    },
    draftCost: { cash: 30000, research: 520, allowPartial: true },
    pressure: {
      onDraftComplete: 10,
      onPilotMilestone: 4,
      onRatifyComplete: 14,
    },
    pilotObjectives: [
      {
        id: "pilot_eco_6",
        type: "FULFILL_ECO_AUDIT",
        target: 6,
        label: "Complete 6 eco-audit installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Safety Certification Framework",
      tierMin: 10,
      tierMax: 10,
      requiresEcoAudit: true,
      rewardMultiplier: 3.0,
    },
    perkId: "perk_certified_operations",
    story: {
      intro:
        "The Council's strictest committee shows up: safety, compliance, liability. You can either fear it or own it.",
      draftComplete:
        "The framework is drafted. The lobby pivots to procedural tricks - hearings, delays, distractions.",
      pilotComplete:
        "The audits don't slow you down. They make you better. The Council schedules ratification.",
      ratifyComplete:
        "Ratified. Hearings are still annoying - but now you're built to handle them efficiently.",
    },
  },
  {
    id: "camp_emergency_response_standard",
    title: "Emergency Response Lighting Standard",
    tagline:
      "When power fails, clarity matters. Codify rapid deployment without cutting corners.",
    sortIndex: 50,
    unlock: {
      requiredCampaignIds: ["camp_safety_certification_framework"],
      minRepTier: 8,
    },
    draftCost: { cash: 24000, research: 420, allowPartial: true },
    pressure: { onDraftComplete: 8, onPilotMilestone: 3, onRatifyComplete: 12 },
    pilotObjectives: [
      {
        id: "pilot_rush_4",
        type: "FULFILL_RUSH",
        target: 4,
        label: "Complete 4 rush installs",
      },
      {
        id: "pilot_open_only_2",
        type: "FULFILL_OPEN_ONLY",
        target: 2,
        label: "Complete 2 open-only installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Emergency Response Standard",
      tierMin: 10,
      tierMax: 10,
      requiresOpenOnly: true,
      requiresRush: true,
      rewardMultiplier: 3.0,
    },
    perkId: "perk_rapid_deployment",
    story: {
      intro:
        "Emergency managers want standards that move fast. The lobby wants exceptions that lock cities into contracts.",
      draftComplete:
        "Draft submitted. Now demonstrate you can be fast without becoming sloppy.",
      pilotComplete:
        "Pilot passed. Rapid deployment doesn't have to mean proprietary shortcuts.",
      ratifyComplete:
        "Ratified. Rush work becomes a legitimate specialty, not a gamble.",
    },
  },
  {
    id: "camp_accessibility_wayfinding_standard",
    title: "Accessibility & Wayfinding Standard",
    tagline:
      "Make guidance systems predictable - humans first, devices second.",
    sortIndex: 60,
    unlock: {
      requiredCampaignIds: ["camp_commercial_interop_standard"],
    },
    draftCost: { cash: 20000, research: 360, allowPartial: true },
    pressure: { onDraftComplete: 7, onPilotMilestone: 3, onRatifyComplete: 10 },
    pilotObjectives: [
      {
        id: "pilot_compat_4",
        type: "FULFILL_COMPAT_REQUIRED",
        target: 4,
        label: "Complete 4 compatibility installs",
      },
      {
        id: "pilot_open_only_4",
        type: "FULFILL_OPEN_ONLY",
        target: 4,
        label: "Complete 4 open-only installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Accessibility & Wayfinding",
      tierMin: 9,
      tierMax: 10,
      requiresCompatibility: true,
      rewardMultiplier: 2.2,
    },
    perkId: "perk_clear_guidance",
    story: {
      intro:
        "Transit advocates show up with stories. The lobby shows up with fine print. You show up with working installs.",
      draftComplete:
        "Draft complete. Now prove it in the field - clean, consistent installs that don't break under pressure.",
      pilotComplete:
        "Pilot results are undeniable. The Council can't unsee the difference.",
      ratifyComplete:
        "Ratified. Your reputation rises - because now you stand for clarity, not just brightness.",
    },
  },
  {
    id: "camp_sustainability_mandate",
    title: "Sustainability Mandate",
    tagline:
      "Make efficient installs and responsible sourcing the baseline everywhere.",
    sortIndex: 70,
    unlock: {
      requiredCampaignIds: ["camp_residential_open_standard"],
    },
    draftCost: { cash: 17000, research: 340, allowPartial: true },
    pressure: { onDraftComplete: 7, onPilotMilestone: 3, onRatifyComplete: 10 },
    pilotObjectives: [
      {
        id: "pilot_eco_4",
        type: "FULFILL_ECO_AUDIT",
        target: 4,
        label: "Complete 4 eco-audit installs",
      },
      {
        id: "pilot_open_only_4",
        type: "FULFILL_OPEN_ONLY",
        target: 4,
        label: "Complete 4 open-only installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Sustainability Mandate",
      tierMin: 9,
      tierMax: 10,
      requiresOpenOnly: true,
      requiresEcoAudit: true,
      rewardMultiplier: 2.4,
    },
    perkId: "perk_circular_supply",
    story: {
      intro:
        "Sustainability groups demand standards. The lobby calls it 'costly.' You call it 'inefficient not to.'",
      draftComplete:
        "Draft complete. Now prove sustainable work can still scale.",
      pilotComplete:
        "Pilot passed. The waste argument collapses when the numbers are clean.",
      ratifyComplete:
        "Ratified. Salvage and recycling improve - because now the system rewards doing it right.",
    },
  },
  {
    id: "camp_open_manufacturing_incentives",
    title: "Open Manufacturing Incentives",
    tagline:
      "Scale the open supply chain so no one can bottleneck the market again.",
    sortIndex: 80,
    unlock: {
      requiredCampaignIds: ["camp_municipal_procurement_reform"],
    },
    draftCost: { cash: 36000, research: 420, allowPartial: true },
    pressure: {
      onDraftComplete: 10,
      onPilotMilestone: 4,
      onRatifyComplete: 14,
    },
    pilotObjectives: [
      {
        id: "pilot_open_only_8",
        type: "FULFILL_OPEN_ONLY",
        target: 8,
        label: "Complete 8 open-only installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Open Manufacturing Incentives",
      tierMin: 10,
      tierMax: 10,
      requiresOpenOnly: true,
      rewardMultiplier: 2.8,
    },
    perkId: "perk_incentivized_supply",
    story: {
      intro:
        "Incumbents can survive standards if they control production. This campaign targets the choke points.",
      draftComplete:
        "Draft submitted. Now prove the supply chain can support it - through consistent open-only delivery.",
      pilotComplete:
        "Pilot shows the market can scale without lock-in. The lobby's leverage shrinks.",
      ratifyComplete:
        "Ratified. Open supply becomes stronger - and large deposits stop feeling like a tax on progress.",
    },
  },
  {
    id: "camp_interop_labeling_program",
    title: "Interoperability Labeling Program",
    tagline:
      "Make compatibility measurable. Turn 'claims' into a badge that costs effort to earn.",
    sortIndex: 90,
    unlock: {
      requiredCampaignIds: [
        "camp_commercial_interop_standard",
        "camp_safety_certification_framework",
      ],
    },
    draftCost: { cash: 42000, research: 560, allowPartial: true },
    pressure: {
      onDraftComplete: 12,
      onPilotMilestone: 4,
      onRatifyComplete: 16,
    },
    pilotObjectives: [
      {
        id: "pilot_compat_8",
        type: "FULFILL_COMPAT_REQUIRED",
        target: 8,
        label: "Complete 8 compatibility installs",
      },
      {
        id: "pilot_eco_2",
        type: "FULFILL_ECO_AUDIT",
        target: 2,
        label: "Complete 2 eco-audit installs",
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: Interop Gold Label",
      tierMin: 10,
      tierMax: 10,
      requiresCompatibility: true,
      requiresEcoAudit: true,
      rewardMultiplier: 3.2,
    },
    perkId: "perk_gold_label",
    story: {
      intro:
        "The lobby loves vague marketing. A real label threatens their favorite weapon: confusion.",
      draftComplete:
        "Draft published. Now you need a track record: compatibility that holds up under audit.",
      pilotComplete:
        "Pilot complete. The Council can finally draw a line between 'compatible' and 'actually interoperable.'",
      ratifyComplete:
        "Ratified. The Gold Label becomes the prestige badge - and you own that category.",
    },
  },
  {
    id: "camp_international_harmonization_accord",
    title: "International Harmonization Accord",
    tagline:
      "Align standards across regions so the market can't fracture again.",
    sortIndex: 100,
    unlock: {
      minRepTier: 10,
      minCampaignsCompleted: 7,
      requiredProjectIds: ["proj_international_expo"],
    },
    draftCost: { cash: 65000, research: 900, allowPartial: true },
    pressure: {
      onDraftComplete: 14,
      onPilotMilestone: 5,
      onRatifyComplete: 20,
    },
    pilotObjectives: [
      {
        id: "pilot_open_only_6",
        type: "FULFILL_OPEN_ONLY",
        target: 6,
        label: "Complete 6 open-only installs",
      },
      {
        id: "pilot_compat_6",
        type: "FULFILL_COMPAT_REQUIRED",
        target: 6,
        label: "Complete 6 compatibility installs",
      },
      {
        id: "pilot_eco_4",
        type: "FULFILL_ECO_AUDIT",
        target: 4,
        label: "Complete 4 eco-audit installs",
      },
      {
        id: "pilot_streak_10",
        type: "REACH_INSTALL_STREAK",
        target: 1,
        label: "Reach an install streak of 10",
        params: { minStreak: 10 },
      },
    ],
    ratifyOrder: {
      title: "Council Showcase: International Harmonization Accord",
      tierMin: 10,
      tierMax: 10,
      requiresCompatibility: true,
      requiresEcoAudit: true,
      rewardMultiplier: 3.8,
    },
    perkId: "perk_global_standard_setter",
    story: {
      intro:
        "This isn't one committee. It's all of them. Harmonization threatens the lobby's last strategy: fragmentation.",
      draftComplete:
        "Draft submitted. Every incumbent tries a different angle. You keep building.",
      pilotComplete:
        "Pilot passed. Cross-region installs hold. The market starts acting like one ecosystem.",
      ratifyComplete:
        "Ratified. You didn't just beat a monopoly - you wrote the rulebook everyone plays by now.",
    },
  },
];

export const COUNCIL_CAMPAIGN_BY_ID: Record<string, CouncilCampaignDefinition> =
  Object.fromEntries(COUNCIL_CAMPAIGNS.map((c) => [c.id, c]));
