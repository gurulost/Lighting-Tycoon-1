/* eslint-disable @typescript-eslint/no-require-imports */

describe("withRepeat", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("delegates to reanimated when available", () => {
    const withRepeatMock = jest.fn(() => "repeat-result");
    jest.doMock("react-native-reanimated", () => ({
      withRepeat: withRepeatMock,
    }));

    // Use CommonJS require here to avoid Node's experimental vm modules requirement.
    // The module is loaded after the mock is registered.
    jest.isolateModules(() => {
      const { withRepeat } =
        require("@/lib/reanimated") as typeof import("@/lib/reanimated");

      expect(withRepeat("value", -1, true)).toBe("repeat-result");
    });
    expect(withRepeatMock).toHaveBeenCalledWith("value", -1, true);
  });

  it("falls back to the first argument when reanimated is unavailable", () => {
    jest.doMock("react-native-reanimated", () => ({}));

    // Use CommonJS require here to avoid Node's experimental vm modules requirement.
    // The module is loaded after the mock is registered.
    jest.isolateModules(() => {
      const { withRepeat } =
        require("@/lib/reanimated") as typeof import("@/lib/reanimated");
      expect(withRepeat("value", -1, true)).toBe("value");
    });
  });
});
