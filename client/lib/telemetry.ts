import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import PostHog from "posthog-react-native";
import type { JsonType, PostHogEventProperties } from "@posthog/core";
import {
  TELEMETRY_EVENT_CATALOG,
  TELEMETRY_EVENT_NAME_SET,
} from "@/lib/telemetryCatalog";
import type {
  TelemetryEventName,
  TelemetryEventNameWithOptionalProperties,
  TelemetryEventNameWithRequiredProperties,
  TelemetryEventPayload,
} from "@/lib/telemetryCatalog";

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

export function isTelemetryEnabled() {
  return !!posthog;
}

export function getTelemetryConfigStatus() {
  return {
    enabled: !!posthog,
    apiKeyPresent: !!apiKey,
    host,
    platform: Platform.OS,
  };
}

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

type TelemetryProperties = Record<string, unknown>;

export function captureEvent<
  E extends TelemetryEventNameWithRequiredProperties,
>(name: E, properties: TelemetryEventPayload<E>): void;
export function captureEvent<
  E extends TelemetryEventNameWithOptionalProperties,
>(name: E, properties?: TelemetryProperties): void;
export function captureEvent(
  name: TelemetryEventName,
  properties?: TelemetryProperties,
) {
  if (!TELEMETRY_EVENT_NAME_SET.has(name)) {
    if (__DEV__) {
      console.warn(`[telemetry] Unknown event name: ${name}`);
    }
    return;
  }

  const required = TELEMETRY_EVENT_CATALOG[name].requiredProperties;
  if (required.length > 0) {
    const source = properties || {};
    const missing = required.filter(
      (key) =>
        !Object.prototype.hasOwnProperty.call(source, key) ||
        source[key] === undefined,
    );
    if (missing.length > 0) {
      if (__DEV__) {
        console.warn(
          `[telemetry] Missing required properties for ${name}: ${missing.join(
            ", ",
          )}`,
        );
      }
      return;
    }
  }
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
