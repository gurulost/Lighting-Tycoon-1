import {
  PartTier,
  OrderType,
  OrderRequirement,
  Order,
  OrderFamilyPreference,
} from "@/types/game";

export interface BaseRecipe {
  id: string;
  name: string;
  requirements: OrderRequirement[];
  minNeighborhoodId: string;
  maxNeighborhoodId?: string;
  tags?: string[];
}

export interface OrderModifier {
  id: string;
  name: string;
  type:
    | "style_match"
    | "rush"
    | "client_preference"
    | "no_substitutions"
    | "eco_audit"
    | "certified"
    | "compatibility";
  minNeighborhoodId: string;
  maxNeighborhoodId?: string;
  styleMatchFamily?: OrderFamilyPreference;
  clientPreference?: OrderFamilyPreference;
  rushDeadlineSec?: number;
  noSubstitutions?: boolean;
  ecoAuditBonusResearch?: number;
  lockedRequired?: boolean;
  rewardMult?: { cash: number; rep: number; research: number };
}

export interface Archetype {
  id: string;
  name: string;
  flavorLines: string[];
  preferredModifiers?: string[];
  rewardBias: { cash: number; rep: number; research: number };
}

export interface OrderOverride {
  id: string;
  baseId: string;
  archetypeId: string;
  modifierIds?: string[];
  neighborhoodId: string;
  weight?: number;
  titleOverride?: string;
  flavorOverride?: string;
  rewardOverride?: { cash: number; rep: number; research: number };
}

export interface OrderTemplate extends Omit<Order, "id"> {
  templateId: string;
  minNeighborhoodId: string;
  weight: number;
  archetypeId?: string;
  modifierIds?: string[];
}

export const BASE_RECIPES: BaseRecipe[] = [
  {
    id: "base_clip_2",
    name: "Starter Install",
    requirements: [{ tier: 1 as PartTier, family: "any", count: 2 }],
    minNeighborhoodId: "starter",
    tags: ["intro"],
  },
  {
    id: "base_clip_3",
    name: "Starter Install+",
    requirements: [{ tier: 1 as PartTier, family: "any", count: 3 }],
    minNeighborhoodId: "starter",
    tags: ["intro"],
  },
  {
    id: "base_clip_4",
    name: "Long Run",
    requirements: [{ tier: 1 as PartTier, family: "any", count: 4 }],
    minNeighborhoodId: "starter",
    tags: ["intro"],
  },
  {
    id: "base_track_2",
    name: "Neat Routing",
    requirements: [{ tier: 2 as PartTier, family: "any", count: 2 }],
    minNeighborhoodId: "starter",
    tags: ["basic"],
  },
  {
    id: "base_track_clip",
    name: "Under Cabinet Basic",
    requirements: [
      { tier: 2 as PartTier, family: "any", count: 1 },
      { tier: 1 as PartTier, family: "any", count: 2 },
    ],
    minNeighborhoodId: "starter",
    tags: ["basic"],
  },
  {
    id: "base_track_3",
    name: "Track Trio",
    requirements: [{ tier: 2 as PartTier, family: "any", count: 3 }],
    minNeighborhoodId: "starter",
    tags: ["basic"],
  },
  {
    id: "base_segment_2",
    name: "Clean Corners",
    requirements: [{ tier: 3 as PartTier, family: "any", count: 2 }],
    minNeighborhoodId: "hoa",
    tags: ["mid"],
  },
  {
    id: "base_segment_track",
    name: "Mood Lighting",
    requirements: [
      { tier: 3 as PartTier, family: "any", count: 1 },
      { tier: 2 as PartTier, family: "any", count: 2 },
    ],
    minNeighborhoodId: "hoa",
    tags: ["mid"],
  },
  {
    id: "base_segment_clip",
    name: "Soft Accent",
    requirements: [
      { tier: 3 as PartTier, family: "any", count: 1 },
      { tier: 1 as PartTier, family: "any", count: 2 },
    ],
    minNeighborhoodId: "hoa",
    tags: ["mid"],
  },
  {
    id: "base_segment_3",
    name: "Segment Trio",
    requirements: [{ tier: 3 as PartTier, family: "any", count: 3 }],
    minNeighborhoodId: "hoa",
    tags: ["mid"],
  },
  {
    id: "base_smart_1",
    name: "Smart Upgrade",
    requirements: [{ tier: 4 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "downtown",
    tags: ["high"],
  },
  {
    id: "base_smart_track",
    name: "Smart Upgrade+",
    requirements: [
      { tier: 4 as PartTier, family: "any", count: 1 },
      { tier: 2 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "downtown",
    tags: ["high"],
  },
  {
    id: "base_smart_segment",
    name: "Smart Scene",
    requirements: [
      { tier: 4 as PartTier, family: "any", count: 1 },
      { tier: 3 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "downtown",
    tags: ["high"],
  },
  {
    id: "base_smart_2tracks",
    name: "Smart Runner",
    requirements: [
      { tier: 4 as PartTier, family: "any", count: 1 },
      { tier: 2 as PartTier, family: "any", count: 2 },
    ],
    minNeighborhoodId: "downtown",
    tags: ["high"],
  },
  {
    id: "base_smart_2segments",
    name: "Smart Geometry",
    requirements: [
      { tier: 4 as PartTier, family: "any", count: 1 },
      { tier: 3 as PartTier, family: "any", count: 2 },
    ],
    minNeighborhoodId: "downtown",
    tags: ["high"],
  },
  {
    id: "base_premium_1",
    name: "Premium Client Tease",
    requirements: [{ tier: 5 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "certified",
    tags: ["premium"],
  },
  {
    id: "base_premium_segment",
    name: "Premium Client",
    requirements: [
      { tier: 5 as PartTier, family: "any", count: 1 },
      { tier: 3 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "certified",
    tags: ["premium"],
  },
  {
    id: "base_premium_track",
    name: "Premium Run",
    requirements: [
      { tier: 5 as PartTier, family: "any", count: 1 },
      { tier: 2 as PartTier, family: "any", count: 2 },
    ],
    minNeighborhoodId: "certified",
    tags: ["premium"],
  },
  {
    id: "base_premium_smart",
    name: "Premium Network",
    requirements: [
      { tier: 5 as PartTier, family: "any", count: 1 },
      { tier: 4 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "certified",
    tags: ["premium"],
  },
  {
    id: "base_premium_segment_track",
    name: "Premium Blend",
    requirements: [
      { tier: 5 as PartTier, family: "any", count: 1 },
      { tier: 3 as PartTier, family: "any", count: 1 },
      { tier: 2 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "certified",
    tags: ["premium"],
  },
  {
    id: "base_track_segment",
    name: "Track and Segment",
    requirements: [
      { tier: 2 as PartTier, family: "any", count: 2 },
      { tier: 3 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "hoa",
    tags: ["mid"],
  },
  {
    id: "base_clip_track_segment",
    name: "Trim Mix",
    requirements: [
      { tier: 1 as PartTier, family: "any", count: 1 },
      { tier: 2 as PartTier, family: "any", count: 1 },
      { tier: 3 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "hoa",
    tags: ["mid"],
  },
  {
    id: "base_track_segment2",
    name: "Segment Focus",
    requirements: [
      { tier: 3 as PartTier, family: "any", count: 2 },
      { tier: 2 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "hoa",
    tags: ["mid"],
  },
  {
    id: "base_smart_clip",
    name: "Smart Starter",
    requirements: [
      { tier: 4 as PartTier, family: "any", count: 1 },
      { tier: 1 as PartTier, family: "any", count: 2 },
    ],
    minNeighborhoodId: "downtown",
    tags: ["high"],
  },
  {
    id: "base_segment_smart",
    name: "Segment and Smart",
    requirements: [
      { tier: 3 as PartTier, family: "any", count: 2 },
      { tier: 4 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "downtown",
    tags: ["high"],
  },
  {
    id: "base_array_1",
    name: "Routing Array",
    requirements: [{ tier: 6 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["act2"],
  },
  {
    id: "base_array_segment",
    name: "Corner Mapping",
    requirements: [
      { tier: 6 as PartTier, family: "any", count: 1 },
      { tier: 3 as PartTier, family: "any", count: 2 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["act2"],
  },
  {
    id: "base_spine_1",
    name: "Network Spine",
    requirements: [{ tier: 7 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["act2"],
  },
  {
    id: "base_spine_array",
    name: "Long Run Backbone",
    requirements: [
      { tier: 7 as PartTier, family: "any", count: 1 },
      { tier: 6 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["act2"],
  },
  {
    id: "base_stack_1",
    name: "Control Stack",
    requirements: [{ tier: 8 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["act2"],
  },
  {
    id: "base_stack_smart",
    name: "Controller Sync",
    requirements: [
      { tier: 8 as PartTier, family: "any", count: 1 },
      { tier: 4 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["act2"],
  },
  {
    id: "base_grid_1",
    name: "Signature Grid",
    requirements: [{ tier: 9 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["act2"],
  },
  {
    id: "base_grid_array",
    name: "Facade Rhythm",
    requirements: [
      { tier: 9 as PartTier, family: "any", count: 1 },
      { tier: 6 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["act2"],
  },
  {
    id: "base_kingdom_1",
    name: "Kingdom Install",
    requirements: [{ tier: 10 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["act2", "signature"],
  },
  {
    id: "base_kingdom_spine",
    name: "Legacy Linework",
    requirements: [
      { tier: 10 as PartTier, family: "any", count: 1 },
      { tier: 7 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["act2", "signature"],
  },
  {
    id: "base_lattice_1",
    name: "Civic Lattice",
    requirements: [{ tier: 11 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["act3", "signature"],
  },
  {
    id: "base_lattice_grid",
    name: "Civic Mesh",
    requirements: [
      { tier: 11 as PartTier, family: "any", count: 1 },
      { tier: 9 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["act3", "signature"],
  },
  {
    id: "base_matrix_1",
    name: "Beacon Matrix",
    requirements: [{ tier: 12 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["act3", "signature"],
  },
  {
    id: "base_matrix_lattice",
    name: "Matrix Weave",
    requirements: [
      { tier: 12 as PartTier, family: "any", count: 1 },
      { tier: 11 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["act3", "signature"],
  },
  {
    id: "base_nexus_1",
    name: "Metro Nexus",
    requirements: [{ tier: 13 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["act3", "signature"],
  },
  {
    id: "base_nexus_matrix",
    name: "Nexus Control",
    requirements: [
      { tier: 13 as PartTier, family: "any", count: 1 },
      { tier: 12 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["act3", "signature"],
  },
  {
    id: "base_core_1",
    name: "Skyline Core",
    requirements: [{ tier: 14 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["phase3", "signature"],
  },
  {
    id: "base_core_nexus",
    name: "Core Elevation",
    requirements: [
      { tier: 14 as PartTier, family: "any", count: 1 },
      { tier: 13 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["phase3", "signature"],
  },
  {
    id: "base_atlas_1",
    name: "Atlas Network",
    requirements: [{ tier: 15 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["phase3", "signature"],
  },
  {
    id: "base_atlas_core",
    name: "Atlas Backbone",
    requirements: [
      { tier: 15 as PartTier, family: "any", count: 1 },
      { tier: 14 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["phase3", "signature"],
  },
  {
    id: "base_legacy_1",
    name: "Legacy Standard",
    requirements: [{ tier: 16 as PartTier, family: "any", count: 1 }],
    minNeighborhoodId: "liberation",
    tags: ["phase3", "signature"],
  },
  {
    id: "base_legacy_atlas",
    name: "Standard Bearer",
    requirements: [
      { tier: 16 as PartTier, family: "any", count: 1 },
      { tier: 15 as PartTier, family: "any", count: 1 },
    ],
    minNeighborhoodId: "liberation",
    tags: ["phase3", "signature"],
  },
];

export const ORDER_MODIFIERS: OrderModifier[] = [
  {
    id: "mod_style_open",
    name: "Style Match Open",
    type: "style_match",
    minNeighborhoodId: "hoa",
    styleMatchFamily: "open",
    lockedRequired: false,
    rewardMult: { cash: 1.0, rep: 1.0, research: 1.1 },
  },
  {
    id: "mod_style_locked",
    name: "Style Match Locked",
    type: "style_match",
    minNeighborhoodId: "hoa",
    styleMatchFamily: "locked",
    lockedRequired: false,
    rewardMult: { cash: 1.1, rep: 1.0, research: 1.0 },
  },
  {
    id: "mod_rush_60",
    name: "Rush 60s",
    type: "rush",
    minNeighborhoodId: "downtown",
    rushDeadlineSec: 60,
    noSubstitutions: false,
    ecoAuditBonusResearch: 0,
    lockedRequired: false,
    rewardMult: { cash: 1.2, rep: 1.1, research: 1.0 },
  },
  {
    id: "mod_pref_open",
    name: "Client Prefers Open",
    type: "client_preference",
    minNeighborhoodId: "certified",
    clientPreference: "open",
    noSubstitutions: false,
    ecoAuditBonusResearch: 0,
    lockedRequired: false,
    rewardMult: { cash: 1.0, rep: 1.1, research: 1.1 },
  },
  {
    id: "mod_pref_locked",
    name: "Client Prefers Locked",
    type: "client_preference",
    minNeighborhoodId: "certified",
    clientPreference: "locked",
    noSubstitutions: false,
    ecoAuditBonusResearch: 0,
    lockedRequired: false,
    rewardMult: { cash: 1.1, rep: 1.0, research: 1.0 },
  },
  {
    id: "mod_certified",
    name: "Certified Required",
    type: "certified",
    minNeighborhoodId: "certified",
    noSubstitutions: false,
    ecoAuditBonusResearch: 0,
    lockedRequired: true,
    rewardMult: { cash: 1.2, rep: 1.2, research: 1.0 },
  },
  {
    id: "mod_compatible",
    name: "Compatibility Required",
    type: "compatibility",
    minNeighborhoodId: "liberation",
    rewardMult: { cash: 1.3, rep: 1.2, research: 1.15 },
  },
  {
    id: "mod_no_sub",
    name: "No Substitutions",
    type: "no_substitutions",
    minNeighborhoodId: "lockout",
    noSubstitutions: true,
    ecoAuditBonusResearch: 0,
    lockedRequired: false,
    rewardMult: { cash: 1.0, rep: 1.1, research: 1.0 },
  },
  {
    id: "mod_eco_audit",
    name: "Eco Audit",
    type: "eco_audit",
    minNeighborhoodId: "liberation",
    noSubstitutions: false,
    ecoAuditBonusResearch: 15,
    lockedRequired: false,
    rewardMult: { cash: 1.05, rep: 1.05, research: 1.3 },
  },
];

export const ARCHETYPES: Archetype[] = [
  {
    id: "hoa_enforcer",
    name: "HOA Enforcer",
    flavorLines: [
      "HOA says warm white only",
      "Uniformity is the law",
      "No flicker allowed",
      "Matches matter here",
      "Keep it tidy",
      "The board will measure the glow",
      "No flashing, no surprises",
      "Uniformity gets approvals",
    ],
    preferredModifiers: ["mod_style_open", "mod_style_locked"],
    rewardBias: { cash: 0.9, rep: 1.3, research: 0.8 },
  },
  {
    id: "party_planner",
    name: "Party Planner",
    flavorLines: [
      "Big night big glow",
      "We host tonight",
      "Make it pop",
      "Guests will notice",
      "Fast setup please",
      "Guests arrive in 30",
      "Sparkle, not chaos",
      "Set the mood fast",
    ],
    preferredModifiers: ["mod_rush_60"],
    rewardBias: { cash: 1.2, rep: 1.1, research: 0.8 },
  },
  {
    id: "sports_superfan",
    name: "Sports Superfan",
    flavorLines: [
      "Team colors now",
      "Game day energy",
      "Make it loud",
      "Go time soon",
      "Fast and bright",
      "Kickoff in 60",
      "Victory colors only",
      "Stadium vibes, home edition",
    ],
    preferredModifiers: ["mod_rush_60"],
    rewardBias: { cash: 1.2, rep: 1.0, research: 0.8 },
  },
  {
    id: "cozy_minimalist",
    name: "Cozy Minimalist",
    flavorLines: [
      "Subtle glow no wires",
      "Quiet elegance only",
      "Soft light please",
      "No flashing ever",
      "Open and calm",
      "Calm light, hidden wiring",
      "Warm and clean, no glare",
      "Keep it simple",
    ],
    preferredModifiers: ["mod_pref_open", "mod_eco_audit"],
    rewardBias: { cash: 0.9, rep: 1.0, research: 1.3 },
  },
  {
    id: "tech_dad",
    name: "Tech Dad",
    flavorLines: [
      "I read the spec sheet",
      "Certified only please",
      "App control matters",
      "Firmware is serious",
      "Show me the standard",
      "No glitches at 9pm",
      "Control panels first",
      "Logs or it did not happen",
    ],
    preferredModifiers: ["mod_certified", "mod_pref_locked"],
    rewardBias: { cash: 1.1, rep: 1.0, research: 1.1 },
  },
  {
    id: "subscription_skeptic",
    name: "Subscription Skeptic",
    flavorLines: [
      "No subscriptions please",
      "Open is safer",
      "No cloud control",
      "Own it forever",
      "Keep it simple",
      "Local control only",
      "No logins, no lock-in",
      "I want the switch in my hand",
    ],
    preferredModifiers: ["mod_pref_open"],
    rewardBias: { cash: 1.0, rep: 1.1, research: 1.2 },
  },
  {
    id: "boutique_owner",
    name: "Boutique Owner",
    flavorLines: [
      "Window display needs polish",
      "Make it premium",
      "Refined and bright",
      "Gallery glow only",
      "Style is everything",
      "Foot traffic follows the light",
      "Elegant, not flashy",
      "Lux matters",
    ],
    preferredModifiers: ["mod_pref_locked"],
    rewardBias: { cash: 1.2, rep: 1.0, research: 0.9 },
  },
  {
    id: "neighbor_rival",
    name: "Neighbor Rival",
    flavorLines: [
      "Brighter than the Joneses",
      "We must win tonight",
      "Do not hold back",
      "They will notice",
      "Show off the edge",
      "No half measures",
      "We win this block",
      "Let them notice",
    ],
    preferredModifiers: ["mod_pref_locked"],
    rewardBias: { cash: 1.3, rep: 1.0, research: 0.8 },
  },
];

export const ORDER_OVERRIDES: OrderOverride[] = [
  {
    id: "ord_001",
    baseId: "base_clip_2",
    archetypeId: "cozy_minimalist",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Soft Start",
    flavorOverride: "Keep it subtle. First impressions matter.",
  },
  {
    id: "ord_002",
    baseId: "base_clip_3",
    archetypeId: "party_planner",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Warm Welcome",
    flavorOverride: "We host tonight. Make it cozy.",
  },
  {
    id: "ord_003",
    baseId: "base_clip_2",
    archetypeId: "hoa_enforcer",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Starter Compliance",
    flavorOverride: "Simple and uniform",
  },
  {
    id: "ord_004",
    baseId: "base_track_2",
    archetypeId: "sports_superfan",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Game Day Prep",
    flavorOverride: "Team colors",
  },
  {
    id: "ord_005",
    baseId: "base_track_clip",
    archetypeId: "subscription_skeptic",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "No Strings Attached",
    flavorOverride: "No app. No fuss.",
  },
  {
    id: "ord_006",
    baseId: "base_track_3",
    archetypeId: "party_planner",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Patio Kickoff",
    flavorOverride: "We are hosting tonight.",
  },
  {
    id: "ord_007",
    baseId: "base_clip_4",
    archetypeId: "neighbor_rival",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Brighter Than The Joneses",
    flavorOverride: "We cannot lose this year.",
  },
  {
    id: "ord_008",
    baseId: "base_track_2",
    archetypeId: "cozy_minimalist",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Quiet Glow",
    flavorOverride: "Soft light only.",
  },
  {
    id: "ord_009",
    baseId: "base_clip_3",
    archetypeId: "sports_superfan",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Pre Game Warmup",
    flavorOverride: "Warm the house",
  },
  {
    id: "ord_010",
    baseId: "base_track_clip",
    archetypeId: "hoa_enforcer",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Uniform Trim",
    flavorOverride: "Edges must match.",
  },
  {
    id: "ord_011",
    baseId: "base_clip_2",
    archetypeId: "subscription_skeptic",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "No Subscription",
    flavorOverride: "I want to own the lights.",
  },
  {
    id: "ord_012",
    baseId: "base_track_3",
    archetypeId: "tech_dad",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Baseline Install",
    flavorOverride: "Just the basics for now.",
  },
  {
    id: "ord_013",
    baseId: "base_track_2",
    archetypeId: "boutique_owner",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Shopfront Tease",
    flavorOverride: "A hint of glow sells.",
  },
  {
    id: "ord_014",
    baseId: "base_clip_3",
    archetypeId: "party_planner",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Welcome Line",
    flavorOverride: "Simple line",
  },
  {
    id: "ord_015",
    baseId: "base_track_clip",
    archetypeId: "cozy_minimalist",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Cabinet Calm",
    flavorOverride: "No glare please.",
  },
  {
    id: "ord_016",
    baseId: "base_clip_4",
    archetypeId: "hoa_enforcer",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "HOA Trial",
    flavorOverride: "Show me you can comply.",
  },
  {
    id: "ord_017",
    baseId: "base_track_2",
    archetypeId: "neighbor_rival",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Sidewalk Flex",
    flavorOverride: "People notice the corners.",
  },
  {
    id: "ord_018",
    baseId: "base_track_3",
    archetypeId: "subscription_skeptic",
    neighborhoodId: "starter",
    weight: 1.0,
    titleOverride: "Local Only",
    flavorOverride: "No cloud control needed.",
  },
  {
    id: "ord_019",
    baseId: "base_segment_2",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "HOA Harmony Open",
    flavorOverride: "Uniform warm white only.",
  },
  {
    id: "ord_020",
    baseId: "base_segment_2",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "HOA Harmony Locked",
    flavorOverride: "Certified uniformity demanded.",
  },
  {
    id: "ord_021",
    baseId: "base_segment_track",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Soft Corners",
    flavorOverride: "Clean lines. Open only.",
  },
  {
    id: "ord_022",
    baseId: "base_segment_clip",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "No Strings Open",
    flavorOverride: "Open parts only.",
  },
  {
    id: "ord_023",
    baseId: "base_segment_3",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Locked Showcase",
    flavorOverride: "Bring the premium glow.",
  },
  {
    id: "ord_024",
    baseId: "base_track_segment",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Team Borderline",
    flavorOverride: "Locked set for reliability.",
  },
  {
    id: "ord_025",
    baseId: "base_segment_2",
    archetypeId: "party_planner",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Porch Party Prep",
    flavorOverride: "Open only to keep it calm.",
  },
  {
    id: "ord_026",
    baseId: "base_segment_track",
    archetypeId: "tech_dad",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Certified Trim",
    flavorOverride: "Locked for consistency.",
  },
  {
    id: "ord_027",
    baseId: "base_segment_clip",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "HOA Inspect",
    flavorOverride: "Open set only.",
  },
  {
    id: "ord_028",
    baseId: "base_segment_3",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Gallery Line",
    flavorOverride: "Open and refined.",
  },
  {
    id: "ord_029",
    baseId: "base_track_segment",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Minimal Match",
    flavorOverride: "Match the set.",
  },
  {
    id: "ord_030",
    baseId: "base_segment_track",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Gold Standard",
    flavorOverride: "Locked set only.",
  },
  {
    id: "ord_031",
    baseId: "base_segment_2",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Open Compliance",
    flavorOverride: "Only open kits.",
  },
  {
    id: "ord_032",
    baseId: "base_segment_clip",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Stadium Mood",
    flavorOverride: "Locked set for stability.",
  },
  {
    id: "ord_033",
    baseId: "base_segment_3",
    archetypeId: "party_planner",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Soft Parade",
    flavorOverride: "Open only glow.",
  },
  {
    id: "ord_034",
    baseId: "base_track_segment",
    archetypeId: "tech_dad",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Spec Sheet Match",
    flavorOverride: "Locked set required.",
  },
  {
    id: "ord_035",
    baseId: "base_segment_track",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Uniform Lines",
    flavorOverride: "One family only.",
  },
  {
    id: "ord_036",
    baseId: "base_segment_2",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "hoa",
    weight: 1.0,
    titleOverride: "Showroom Uniform",
    flavorOverride: "Locked uniformity.",
  },
  {
    id: "ord_037",
    baseId: "base_smart_1",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Game Day Rush",
    flavorOverride: "Kickoff in sixty seconds.",
  },
  {
    id: "ord_038",
    baseId: "base_smart_track",
    archetypeId: "party_planner",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Event Sprint",
    flavorOverride: "Doors open soon.",
  },
  {
    id: "ord_039",
    baseId: "base_smart_segment",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Window Launch",
    flavorOverride: "We go live now.",
  },
  {
    id: "ord_040",
    baseId: "base_smart_1",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Quiet Tech",
    flavorOverride: "Open only. Soft glow.",
  },
  {
    id: "ord_041",
    baseId: "base_smart_track",
    archetypeId: "tech_dad",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Stable Build",
    flavorOverride: "Locked set for stability.",
  },
  {
    id: "ord_042",
    baseId: "base_smart_segment",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Open Spec",
    flavorOverride: "No lock in please.",
  },
  {
    id: "ord_043",
    baseId: "base_track_segment2",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Quick Sweep",
    flavorOverride: "Fast fast fast.",
  },
  {
    id: "ord_044",
    baseId: "base_segment_smart",
    archetypeId: "party_planner",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Stage Trim",
    flavorOverride: "We are already late.",
  },
  {
    id: "ord_045",
    baseId: "base_smart_2tracks",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_style_locked"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Elite Edge",
    flavorOverride: "Locked only. No compromise.",
  },
  {
    id: "ord_046",
    baseId: "base_smart_clip",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Open Accent",
    flavorOverride: "Open family only.",
  },
  {
    id: "ord_047",
    baseId: "base_smart_track",
    archetypeId: "boutique_owner",
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Downtown Glow",
    flavorOverride: "Clean bright precise.",
  },
  {
    id: "ord_048",
    baseId: "base_smart_1",
    archetypeId: "subscription_skeptic",
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Simple Smart",
    flavorOverride: "No extras just works.",
  },
  {
    id: "ord_049",
    baseId: "base_smart_segment",
    archetypeId: "tech_dad",
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Feature Prep",
    flavorOverride: "Ready for app control.",
  },
  {
    id: "ord_050",
    baseId: "base_track_segment2",
    archetypeId: "party_planner",
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Crowd Ready",
    flavorOverride: "Get the street glowing.",
  },
  {
    id: "ord_051",
    baseId: "base_smart_2tracks",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Final Buzzer",
    flavorOverride: "Clock is ticking.",
  },
  {
    id: "ord_052",
    baseId: "base_segment_smart",
    archetypeId: "neighbor_rival",
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Block Leader",
    flavorOverride: "Must outshine them.",
  },
  {
    id: "ord_053",
    baseId: "base_smart_clip",
    archetypeId: "boutique_owner",
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "Gallery Accent",
    flavorOverride: "A hint of premium.",
  },
  {
    id: "ord_054",
    baseId: "base_premium_1",
    archetypeId: "party_planner",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "downtown",
    weight: 1.0,
    titleOverride: "VIP Reveal",
    flavorOverride: "VIP arrives in sixty.",
  },
  {
    id: "ord_055",
    baseId: "base_premium_1",
    archetypeId: "tech_dad",
    modifierIds: ["mod_certified"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Certified Showcase",
    flavorOverride: "Only certified kits.",
  },
  {
    id: "ord_056",
    baseId: "base_premium_segment",
    archetypeId: "tech_dad",
    modifierIds: ["mod_certified"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Certified Feature",
    flavorOverride: "Approved components only.",
  },
  {
    id: "ord_057",
    baseId: "base_smart_1",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_pref_open"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Open Preferred",
    flavorOverride: "Prefer open systems.",
  },
  {
    id: "ord_058",
    baseId: "base_smart_track",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_pref_open"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Open Leaning",
    flavorOverride: "Open parts favored.",
  },
  {
    id: "ord_059",
    baseId: "base_smart_segment",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_pref_locked"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Locked Preferred",
    flavorOverride: "Locked for reliability.",
  },
  {
    id: "ord_060",
    baseId: "base_track_segment2",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_pref_locked"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Locked Edge",
    flavorOverride: "Locked parts pay full.",
  },
  {
    id: "ord_061",
    baseId: "base_premium_track",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_pref_locked"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Showroom Standard",
    flavorOverride: "Locked preferred.",
  },
  {
    id: "ord_062",
    baseId: "base_premium_segment",
    archetypeId: "party_planner",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Night Launch",
    flavorOverride: "We open in one hour.",
  },
  {
    id: "ord_063",
    baseId: "base_premium_smart",
    archetypeId: "tech_dad",
    modifierIds: ["mod_certified"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Certified Network",
    flavorOverride: "Controller certified only.",
  },
  {
    id: "ord_064",
    baseId: "base_smart_2segments",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_pref_open"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Eco Lean",
    flavorOverride: "Open systems preferred.",
  },
  {
    id: "ord_065",
    baseId: "base_premium_segment_track",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Prime Time",
    flavorOverride: "Countdown starts now.",
  },
  {
    id: "ord_066",
    baseId: "base_smart_2tracks",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_pref_open"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Open Bias",
    flavorOverride: "Open parts pay full.",
  },
  {
    id: "ord_067",
    baseId: "base_premium_1",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_pref_locked"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Neighborhood Flex",
    flavorOverride: "Locked parts for full payout.",
  },
  {
    id: "ord_068",
    baseId: "base_smart_segment",
    archetypeId: "boutique_owner",
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "City Signature",
    flavorOverride: "Polished and precise.",
  },
  {
    id: "ord_069",
    baseId: "base_premium_smart",
    archetypeId: "party_planner",
    modifierIds: ["mod_pref_locked"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Gala Standard",
    flavorOverride: "Locked preferred for full tips.",
  },
  {
    id: "ord_070",
    baseId: "base_smart_track",
    archetypeId: "tech_dad",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Patch Window",
    flavorOverride: "Need it before update.",
  },
  {
    id: "ord_071",
    baseId: "base_premium_track",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_certified"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Certified Stadium",
    flavorOverride: "Certified installs only.",
  },
  {
    id: "ord_072",
    baseId: "base_smart_1",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_pref_open"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Open Compliance",
    flavorOverride: "Prefer open systems.",
  },
  {
    id: "ord_073",
    baseId: "base_premium_segment",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_certified"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Certified Gallery",
    flavorOverride: "Official kits only.",
  },
  {
    id: "ord_074",
    baseId: "base_smart_segment",
    archetypeId: "party_planner",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "certified",
    weight: 1.0,
    titleOverride: "Event Clock",
    flavorOverride: "We are down to the wire.",
  },
  {
    id: "ord_075",
    baseId: "base_premium_1",
    archetypeId: "tech_dad",
    modifierIds: ["mod_certified", "mod_no_sub"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Firmware Required",
    flavorOverride: "Exact certified parts only.",
  },
  {
    id: "ord_076",
    baseId: "base_premium_smart",
    archetypeId: "tech_dad",
    modifierIds: ["mod_certified", "mod_no_sub"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Locked Only",
    flavorOverride: "No substitutes allowed.",
  },
  {
    id: "ord_077",
    baseId: "base_premium_segment",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_certified"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Lockout Prime",
    flavorOverride: "Locked kits required.",
  },
  {
    id: "ord_078",
    baseId: "base_smart_1",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_certified", "mod_no_sub"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "No Swaps",
    flavorOverride: "Locked only. No swaps.",
  },
  {
    id: "ord_079",
    baseId: "base_smart_segment",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_certified", "mod_no_sub"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Showcase Compliance",
    flavorOverride: "Exact certified kit.",
  },
  {
    id: "ord_080",
    baseId: "base_premium_track",
    archetypeId: "party_planner",
    modifierIds: ["mod_rush_60", "mod_certified"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Emergency Glow",
    flavorOverride: "Certified and fast.",
  },
  {
    id: "ord_081",
    baseId: "base_smart_2tracks",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_pref_open"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Open Pushback",
    flavorOverride: "Open preferred but time is short.",
  },
  {
    id: "ord_082",
    baseId: "base_premium_segment_track",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_certified", "mod_rush_60"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Broadcast Lock",
    flavorOverride: "Locked kits before airtime.",
  },
  {
    id: "ord_083",
    baseId: "base_premium_1",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_certified", "mod_no_sub"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "HOA Lock",
    flavorOverride: "Exact certified only.",
  },
  {
    id: "ord_084",
    baseId: "base_smart_2segments",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_pref_open"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Open Relief",
    flavorOverride: "Prefer open. Keep it calm.",
  },
  {
    id: "ord_085",
    baseId: "base_premium_smart",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_certified"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Authorized Install",
    flavorOverride: "Approved systems required.",
  },
  {
    id: "ord_086",
    baseId: "base_smart_track",
    archetypeId: "tech_dad",
    modifierIds: ["mod_certified"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "Patch Compliance",
    flavorOverride: "Certified to avoid refunds.",
  },
  {
    id: "ord_087",
    baseId: "base_premium_segment",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_certified", "mod_no_sub"],
    neighborhoodId: "lockout",
    weight: 1.0,
    titleOverride: "No Compromise",
    flavorOverride: "Locked only. Exact tiers.",
  },
  {
    id: "ord_088",
    baseId: "base_smart_1",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_eco_audit"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Eco Audit",
    flavorOverride: "Open kits earn research.",
  },
  {
    id: "ord_089",
    baseId: "base_smart_track",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_pref_open", "mod_eco_audit"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Open Audit",
    flavorOverride: "Open preferred for full credit.",
  },
  {
    id: "ord_090",
    baseId: "base_segment_smart",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_style_open", "mod_eco_audit"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Open Standard",
    flavorOverride: "Open family only.",
  },
  {
    id: "ord_091",
    baseId: "base_smart_segment",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_eco_audit"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Green Gallery",
    flavorOverride: "Open kits rewarded.",
  },
  {
    id: "ord_092",
    baseId: "base_premium_segment",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Championship Run",
    flavorOverride: "Fast clean bright.",
  },
  {
    id: "ord_093",
    baseId: "base_premium_smart",
    archetypeId: "tech_dad",
    modifierIds: ["mod_certified", "mod_no_sub"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Exact Build",
    flavorOverride: "Exact tiers only.",
  },
  {
    id: "ord_094",
    baseId: "base_smart_2tracks",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_pref_open", "mod_eco_audit"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Open Priority",
    flavorOverride: "Open parts preferred.",
  },
  {
    id: "ord_095",
    baseId: "base_smart_2segments",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_eco_audit"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Research Credit",
    flavorOverride: "Open kits boost research.",
  },
  {
    id: "ord_096",
    baseId: "base_premium_track",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_eco_audit", "mod_pref_open"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Sustainable Showcase",
    flavorOverride: "Open preferred with research bonus.",
  },
  {
    id: "ord_097",
    baseId: "base_smart_track",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_rush_60"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Rapid Sweep",
    flavorOverride: "We are live in sixty.",
  },
  {
    id: "ord_098",
    baseId: "base_smart_2segments",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_certified", "mod_no_sub"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Exact Standards",
    flavorOverride: "Exact tiers only.",
  },
  {
    id: "ord_099",
    baseId: "base_smart_segment",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_style_open"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Open Uniformity",
    flavorOverride: "Open set only.",
  },
  {
    id: "ord_100",
    baseId: "base_premium_segment_track",
    archetypeId: "cozy_minimalist",
    modifierIds: ["mod_eco_audit"],
    neighborhoodId: "liberation",
    weight: 1.0,
    titleOverride: "Quiet Freedom",
    flavorOverride: "Open kits. Calm glow.",
  },
  {
    id: "ord_101",
    baseId: "base_smart_1",
    archetypeId: "subscription_skeptic",
    modifierIds: ["mod_compatible"],
    neighborhoodId: "liberation",
    weight: 0.7,
    titleOverride: "Interop Upgrade",
    flavorOverride: "Only open‑compatible kits accepted.",
  },
  {
    id: "ord_102",
    baseId: "base_segment_smart",
    archetypeId: "tech_dad",
    modifierIds: ["mod_compatible"],
    neighborhoodId: "liberation",
    weight: 0.6,
    titleOverride: "Liberated Control",
    flavorOverride: "Needs a compatible core.",
  },
  {
    id: "ord_103",
    baseId: "base_premium_1",
    archetypeId: "boutique_owner",
    modifierIds: ["mod_compatible"],
    neighborhoodId: "liberation",
    weight: 0.5,
    titleOverride: "Interop Showcase",
    flavorOverride: "Only liberated systems permitted.",
  },
  {
    id: "ord_104",
    baseId: "base_premium_track",
    archetypeId: "neighbor_rival",
    modifierIds: ["mod_compatible"],
    neighborhoodId: "liberation",
    weight: 0.5,
    titleOverride: "Freedom Run",
    flavorOverride: "Compatible rigs only. We’re done with lock‑in.",
  },
  {
    id: "ord_105",
    baseId: "base_premium_smart",
    archetypeId: "sports_superfan",
    modifierIds: ["mod_compatible"],
    neighborhoodId: "liberation",
    weight: 0.4,
    titleOverride: "Interop Network",
    flavorOverride: "Certified? No. Compatible, yes.",
  },
  {
    id: "ord_106",
    baseId: "base_smart_segment",
    archetypeId: "hoa_enforcer",
    modifierIds: ["mod_compatible"],
    neighborhoodId: "liberation",
    weight: 0.6,
    titleOverride: "Liberation Standards",
    flavorOverride: "Open‑compatible compliance required.",
  },
  {
    id: "ord_200",
    baseId: "base_array_1",
    archetypeId: "cozy_minimalist",
    neighborhoodId: "liberation",
    weight: 0.6,
    titleOverride: "Roofline Array",
    flavorOverride: "Clean lines, no glare.",
  },
  {
    id: "ord_201",
    baseId: "base_array_segment",
    archetypeId: "hoa_enforcer",
    neighborhoodId: "liberation",
    weight: 0.5,
    titleOverride: "Corner Mapping",
    flavorOverride: "Precise routing at every edge.",
  },
  {
    id: "ord_202",
    baseId: "base_spine_1",
    archetypeId: "neighbor_rival",
    neighborhoodId: "liberation",
    weight: 0.45,
    titleOverride: "Network Spine",
    flavorOverride: "Go brighter than the block.",
  },
  {
    id: "ord_203",
    baseId: "base_spine_array",
    archetypeId: "boutique_owner",
    neighborhoodId: "liberation",
    weight: 0.4,
    titleOverride: "Backbone Run",
    flavorOverride: "Elegant, structured, no slack.",
  },
  {
    id: "ord_204",
    baseId: "base_stack_1",
    archetypeId: "party_planner",
    neighborhoodId: "liberation",
    weight: 0.4,
    titleOverride: "Controller Stack",
    flavorOverride: "Multiple scenes, quick swap.",
  },
  {
    id: "ord_205",
    baseId: "base_stack_smart",
    archetypeId: "sports_superfan",
    neighborhoodId: "liberation",
    weight: 0.35,
    titleOverride: "Sync Pass",
    flavorOverride: "Colors hit together, no lag.",
  },
  {
    id: "ord_206",
    baseId: "base_grid_1",
    archetypeId: "subscription_skeptic",
    neighborhoodId: "liberation",
    weight: 0.3,
    titleOverride: "Signature Grid",
    flavorOverride: "Minimal control, maximum impact.",
  },
  {
    id: "ord_207",
    baseId: "base_grid_array",
    archetypeId: "cozy_minimalist",
    neighborhoodId: "liberation",
    weight: 0.3,
    titleOverride: "Facade Rhythm",
    flavorOverride: "Even cadence, soft glow.",
  },
  {
    id: "ord_208",
    baseId: "base_kingdom_1",
    archetypeId: "boutique_owner",
    neighborhoodId: "liberation",
    weight: 0.2,
    titleOverride: "Kingdom Install",
    flavorOverride: "A flagship build, flawless finish.",
  },
  {
    id: "ord_209",
    baseId: "base_kingdom_spine",
    archetypeId: "neighbor_rival",
    neighborhoodId: "liberation",
    weight: 0.18,
    titleOverride: "Legacy Linework",
    flavorOverride: "Make the whole street stare.",
  },
  {
    id: "ord_210",
    baseId: "base_lattice_1",
    archetypeId: "boutique_owner",
    neighborhoodId: "liberation",
    weight: 0.16,
    titleOverride: "Civic Lattice",
    flavorOverride: "The boulevard wants precision and presence.",
  },
  {
    id: "ord_211",
    baseId: "base_lattice_grid",
    archetypeId: "cozy_minimalist",
    neighborhoodId: "liberation",
    weight: 0.15,
    titleOverride: "Civic Mesh",
    flavorOverride: "Layer the skyline with a calm rhythm.",
  },
  {
    id: "ord_212",
    baseId: "base_matrix_1",
    archetypeId: "sports_superfan",
    neighborhoodId: "liberation",
    weight: 0.14,
    titleOverride: "Beacon Matrix",
    flavorOverride: "Visibility from blocks away, no dead zones.",
  },
  {
    id: "ord_213",
    baseId: "base_matrix_lattice",
    archetypeId: "neighbor_rival",
    neighborhoodId: "liberation",
    weight: 0.13,
    titleOverride: "Matrix Weave",
    flavorOverride: "Elegant routing with heavyweight output.",
  },
  {
    id: "ord_214",
    baseId: "base_nexus_1",
    archetypeId: "party_planner",
    neighborhoodId: "liberation",
    weight: 0.12,
    titleOverride: "Metro Nexus",
    flavorOverride: "Sync every district edge in one pass.",
  },
  {
    id: "ord_215",
    baseId: "base_nexus_matrix",
    archetypeId: "subscription_skeptic",
    neighborhoodId: "liberation",
    weight: 0.11,
    titleOverride: "Nexus Control",
    flavorOverride: "Strong backbone, no locked surprises.",
  },
  {
    id: "ord_216",
    baseId: "base_core_1",
    archetypeId: "boutique_owner",
    neighborhoodId: "liberation",
    weight: 0.1,
    titleOverride: "Skyline Core",
    flavorOverride: "This one defines the district silhouette.",
  },
  {
    id: "ord_217",
    baseId: "base_core_nexus",
    archetypeId: "neighbor_rival",
    neighborhoodId: "liberation",
    weight: 0.095,
    titleOverride: "Core Elevation",
    flavorOverride: "Tight sequencing, zero drift.",
  },
  {
    id: "ord_218",
    baseId: "base_atlas_1",
    archetypeId: "party_planner",
    neighborhoodId: "liberation",
    weight: 0.09,
    titleOverride: "Atlas Network",
    flavorOverride: "Run city-scale patterns without missing a beat.",
  },
  {
    id: "ord_219",
    baseId: "base_atlas_core",
    archetypeId: "sports_superfan",
    neighborhoodId: "liberation",
    weight: 0.085,
    titleOverride: "Atlas Backbone",
    flavorOverride: "Big build energy, flawless control.",
  },
  {
    id: "ord_220",
    baseId: "base_legacy_1",
    archetypeId: "subscription_skeptic",
    neighborhoodId: "liberation",
    weight: 0.08,
    titleOverride: "Legacy Standard",
    flavorOverride: "The city uses this as the benchmark now.",
  },
  {
    id: "ord_221",
    baseId: "base_legacy_atlas",
    archetypeId: "cozy_minimalist",
    neighborhoodId: "liberation",
    weight: 0.075,
    titleOverride: "Standard Bearer",
    flavorOverride: "Pure signal. No compromise.",
  },
];

const TIER_CASH = {
  1: 10,
  2: 30,
  3: 50,
  4: 200,
  5: 500,
  6: 900,
  7: 1400,
  8: 2000,
  9: 2800,
  10: 3800,
  11: 5000,
  12: 6500,
  13: 8300,
  14: 10400,
  15: 12800,
  16: 15500,
} as const;

const TIER_RESEARCH = {
  1: 0,
  2: 0,
  3: 3,
  4: 6,
  5: 15,
  6: 24,
  7: 34,
  8: 46,
  9: 60,
  10: 75,
  11: 95,
  12: 118,
  13: 144,
  14: 173,
  15: 205,
  16: 240,
} as const;

const PREMIUM_MULT = 1.2;

const NEIGHBORHOOD_REWARD_MULT: Record<
  string,
  { cash: number; rep: number; research: number }
> = {
  starter: { cash: 0.65, rep: 0.6, research: 0.3 },
  hoa: { cash: 0.85, rep: 0.8, research: 0.6 },
  downtown: { cash: 1.0, rep: 1.0, research: 0.8 },
  certified: { cash: 1.2, rep: 1.15, research: 1.0 },
  lockout: { cash: 1.35, rep: 1.25, research: 1.1 },
  liberation: { cash: 1.3, rep: 1.2, research: 1.35 },
};

function sumWeights(reqs: OrderRequirement[]) {
  let cash = 0;
  let research = 0;
  let maxTier = 1;
  for (const req of reqs) {
    cash += (TIER_CASH as any)[req.tier] * req.count;
    research += (TIER_RESEARCH as any)[req.tier] * req.count;
    if (req.tier > maxTier) maxTier = req.tier;
  }
  if (maxTier >= 5) {
    cash *= PREMIUM_MULT;
  }
  const rep = Math.round(cash * (maxTier >= 5 ? 0.25 : 0.2));
  return {
    cash: Math.round(cash),
    rep,
    research: Math.round(research),
    maxTier,
  };
}

export function computeCustomOrderRewards({
  requirements,
  neighborhoodId,
  modifierIds,
  archetypeId,
  rewardOverride,
}: {
  requirements: OrderRequirement[];
  neighborhoodId: string;
  modifierIds?: string[];
  archetypeId?: string;
  rewardOverride?: Partial<{ cash: number; rep: number; research: number }>;
}): { cash: number; reputation: number; research: number } {
  const weights = sumWeights(requirements);
  let cash = weights.cash;
  let rep = weights.rep;
  let research = weights.research;

  if (archetypeId) {
    const archetype = ARCHETYPES.find((a) => a.id === archetypeId);
    if (archetype) {
      cash = Math.round(cash * archetype.rewardBias.cash);
      rep = Math.round(rep * archetype.rewardBias.rep);
      research = Math.round(research * archetype.rewardBias.research);
    }
  }

  const modMap = new Map(ORDER_MODIFIERS.map((m) => [m.id, m]));
  const modifiers = (modifierIds || [])
    .map((id) => modMap.get(id))
    .filter(Boolean) as OrderModifier[];
  for (const mod of modifiers) {
    if (mod.rewardMult) {
      cash = Math.round(cash * mod.rewardMult.cash);
      rep = Math.round(rep * mod.rewardMult.rep);
      research = Math.round(research * mod.rewardMult.research);
    }
  }

  const neighborhoodMult =
    NEIGHBORHOOD_REWARD_MULT[neighborhoodId] ||
    NEIGHBORHOOD_REWARD_MULT.starter;
  cash = Math.round(cash * neighborhoodMult.cash);
  rep = Math.round(rep * neighborhoodMult.rep);
  research = Math.round(research * neighborhoodMult.research);

  if (rewardOverride) {
    cash = rewardOverride.cash ?? cash;
    rep = rewardOverride.rep ?? rep;
    research = rewardOverride.research ?? research;
  }

  return { cash, reputation: rep, research };
}

export const ORDER_LIBRARY: OrderTemplate[] = (() => {
  const baseMap = new Map(BASE_RECIPES.map((b) => [b.id, b]));
  const modMap = new Map(ORDER_MODIFIERS.map((m) => [m.id, m]));
  const archetypeMap = new Map(ARCHETYPES.map((a) => [a.id, a]));

  const overrides = ORDER_OVERRIDES.map((ov) => {
    const base = baseMap.get(ov.baseId);
    if (!base) {
      throw new Error(`Missing base recipe: ${ov.baseId}`);
    }
    const archetype = archetypeMap.get(ov.archetypeId);
    const modifiers = (ov.modifierIds || [])
      .map((id) => modMap.get(id))
      .filter(Boolean) as OrderModifier[];

    let requirements = base.requirements.map((r) => ({ ...r }));

    let type: OrderType = base.requirements.some((r) => r.tier >= 5)
      ? "premium"
      : "basic";
    let rushDeadline: number | undefined;
    let familyPreference: OrderFamilyPreference | undefined;
    let penaltyIfWrongFamily: boolean | undefined;
    let ecoAuditBonusResearch: number | undefined;
    let noSubstitutions: boolean | undefined;

    for (const mod of modifiers) {
      if (mod.type === "style_match" && mod.styleMatchFamily) {
        type = "style_match";
        requirements = requirements.map((r) => ({
          ...r,
          family: mod.styleMatchFamily!,
        }));
      }
      if (mod.type === "rush" && mod.rushDeadlineSec) {
        rushDeadline = mod.rushDeadlineSec * 1000;
      }
      if (mod.type === "certified") {
        type = "locked_required";
        requirements = requirements.map((r) => ({ ...r, family: "locked" }));
      }
      if (mod.type === "compatibility") {
        type = "compatibility_required";
        const maxTier = Math.max(...requirements.map((r) => r.tier));
        requirements = requirements.map((r) =>
          r.tier === maxTier
            ? { ...r, family: "open", requiresCompatible: true }
            : { ...r },
        );
      }
      if (mod.type === "client_preference" && mod.clientPreference) {
        familyPreference = mod.clientPreference;
        penaltyIfWrongFamily = true;
        if (mod.clientPreference === "locked" && type === "basic") {
          type = "baron_certified";
        }
      }
      if (mod.type === "eco_audit" && mod.ecoAuditBonusResearch) {
        ecoAuditBonusResearch = mod.ecoAuditBonusResearch;
      }
      if (mod.type === "no_substitutions") {
        noSubstitutions = true;
      }
    }

    const weights = sumWeights(requirements);
    let cash = weights.cash;
    let rep = weights.rep;
    let research = weights.research;

    if (archetype) {
      cash = Math.round(cash * archetype.rewardBias.cash);
      rep = Math.round(rep * archetype.rewardBias.rep);
      research = Math.round(research * archetype.rewardBias.research);
    }

    for (const mod of modifiers) {
      if (mod.rewardMult) {
        cash = Math.round(cash * mod.rewardMult.cash);
        rep = Math.round(rep * mod.rewardMult.rep);
        research = Math.round(research * mod.rewardMult.research);
      }
    }

    const neighborhoodMult =
      NEIGHBORHOOD_REWARD_MULT[ov.neighborhoodId] ||
      NEIGHBORHOOD_REWARD_MULT.starter;
    cash = Math.round(cash * neighborhoodMult.cash);
    rep = Math.round(rep * neighborhoodMult.rep);
    research = Math.round(research * neighborhoodMult.research);

    if (ov.rewardOverride) {
      cash = ov.rewardOverride.cash ?? cash;
      rep = ov.rewardOverride.rep ?? rep;
      research = ov.rewardOverride.research ?? research;
    }

    const trimmedFlavor = ov.flavorOverride?.trim();

    return {
      templateId: ov.id,
      title: ov.titleOverride || base.name,
      type,
      requirements,
      rewards: { cash, reputation: rep, research },
      rushDeadline,
      familyPreference,
      penaltyIfWrongFamily,
      ecoAuditBonusResearch,
      noSubstitutions,
      modifierIds: ov.modifierIds,
      archetypeId: ov.archetypeId,
      minNeighborhoodId: ov.neighborhoodId,
      weight: ov.weight || 1,
      flavorText: trimmedFlavor || undefined,
    };
  });

  const labTemplates: OrderTemplate[] = [
    {
      templateId: "lab_request_1",
      title: "Lab Request",
      type: "lab_request",
      requirements: [{ tier: 3 as PartTier, family: "open", count: 1 }],
      rewards: { cash: 100, reputation: 15, research: 30 },
      minNeighborhoodId: "certified",
      weight: 0.6,
    },
    {
      templateId: "lab_request_2",
      title: "Lab Request+",
      type: "lab_request",
      requirements: [{ tier: 4 as PartTier, family: "open", count: 1 }],
      rewards: { cash: 150, reputation: 22, research: 38 },
      minNeighborhoodId: "certified",
      weight: 0.4,
    },
  ];

  return [...overrides, ...labTemplates];
})();
