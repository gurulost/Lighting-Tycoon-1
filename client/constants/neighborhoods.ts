import { OrderType } from "@/types/game";

export interface Neighborhood {
  id: string;
  name: string;
  shortName?: string;
  repRequired: number;
  allowedOrderTypes: OrderType[];
  storyBeatId: string;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "starter",
    name: "Starter Street",
    shortName: "Starter St",
    repRequired: 0,
    allowedOrderTypes: ["basic"],
    storyBeatId: "neighborhood_starter",
  },
  {
    id: "hoa",
    name: "HOA Heights",
    shortName: "HOA Heights",
    repRequired: 120,
    allowedOrderTypes: ["basic", "style_match"],
    storyBeatId: "neighborhood_hoa",
  },
  {
    id: "downtown",
    name: "Downtown Display District",
    shortName: "Downtown",
    repRequired: 300,
    allowedOrderTypes: ["basic", "style_match", "rush", "premium"],
    storyBeatId: "neighborhood_downtown",
  },
  {
    id: "certified",
    name: "The Certified Zone",
    shortName: "Certified",
    repRequired: 700,
    allowedOrderTypes: [
      "basic",
      "style_match",
      "rush",
      "premium",
      "baron_certified",
      "locked_required",
      "lab_request",
    ],
    storyBeatId: "neighborhood_certified",
  },
  {
    id: "lockout",
    name: "Lockout Lane",
    shortName: "Lockout Lane",
    repRequired: 1000,
    allowedOrderTypes: [
      "basic",
      "style_match",
      "rush",
      "premium",
      "baron_certified",
      "locked_required",
      "lab_request",
    ],
    storyBeatId: "neighborhood_lockout",
  },
  {
    id: "liberation",
    name: "Open Spark Workshop",
    shortName: "Open Spark",
    repRequired: 1300,
    allowedOrderTypes: [
      "basic",
      "style_match",
      "rush",
      "premium",
      "baron_certified",
      "locked_required",
      "lab_request",
      "compatibility_required",
    ],
    storyBeatId: "neighborhood_liberation",
  },
];
