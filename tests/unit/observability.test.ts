import { getObservabilityPolicy } from "@/lib/observability";

const nativeRelease = { isDevelopment: false, platform: "ios" };

describe("observability privacy policy", () => {
  it("keeps personal enrichment, logs, and all replay off by default", () => {
    expect(getObservabilityPolicy({}, nativeRelease)).toMatchObject({
      enabled: true,
      environment: "production",
      sendDefaultPii: false,
      enableLogs: false,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      errorReplayEnabled: false,
    });
  });

  it.each(["ios", "android"])(
    "only permits explicitly opted-in, masked error replay on production %s",
    (platform) => {
      expect(
        getObservabilityPolicy(
          { releaseChannel: "production", errorReplay: "true" },
          { ...nativeRelease, platform },
        ),
      ).toMatchObject({
        errorReplayEnabled: true,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1,
        replayMasking: {
          maskAllText: true,
          maskAllImages: true,
          maskAllVectors: true,
        },
      });
    },
  );

  it.each(["false", "1", "TRUE", " true ", undefined])(
    "does not treat %p as replay authorization",
    (errorReplay) => {
      expect(
        getObservabilityPolicy({ errorReplay }, nativeRelease)
          .errorReplayEnabled,
      ).toBe(false);
    },
  );

  it("disables diagnostics in E2E and development even with replay opt-in", () => {
    expect(
      getObservabilityPolicy(
        { releaseChannel: "e2e", errorReplay: "true" },
        nativeRelease,
      ),
    ).toMatchObject({ enabled: false, errorReplayEnabled: false });
    expect(
      getObservabilityPolicy(
        { errorReplay: "true" },
        { ...nativeRelease, isDevelopment: true },
      ),
    ).toMatchObject({ enabled: false, errorReplayEnabled: false });
  });

  it("isolates playtest diagnostics and prevents replay on web or playtest", () => {
    expect(
      getObservabilityPolicy(
        { releaseChannel: "playtest", errorReplay: "true" },
        nativeRelease,
      ),
    ).toMatchObject({
      enabled: true,
      environment: "playtest",
      errorReplayEnabled: false,
    });
    expect(
      getObservabilityPolicy(
        { errorReplay: "true" },
        { ...nativeRelease, platform: "web" },
      ).errorReplayEnabled,
    ).toBe(false);
  });
});
