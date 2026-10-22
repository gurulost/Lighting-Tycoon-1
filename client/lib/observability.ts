import { resolveReleaseChannel } from "@/lib/releaseChannel";

type ObservabilityEnvironment = {
  releaseChannel?: string;
  sentryDsn?: string;
  errorReplay?: string;
};

// The existing public ingestion DSN is not an administrative credential.
const DEFAULT_SENTRY_DSN =
  "https://b65f0568679134d6d8705b2e5527b376@o4510308447354880.ingest.us.sentry.io/4510809845727232";

export function getObservabilityPolicy(
  environment: ObservabilityEnvironment,
  runtime: { isDevelopment: boolean; platform: string },
) {
  const releaseChannel = resolveReleaseChannel(environment.releaseChannel);
  const enabled = !runtime.isDevelopment && releaseChannel !== "e2e";
  const errorReplayEnabled =
    enabled &&
    releaseChannel === "production" &&
    runtime.platform !== "web" &&
    environment.errorReplay === "true";

  return {
    enabled,
    dsn: environment.sentryDsn?.trim() || DEFAULT_SENTRY_DSN,
    environment: releaseChannel,
    sendDefaultPii: false,
    enableLogs: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: errorReplayEnabled ? 1 : 0,
    errorReplayEnabled,
    replayMasking: {
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: true,
    },
  };
}
