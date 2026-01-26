import { OrderType } from "@/types/game";

export interface Neighborhood {
  id: string;
  name: string;
  repRequired: number;
  allowedOrderTypes: OrderType[];
  storyBeatId: string;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "starter",
    name: "Starter Street",
    repRequired: 0,
    allowedOrderTypes: ["basic"],
    storyBeatId: "neighborhood_starter",
  },
  {
    id: "hoa",
    name: "HOA Heights",
    repRequired: 120,
    allowedOrderTypes: ["basic", "style_match"],
    storyBeatId: "neighborhood_hoa",
  },
  {
    id: "downtown",
    name: "Downtown Display District",
    repRequired: 300,
    allowedOrderTypes: ["basic", "style_match", "rush", "premium"],
    storyBeatId: "neighborhood_downtown",
  },
  {
    id: "certified",
    name: "The Certified Zone",
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
    repRequired: 1300,
    allowedOrderTypes: [
      "basic",
      "style_match",
      "rush",
      "premium",
      "baron_certified",
      "locked_required",
      "lab_request",
    ],
    storyBeatId: "neighborhood_liberation",
  },
];
