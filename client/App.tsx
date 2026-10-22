import React, { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { PostHogProvider } from "posthog-react-native";
import { getTelemetryConfigStatus, posthog } from "@/lib/telemetry";
import { getObservabilityPolicy } from "@/lib/observability";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameProvider } from "@/context/GameContext";
import { GameColors } from "@/constants/theme";

const observability = getObservabilityPolicy(
  {
    releaseChannel: process.env.EXPO_PUBLIC_RELEASE_CHANNEL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    errorReplay: process.env.EXPO_PUBLIC_SENTRY_ERROR_REPLAY,
  },
  { isDevelopment: __DEV__, platform: Platform.OS },
);

if (observability.enabled) {
  Sentry.init({
    dsn: observability.dsn,
    environment: observability.environment,
    sendDefaultPii: observability.sendDefaultPii,
    enableLogs: observability.enableLogs,
    replaysSessionSampleRate: observability.replaysSessionSampleRate,
    replaysOnErrorSampleRate: observability.replaysOnErrorSampleRate,
    integrations: observability.errorReplayEnabled
      ? [Sentry.mobileReplayIntegration(observability.replayMasking)]
      : [],
    initialScope: { tags: { release_channel: observability.environment } },
  });
}

function App() {
  useEffect(() => {
    if (__DEV__) {
      const telemetry = getTelemetryConfigStatus();
      if (!telemetry.enabled) {
        console.info(
          `[telemetry] PostHog disabled (platform=${telemetry.platform}, keyPresent=${telemetry.apiKeyPresent}).`,
        );
      }
    }
    posthog?.reloadFeatureFlags();
  }, []);

  const content = (
    <ErrorBoundary
      onError={(error, componentStack) => {
        if (observability.enabled) {
          Sentry.captureException(error, {
            extra: { componentStack },
          });
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <GameProvider>
                <NavigationContainer>
                  <RootStackNavigator />
                </NavigationContainer>
              </GameProvider>
              <StatusBar style="light" />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );

  if (!posthog) {
    return content;
  }

  return (
    <PostHogProvider
      client={posthog}
      // PostHog's hook-based screen autocapture is incompatible with React
      // Navigation 7. Gameplay navigation is tracked explicitly instead.
      autocapture={{ captureScreens: false, captureTouches: false }}
    >
      {content}
    </PostHogProvider>
  );
}

export default observability.enabled ? Sentry.wrap(App) : App;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GameColors.ui.background,
  },
});
