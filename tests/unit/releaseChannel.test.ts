import {
  hasE2EShortcuts,
  hasPlaytestCapability,
  resolveReleaseChannel,
} from "@/lib/releaseChannel";

describe("release channel", () => {
  it.each([
    [undefined, "production"],
    ["", "production"],
    ["preview", "production"],
    ["production", "production"],
    ["playtest", "playtest"],
    ["e2e", "e2e"],
  ])("resolves %p to %s", (input, expected) => {
    expect(resolveReleaseChannel(input)).toBe(expected);
  });

  it("keeps tester and automation capabilities explicit", () => {
    expect(hasPlaytestCapability("production")).toBe(false);
    expect(hasPlaytestCapability("playtest")).toBe(true);
    expect(hasPlaytestCapability("e2e")).toBe(true);
    expect(hasE2EShortcuts("playtest")).toBe(false);
    expect(hasE2EShortcuts("e2e")).toBe(true);
  });
});
