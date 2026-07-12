export type ReleaseChannel = "production" | "playtest" | "e2e";

export function resolveReleaseChannel(
  value: string | undefined = process.env.EXPO_PUBLIC_RELEASE_CHANNEL,
): ReleaseChannel {
  if (value === "playtest" || value === "e2e") return value;
  return "production";
}

export function hasPlaytestCapability(channel = resolveReleaseChannel()) {
  return channel === "playtest" || channel === "e2e";
}

export function hasE2EShortcuts(channel = resolveReleaseChannel()) {
  return channel === "e2e";
}
