import { COUNCIL_CAMPAIGNS } from "@/constants/councilCampaigns";
import { COUNCIL_HEARING_BY_ID } from "@/constants/councilHearings";
import { PLAYTEST_PRESET_ORDER } from "@/constants/playtestPresets";
import { __TEST_ONLY__ } from "@/context/GameContext";
import type { GameState, Order, Part, PartFamily } from "@/types/game";
import {
  collectStateInvariantFailures,
  councilPressureForDraftCheckpoint,
  hasExplicitProgressRoute,
  PROGRESSION_CHECKPOINTS,
  PROGRESSION_STRATEGIES,
  projectRecoveryActionForStrategy,
  shapeStateForStrategy,
  type SimulatedHearing,
  summarizeCouncilCadence,
  withDeterministicRuntime,
} from "../helpers/progressionSimulation";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const CAPSTONE_ID = "proj_international_expo";
const SEEDS_PER_STRATEGY = 100;

function reduce(state: GameState, action: Record<string, unknown>): GameState {
  return __TEST_ONLY__.gameReducer(state as any, action as any);
}

function applyPreset(state: GameState, presetId: string): GameState {
  return reduce(state, { type: "PLAYTEST_APPLY_PRESET", presetId });
}

function familyForStrategy(
  strategy: (typeof PROGRESSION_STRATEGIES)[number],
): PartFamily {
  return strategy === "locked_first" ? "locked" : "open";
}

function withFulfillmentParts(
  state: GameState,
  order: Order,
  strategy: (typeof PROGRESSION_STRATEGIES)[number],
): GameState {
  const board = Array.from(
    { length: state.boardSize },
    () => null,
  ) as (Part | null)[];
  let position = 0;
  order.requirements.forEach((requirement) => {
    for (let count = 0; count < requirement.count; count += 1) {
      const family =
        requirement.family === "any"
          ? familyForStrategy(strategy)
          : requirement.family;
      board[position] = {
        id: `sim-part-${order.id}-${position}`,
        family,
        tier: requirement.tier,
        position,
        compatible: requirement.requiresCompatible || undefined,
      };
      position += 1;
    }
  });
  return { ...state, board };
}

function makeUniversalCouncilOrder(id: string): Order {
  return {
    id,
    title: "Simulation field install",
    type: "compatibility_required",
    requirements: [
      {
        tier: 1,
        family: "open",
        count: 1,
        requiresCompatible: true,
      },
    ],
    rewards: { cash: 1, reputation: 1, research: 1 },
    ecoAuditBonusResearch: 1,
    rushDeadline: Date.now() + 60_000,
    modifierIds: ["council_rush"],
  };
}

describe("seeded reducer progression simulation", () => {
  it("keeps every reachable checkpoint valid and gives it an explicit progress route across 400 seeded strategy runs", () => {
    expect(PROGRESSION_CHECKPOINTS.map(({ presetId }) => presetId)).toEqual(
      PLAYTEST_PRESET_ORDER,
    );

    PROGRESSION_STRATEGIES.forEach((strategy, strategyIndex) => {
      for (let seed = 1; seed <= SEEDS_PER_STRATEGY; seed += 1) {
        withDeterministicRuntime(strategyIndex * 10_000 + seed, (random) => {
          PROGRESSION_CHECKPOINTS.forEach(({ presetId, expectedPhase }) => {
            const initial = __TEST_ONLY__.getInitialState();
            const checkpoint = shapeStateForStrategy(
              applyPreset(initial, presetId),
              strategy,
              random,
            );

            expect(checkpoint.gamePhase).toBe(expectedPhase);
            expect(collectStateInvariantFailures(checkpoint)).toEqual([]);
            expect(hasExplicitProgressRoute(checkpoint)).toBe(true);
          });
        });
      }
    });
  });

  it("keeps the capstone pinned through refresh and reducer-supported recovery paths for every strategy and seed", () => {
    PROGRESSION_STRATEGIES.forEach((strategy, strategyIndex) => {
      for (let seed = 1; seed <= SEEDS_PER_STRATEGY; seed += 1) {
        withDeterministicRuntime(strategyIndex * 10_000 + seed, (random) => {
          let state = shapeStateForStrategy(
            applyPreset(
              __TEST_ONLY__.getInitialState(),
              "phase2_capstone_ready",
            ),
            strategy,
            random,
          );
          state = { ...state, cash: 1_000_000_000 };

          for (let refresh = 0; refresh < 5; refresh += 1) {
            expect(
              state.projectOffers.some(
                ({ projectId }) => projectId === CAPSTONE_ID,
              ),
            ).toBe(true);
            state = reduce(state, { type: "PROJECT_REFRESH_OFFERS" });
            expect(collectStateInvariantFailures(state)).toEqual([]);
          }

          state = reduce(state, {
            type: "PROJECT_ACCEPT",
            projectId: CAPSTONE_ID,
          });
          expect(state.activeProject?.projectId).toBe(CAPSTONE_ID);
          expect(collectStateInvariantFailures(state)).toEqual([]);

          state = reduce(state, {
            type: projectRecoveryActionForStrategy(strategy, random),
          });
          expect(state.activeProject).toBeUndefined();
          expect(
            state.projectOffers.some(
              ({ projectId }) => projectId === CAPSTONE_ID,
            ),
          ).toBe(true);
          expect(state.council.unlocked).toBe(false);
          expect(state.gamePhase).toBe(2);
          expect(collectStateInvariantFailures(state)).toEqual([]);
        });
      }
    });
  });

  it("runs organic phase transitions, capstone completion, and every Council campaign across 400 seeded strategies", () => {
    const observedHearingActionGaps: number[] = [];
    const campaignRuns = Object.fromEntries(
      COUNCIL_CAMPAIGNS.map(({ id }) => [id, 0]),
    );
    const campaignHearingTotals = Object.fromEntries(
      COUNCIL_CAMPAIGNS.map(({ id }) => [id, 0]),
    );
    let totalHearings = 0;
    let totalResolvedHearings = 0;
    let totalActiveAfterThreeMinutes = 0;
    PROGRESSION_STRATEGIES.forEach((strategy, strategyIndex) => {
      for (let seed = 1; seed <= SEEDS_PER_STRATEGY; seed += 1) {
        withDeterministicRuntime(
          strategyIndex * 10_000 + seed,
          (random, runtime) => {
            let state = applyPreset(
              __TEST_ONLY__.getInitialState(),
              "pre_phase2_transition",
            );
            state = shapeStateForStrategy(state, strategy, random);
            state = reduce(state, {
              type: "RESOLVE_LOCKOUT",
              choice: "freedom",
            });
            expect(state.gamePhase).toBe(2);
            expect(state.liberationComplete).toBe(true);

            state = {
              ...state,
              cash: 1_000_000_000,
              research: 1_000_000_000,
              reputation: 10_000,
              reputationTier: 12,
              projectsUnlocked: true,
              maxTierCrafted: 13,
              orders: [],
              projectOffers: [],
            };

            const completeActiveProject = () => {
              let stageGuard = 0;
              while (state.activeProject && stageGuard < 20) {
                const stageOrder = state.orders.find((order) =>
                  order.modifierIds?.includes("project_stage"),
                );
                expect(stageOrder).toBeDefined();
                if (!stageOrder) break;
                state = withFulfillmentParts(state, stageOrder, strategy);
                state = reduce(state, {
                  type: "FULFILL_ORDER",
                  orderId: stageOrder.id,
                });
                expect(collectStateInvariantFailures(state)).toEqual([]);
                stageGuard += 1;
              }
              expect(stageGuard).toBeLessThan(20);
              expect(state.activeProject).toBeUndefined();
            };

            while (state.projectsCompleted.length < 6) {
              state = { ...state, orders: [] };
              state = reduce(state, { type: "PROJECT_GENERATE_OFFERS" });
              const ordinaryOffer = state.projectOffers.find(
                ({ projectId }) => projectId !== CAPSTONE_ID,
              );
              expect(ordinaryOffer).toBeDefined();
              if (!ordinaryOffer) break;
              state = reduce(state, {
                type: "PROJECT_ACCEPT",
                projectId: ordinaryOffer.projectId,
              });
              expect(state.activeProject?.projectId).toBe(
                ordinaryOffer.projectId,
              );
              completeActiveProject();
            }

            expect(state.projectsCompleted).toHaveLength(6);
            expect(
              state.projectOffers.some(
                ({ projectId }) => projectId === CAPSTONE_ID,
              ),
            ).toBe(true);
            state = { ...state, orders: [] };
            state = reduce(state, {
              type: "PROJECT_ACCEPT",
              projectId: CAPSTONE_ID,
            });
            expect(state.activeProject?.projectId).toBe(CAPSTONE_ID);
            completeActiveProject();
            expect(state.projectsCompleted).toContain(CAPSTONE_ID);
            expect(state.gamePhase).toBe(3);
            expect(state.council.unlocked).toBe(true);

            state = {
              ...state,
              cash: 1_000_000_000,
              research: 1_000_000_000,
              reputation: 10_000,
              reputationTier: 12,
              maxTierCrafted: 16,
              orders: [],
              council: {
                ...state.council,
                lobbyPressure: councilPressureForDraftCheckpoint(
                  strategy,
                  random,
                ),
              },
            };

            let actionCount = 0;
            const hearings: SimulatedHearing[] = [];
            const dispatchCouncilAction = (action: Record<string, unknown>) => {
              const before = state.council.activeHearing;
              runtime.advance(15_000);
              actionCount += 1;
              state = reduce(state, action);
              const after = state.council.activeHearing;
              if (!before && after) {
                hearings.push({
                  hearingId: after.hearingId,
                  campaignId: state.council.activeCampaignId,
                  triggeredAt: runtime.now(),
                  triggeredAction: actionCount,
                });
              } else if (before && !after) {
                const pending = [...hearings]
                  .reverse()
                  .find(
                    (hearing) =>
                      hearing.hearingId === before.hearingId &&
                      hearing.resolvedAt === undefined,
                  );
                expect(pending).toBeDefined();
                if (pending) {
                  pending.resolvedAt = runtime.now();
                  pending.resolvedAction = actionCount;
                }
              }
              const failures = collectStateInvariantFailures(state);
              if (failures.length > 0) {
                throw new Error(failures.join("; "));
              }
            };

            // Distribute the 400 runs across every authored campaign. Each run
            // enters with only that campaign's prerequisites completed, then
            // exercises its real draft, pilot, hearing, and ratification
            // reducer actions. This keeps CI bounded without replacing play
            // with preset snapshots.
            const campaign =
              COUNCIL_CAMPAIGNS[
                (strategyIndex * SEEDS_PER_STRATEGY + seed - 1) %
                  COUNCIL_CAMPAIGNS.length
              ];
            const campaigns = { ...state.council.campaigns };
            COUNCIL_CAMPAIGNS.forEach((candidate) => {
              if (candidate.id === campaign.id) return;
              campaigns[candidate.id] = {
                ...campaigns[candidate.id],
                status: "COMPLETED",
                completedAt: runtime.now(),
              };
            });
            state = {
              ...state,
              council: { ...state.council, campaigns },
            };

            {
              dispatchCouncilAction({
                type: "COUNCIL_SET_ACTIVE_CAMPAIGN",
                campaignId: campaign.id,
              });
              dispatchCouncilAction({
                type: "COUNCIL_INVEST_DRAFT",
                campaignId: campaign.id,
              });
              expect(state.council.campaigns[campaign.id]?.status).toBe(
                "PILOT",
              );

              let pilotGuard = 0;
              while (
                state.council.campaigns[campaign.id]?.status === "PILOT" &&
                pilotGuard < 20
              ) {
                const order = makeUniversalCouncilOrder(
                  `sim-${strategy}-${seed}-${campaign.id}-${pilotGuard}`,
                );
                state = {
                  ...withFulfillmentParts(state, order, strategy),
                  orders: [order],
                };
                dispatchCouncilAction({
                  type: "FULFILL_ORDER",
                  orderId: order.id,
                });
                pilotGuard += 1;
              }
              expect(pilotGuard).toBeLessThan(20);
              expect(state.council.campaigns[campaign.id]?.status).toBe(
                "RATIFY",
              );

              const ratifyOrder = state.orders.find((order) =>
                order.modifierIds?.includes(`council:${campaign.id}`),
              );
              expect(ratifyOrder).toBeDefined();
              if (ratifyOrder) {
                state = withFulfillmentParts(state, ratifyOrder, strategy);
                dispatchCouncilAction({
                  type: "FULFILL_ORDER",
                  orderId: ratifyOrder.id,
                });
              }
              expect(state.council.campaigns[campaign.id]?.status).toBe(
                "COMPLETED",
              );

              if (state.council.activeHearing) {
                const hearing =
                  COUNCIL_HEARING_BY_ID[state.council.activeHearing.hearingId];
                expect(hearing).toBeDefined();
                dispatchCouncilAction({ type: "COUNCIL_PAY_CLEAR_HEARING" });
              }
            }

            const summary = summarizeCouncilCadence(
              hearings,
              [campaign.id],
              runtime.now(),
            );
            campaignRuns[campaign.id] += 1;
            campaignHearingTotals[campaign.id] +=
              summary.hearingsPerCampaign[campaign.id];
            totalHearings += hearings.length;
            totalResolvedHearings += hearings.filter(
              ({ resolvedAt }) => resolvedAt !== undefined,
            ).length;
            totalActiveAfterThreeMinutes += hearings.filter((hearing) => {
              const observedUntil = hearing.resolvedAt ?? runtime.now();
              return observedUntil - hearing.triggeredAt > 3 * 60 * 1000;
            }).length;
            for (let index = 1; index < hearings.length; index += 1) {
              observedHearingActionGaps.push(
                hearings[index].triggeredAction -
                  hearings[index - 1].triggeredAction,
              );
            }
          },
        );
      }
    });

    COUNCIL_CAMPAIGNS.forEach(({ id }) => {
      const hearingsPerCampaign = campaignHearingTotals[id] / campaignRuns[id];
      expect(hearingsPerCampaign).toBeGreaterThanOrEqual(1);
      expect(hearingsPerCampaign).toBeLessThanOrEqual(2);
    });

    observedHearingActionGaps.sort((a, b) => a - b);
    const midpoint = Math.floor(observedHearingActionGaps.length / 2);
    const medianActionGap =
      observedHearingActionGaps.length % 2 === 0
        ? (observedHearingActionGaps[midpoint - 1] +
            observedHearingActionGaps[midpoint]) /
          2
        : observedHearingActionGaps[midpoint];
    expect(observedHearingActionGaps.length).toBeGreaterThan(0);
    expect(medianActionGap).toBeGreaterThanOrEqual(6);
    expect(totalHearings).toBeGreaterThan(0);
    expect(totalResolvedHearings / totalHearings).toBeGreaterThanOrEqual(0.8);
    expect(totalActiveAfterThreeMinutes / totalHearings).toBeLessThan(0.2);
  });
});
