import {
  PROJECT_DEFINITION_BY_ID,
  getSiteRuleForProjectStage,
} from "@/constants/projects";
import {
  MIN_RUSH_DEADLINE_MS,
  applyRushDeadlineMultiplier,
  getActiveSiteRule,
  getOrderRefreshBlockReason,
  getOrderRefreshCost,
} from "@/lib/siteRules";
import { createInitialLegacyState } from "@/lib/legacy";
import { GameState, ProjectDefinition } from "@/types/game";

function makeState({
  activeProject,
  council,
}: {
  activeProject?: GameState["activeProject"];
  council?: Partial<GameState["council"]>;
} = {}): GameState {
  return {
    reputationTier: 0,
    activeProject,
    council: {
      perksUnlocked: [],
      activeHearing: undefined,
      ...council,
    },
    legacy: createInitialLegacyState(),
  } as unknown as GameState;
}

describe("site rule helpers", () => {
  it("resolves mapped project site rules from project data", () => {
    const project = PROJECT_DEFINITION_BY_ID.get("proj_neon_city_grid");
    expect(project).toBeTruthy();
    expect(getSiteRuleForProjectStage(project!, 0)?.id).toBe("public_scrutiny");
  });

  it("uses stage override when present and falls back to project rule otherwise", () => {
    const baseProject = PROJECT_DEFINITION_BY_ID.get("proj_neon_city_grid");
    expect(baseProject).toBeTruthy();
    const overriddenProject: ProjectDefinition = {
      ...baseProject!,
      siteRuleId: "public_scrutiny",
      stages: baseProject!.stages.map((stage) => ({ ...stage })),
    };
    overriddenProject.stages[0] = {
      ...overriddenProject.stages[0],
      siteRuleId: "safety_lock",
    };

    expect(getSiteRuleForProjectStage(overriddenProject, 0)?.id).toBe(
      "safety_lock",
    );
    expect(getSiteRuleForProjectStage(overriddenProject, 1)?.id).toBe(
      "public_scrutiny",
    );
  });

  it("resolves active site rule from active project state", () => {
    const state = makeState({
      activeProject: {
        projectId: "proj_airport_runway",
        stageIndex: 0,
      } as GameState["activeProject"],
    });
    expect(getActiveSiteRule(state)?.id).toBe("safety_lock");
  });

  it("applies site-rule refresh cost multiplier", () => {
    const neutralCost = getOrderRefreshCost(4, makeState());
    const scrutinyCost = getOrderRefreshCost(
      4,
      makeState({
        activeProject: {
          projectId: "proj_neon_city_grid",
          stageIndex: 0,
        } as GameState["activeProject"],
      }),
    );
    expect(scrutinyCost).toBe(Math.round(neutralCost * 1.3));
  });

  it("returns site rule refresh block reason and hearing precedence", () => {
    const safetyLockState = makeState({
      activeProject: {
        projectId: "proj_airport_runway",
        stageIndex: 0,
      } as GameState["activeProject"],
    });
    expect(getOrderRefreshBlockReason(safetyLockState)).toBe("site_rule");

    const hearingState = makeState({
      activeProject: {
        projectId: "proj_airport_runway",
        stageIndex: 0,
      } as GameState["activeProject"],
      council: {
        activeHearing: {
          hearingId: "hear_safety_audit",
        } as GameState["council"]["activeHearing"],
      },
    });
    expect(getOrderRefreshBlockReason(hearingState)).toBe("hearing");
  });

  it("scales rush deadlines and clamps to minimum floor", () => {
    expect(applyRushDeadlineMultiplier(60000, 0.8)).toBe(48000);
    expect(applyRushDeadlineMultiplier(10000, 0.8)).toBe(MIN_RUSH_DEADLINE_MS);
    expect(applyRushDeadlineMultiplier(undefined, 0.8)).toBeUndefined();
  });
});
