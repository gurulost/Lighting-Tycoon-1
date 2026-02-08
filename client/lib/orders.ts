import { Order, Part } from "@/types/game";

export type OrderBoardAnalysis = {
  fulfillmentIndices: number[] | null;
  matchedCountByRequirement: number[];
  totalRequired: number;
  satisfiedCount: number;
  shortfall?: {
    requirementIndex: number;
    missing: number;
    requirement: Order["requirements"][number];
  };
};

function isPartValidForRequirement(
  order: Order,
  part: Part,
  req: Order["requirements"][number],
) {
  if (part.family === "waste") return false;
  if (part.tier !== req.tier) return false;
  if (req.requiresCompatible && !part.compatible) return false;
  if (req.family === "any") return true;
  if (part.family === req.family) return true;

  const compatibleLockedSubstitution =
    req.family === "locked" &&
    order.type === "locked_required" &&
    part.compatible &&
    !order.noSubstitutions;
  return compatibleLockedSubstitution;
}

export function analyzeOrderAgainstBoard(
  order: Order,
  board: (Part | null)[],
): OrderBoardAnalysis {
  const matchedCountByRequirement = Array(order.requirements.length).fill(0);
  const totalRequired = order.requirements.reduce(
    (sum, req) => sum + req.count,
    0,
  );
  const sortedRequirementEntries = order.requirements
    .map((req, requirementIndex) => ({ req, requirementIndex }))
    .sort((a, b) => {
      const familyScore =
        (a.req.family === "any" ? 1 : 0) - (b.req.family === "any" ? 1 : 0);
      if (familyScore !== 0) return familyScore;
      return b.req.tier - a.req.tier;
    });

  const selected: number[] = [];
  const used = new Set<number>();
  let canFulfill = true;
  let shortfall: OrderBoardAnalysis["shortfall"];

  for (const { req, requirementIndex } of sortedRequirementEntries) {
    let matchedForRequirement = 0;
    for (let i = 0; i < board.length; i += 1) {
      if (matchedForRequirement >= req.count) break;
      const part = board[i];
      if (!part || used.has(i)) continue;
      if (!isPartValidForRequirement(order, part, req)) continue;
      used.add(i);
      matchedForRequirement += 1;
      selected.push(i);
    }
    matchedCountByRequirement[requirementIndex] = matchedForRequirement;
    if (matchedForRequirement < req.count) {
      canFulfill = false;
      shortfall = {
        requirementIndex,
        missing: req.count - matchedForRequirement,
        requirement: req,
      };
      break;
    }
  }

  const satisfiedCount = matchedCountByRequirement.reduce(
    (sum, count) => sum + count,
    0,
  );

  return {
    fulfillmentIndices: canFulfill ? selected : null,
    matchedCountByRequirement,
    totalRequired,
    satisfiedCount,
    shortfall,
  };
}

export function selectOrderFulfillmentIndices(
  order: Order,
  board: (Part | null)[],
) {
  return analyzeOrderAgainstBoard(order, board).fulfillmentIndices;
}
