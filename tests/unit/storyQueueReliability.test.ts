import { gameReducer, getInitialState } from "@/context/GameContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("story queue reliability", () => {
  it("marks beats as seen only when shown on-screen", () => {
    const base = getInitialState();
    const queued = gameReducer(base, {
      type: "QUEUE_STORY_BEAT",
      beatId: "phase2_goal",
    });

    expect(queued.storyQueue).toContain("phase2_goal");
    expect(queued.storySeen["phase2_goal"]).toBeUndefined();

    const shown = gameReducer(queued, {
      type: "SHOW_STORY_BEAT",
      beatId: "phase2_goal",
    });

    expect(shown.activeStoryBeatId).toBe("phase2_goal");
    expect(shown.storySeen["phase2_goal"]).toBe(true);
  });

  it("does not re-queue once-only beats after they are shown", () => {
    const base = getInitialState();
    const queued = gameReducer(base, {
      type: "QUEUE_STORY_BEAT",
      beatId: "phase2_goal",
    });
    const shown = gameReducer(queued, {
      type: "SHOW_STORY_BEAT",
      beatId: "phase2_goal",
    });
    const dismissed = gameReducer(shown, { type: "DISMISS_STORY_BEAT" });
    const requeued = gameReducer(dismissed, {
      type: "QUEUE_STORY_BEAT",
      beatId: "phase2_goal",
    });

    expect(requeued.storyQueue).toEqual(dismissed.storyQueue);
  });

  it("preserves critical beats during queue collapse", () => {
    const base = getInitialState();
    const seeded = {
      ...base,
      storyQueue: ["rd_memo_1", "tina_phase2", "phase2_goal", "mentor_tip_1"],
    };

    const collapsed = gameReducer(seeded, {
      type: "COLLAPSE_STORY_QUEUE",
      keepCount: 1,
    });

    expect(collapsed.storyQueue).toEqual([
      "rd_memo_1",
      "tina_phase2",
      "phase2_goal",
    ]);
  });

  it("keeps critical beats even with keepCount=0", () => {
    const base = getInitialState();
    const seeded = {
      ...base,
      storyQueue: ["mentor_tip_1", "tina_phase2", "rd_memo_1", "phase2_goal"],
    };

    const collapsed = gameReducer(seeded, {
      type: "COLLAPSE_STORY_QUEUE",
      keepCount: 0,
    });

    expect(collapsed.storyQueue).toEqual(["tina_phase2", "phase2_goal"]);
  });
});
