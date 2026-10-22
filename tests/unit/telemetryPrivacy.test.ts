jest.mock("posthog-react-native", () => ({
  __esModule: true,
  default: jest.fn(() => ({ capture: jest.fn() })),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));
jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "1",
}));

describe("telemetry channel privacy", () => {
  const originalChannel = process.env.EXPO_PUBLIC_RELEASE_CHANNEL;
  const originalKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

  afterEach(() => {
    if (originalChannel === undefined) {
      delete process.env.EXPO_PUBLIC_RELEASE_CHANNEL;
    } else {
      process.env.EXPO_PUBLIC_RELEASE_CHANNEL = originalChannel;
    }
    if (originalKey === undefined) {
      delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
    } else {
      process.env.EXPO_PUBLIC_POSTHOG_KEY = originalKey;
    }
  });

  function loadTelemetry(channel: string) {
    jest.resetModules();
    process.env.EXPO_PUBLIC_RELEASE_CHANNEL = channel;
    process.env.EXPO_PUBLIC_POSTHOG_KEY = "test-public-ingestion-key";
    return require("@/lib/telemetry") as typeof import("@/lib/telemetry");
  }

  it("never creates an E2E client or a persistent analytics identity", async () => {
    const telemetry = loadTelemetry("e2e");
    const PostHog = require("posthog-react-native").default;
    const storage =
      require("@react-native-async-storage/async-storage").default;
    expect(PostHog).not.toHaveBeenCalled();
    expect(telemetry.posthog).toBeNull();
    expect(await telemetry.getOrCreatePlayerId()).toBeNull();
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each(["production", "playtest"])(
    "uses the actual %s build channel even when an event supplies another",
    (channel) => {
      const telemetry = loadTelemetry(channel);
      telemetry.setTelemetryRuntimeContext({ release_channel: "e2e" });
      telemetry.captureEvent("tutorial_skipped", {
        release_channel: "production",
      });
      expect(telemetry.posthog?.capture).toHaveBeenCalledWith(
        "tutorial_skipped",
        expect.objectContaining({ release_channel: channel }),
      );
    },
  );
});
