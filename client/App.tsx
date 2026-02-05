import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
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

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameProvider } from "@/context/GameContext";
import { GameColors } from "@/constants/theme";

Sentry.init({
  dsn: "https://b65f0568679134d6d8705b2e5527b376@o4510308447354880.ingest.us.sentry.io/4510809845727232",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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
        Sentry.captureException(error, {
          extra: { componentStack },
        });
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

  return <PostHogProvider client={posthog}>{content}</PostHogProvider>;
}

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GameColors.ui.background,
  },
});
