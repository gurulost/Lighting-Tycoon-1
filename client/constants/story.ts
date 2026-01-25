export type StorySpeaker = "mentor" | "baron" | "customer" | "system" | "rd";

export interface StoryBeat {
  id: string;
  speaker: StorySpeaker;
  line1: string;
  line2?: string;
  onceOnly?: boolean;
}

export const STORY_BEATS: Record<string, StoryBeat> = {
  neighborhood_starter: {
    id: "neighborhood_starter",
    speaker: "system",
    line1: "Neighborhood unlocked: Starter Street.",
    onceOnly: true,
  },
  neighborhood_hoa: {
    id: "neighborhood_hoa",
    speaker: "customer",
    line1: "Welcome to HOA Heights. Uniformity is the law here.",
    onceOnly: true,
  },
  neighborhood_downtown: {
    id: "neighborhood_downtown",
    speaker: "customer",
    line1: "Downtown wants game‑day colors in 30 seconds.",
    onceOnly: true,
  },
  neighborhood_certified: {
    id: "neighborhood_certified",
    speaker: "baron",
    line1: "Certified Install Week begins now.",
    onceOnly: true,
  },
  neighborhood_liberation: {
    id: "neighborhood_liberation",
    speaker: "mentor",
    line1: "Open Spark Workshop is watching your moves.",
    onceOnly: true,
  },
  dependency_20: {
    id: "dependency_20",
    speaker: "baron",
    line1: "A complimentary crate… because I believe in you.",
    line2: "— Bulb Baron",
    onceOnly: true,
  },
  dependency_40: {
    id: "dependency_40",
    speaker: "customer",
    line1: "My cousin says only certified kits won’t glitch.",
    line2: "Are you certified?",
    onceOnly: true,
  },
  dependency_60: {
    id: "dependency_60",
    speaker: "baron",
    line1: "For your convenience, certification is now… required.",
    onceOnly: true,
  },
  dependency_80: {
    id: "dependency_80",
    speaker: "mentor",
    line1: "Notice the workbench? It’s… suggesting his parts.",
    onceOnly: true,
  },
  dependency_100: {
    id: "dependency_100",
    speaker: "baron",
    line1: "A routine update. Nothing to fear.",
    line2: "Please do not resist.",
    onceOnly: true,
  },
  rd_unlock: {
    id: "rd_unlock",
    speaker: "mentor",
    line1: "We stop begging when we can build.",
    onceOnly: true,
  },
  rd_blueprint: {
    id: "rd_blueprint",
    speaker: "rd",
    line1: "He locked the controller. So… we unlock the lock.",
    onceOnly: true,
  },
  freedom_first_use: {
    id: "freedom_first_use",
    speaker: "mentor",
    line1: "That’s what independence sounds like.",
    onceOnly: true,
  },
  baron_offer: {
    id: "baron_offer",
    speaker: "baron",
    line1: "A signature is just a hug… in legal form.",
    onceOnly: true,
  },
};

export const ORDER_FLAVOR_TEXTS = [
  "HOA says: “Warm white only.” HOA says a lot of things.",
  "Client wants subtle. Their neighbor wants “seen from space.”",
  "Birthday party. Kid requested “dragon mode.” Please don’t ask.",
  "Tech dad wants app control. He brought a spreadsheet.",
  "Cozy minimalist: “No wires visible.” Good luck.",
  "Sports superfan wants team colors in 30 seconds.",
  "Neighbor rivalry: “Brighter than the Joneses.”",
];
