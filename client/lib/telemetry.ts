import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import PostHog from "posthog-react-native";
import type { JsonType, PostHogEventProperties } from "@posthog/core";

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
const host =
  process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

const isWeb = Platform.OS === "web";
const PLAYER_ID_KEY = "lighting_tycoon_player_id_v1";
const appVersion = Application.nativeApplicationVersion || undefined;
const buildNumber = Application.nativeBuildVersion || undefined;

export const posthog =
  apiKey && !isWeb
    ? new PostHog(apiKey, {
        host,
        captureAppLifecycleEvents: true,
        preloadFeatureFlags: true,
        sendFeatureFlagEvent: true,
      })
    : null;

function toPostHogProperties(
  properties?: Record<string, unknown>,
): PostHogEventProperties | undefined {
  if (!properties) return undefined;
  const cleaned: PostHogEventProperties = {};
  Object.entries(properties).forEach(([key, value]) => {
    if (value === undefined) return;
    cleaned[key] = value as JsonType;
  });
  return cleaned;
}

export function captureEvent(
  name: string,
  properties?: Record<string, unknown>,
) {
  posthog?.capture(name, toPostHogProperties(properties));
}

export function identifyUser(id: string, properties?: Record<string, unknown>) {
  posthog?.identify(id, toPostHogProperties(properties));
  posthog?.reloadFeatureFlags();
}

export function resetTelemetry() {
  posthog?.reset();
}

export async function getOrCreatePlayerId(): Promise<string | null> {
  if (!posthog) return null;
  try {
    const existing = await AsyncStorage.getItem(PLAYER_ID_KEY);
    if (existing) return existing;
    const created = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(PLAYER_ID_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function getAppInfo() {
  return {
    appVersion,
    buildNumber,
    platform: Platform.OS,
  };
}
