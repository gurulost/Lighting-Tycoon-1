describe("withRepeat", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("delegates to reanimated when available", async () => {
    const withRepeatMock = jest.fn(() => "repeat-result");
    jest.doMock("react-native-reanimated", () => ({
      withRepeat: withRepeatMock,
    }));

    const { withRepeat } = await import("@/lib/reanimated");

    expect(withRepeat("value", -1, true)).toBe("repeat-result");
    expect(withRepeatMock).toHaveBeenCalledWith("value", -1, true);
  });

  it("falls back to the first argument when reanimated is unavailable", async () => {
    jest.doMock("react-native-reanimated", () => ({}));

    const { withRepeat } = await import("@/lib/reanimated");

    expect(withRepeat("value", -1, true)).toBe("value");
  });
});
