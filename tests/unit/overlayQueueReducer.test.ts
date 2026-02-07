import { __TEST_ONLY__ } from "@/context/GameContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("overlay queue reducer guards", () => {
  it("returns the same state when dismissing an unknown overlay id", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const state = {
      ...initial,
      overlayQueue: [
        {
          id: "toast:1",
          type: "toast",
          createdAt: 1,
          payload: { message: "hello" },
        },
      ],
    };

    const next = __TEST_ONLY__.gameReducer(
      state as any,
      { type: "DISMISS_OVERLAY", id: "toast:missing" } as any,
    );

    expect(next).toBe(state);
    expect(next.overlayQueue).toBe(state.overlayQueue);
  });

  it("removes the matching overlay when dismissing a known id", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const state = {
      ...initial,
      overlayQueue: [
        {
          id: "story:beat-1",
          type: "story",
          createdAt: 1,
          sticky: true,
          payload: { beatId: "tina_intro" },
        },
        {
          id: "toast:1",
          type: "toast",
          createdAt: 2,
          payload: { message: "hello" },
        },
      ],
    };

    const next = __TEST_ONLY__.gameReducer(
      state as any,
      { type: "DISMISS_OVERLAY", id: "toast:1" } as any,
    );

    expect(next).not.toBe(state);
    expect(next.overlayQueue).toHaveLength(1);
    expect(next.overlayQueue[0]?.id).toBe("story:beat-1");
  });
});
