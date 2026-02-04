import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { StoryToast } from "@/components/game/StoryToast";
import { TrimLightStrip } from "@/components/game/TrimLightStrip";
import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  OverlayItem,
  OVERLAY_PRIORITY,
  OVERLAY_STARVATION_MS,
  OVERLAY_STARVATION_BOOST,
  OVERLAY_AUTO_DISMISS_MS,
  OVERLAY_COEXISTENCE,
} from "@/types/overlay";

type OverlayManagerProps = {
  queue: OverlayItem[];
  onDismiss: (id: string) => void;
  topOffset: number;
  storyTopOffset?: number;
  bottomInset: number;
  reducedMotion?: boolean;
  onStoryPress?: () => void;
  onStoryDismiss?: () => void;
  momentLockActive?: boolean;
  onTelemetry?: (maxWaitMs: number) => void;
};

export function OverlayManager({
  queue,
  onDismiss,
  topOffset,
  storyTopOffset,
  bottomInset,
  reducedMotion = false,
  onStoryPress,
  onStoryDismiss,
  momentLockActive,
  onTelemetry,
}: OverlayManagerProps) {
  const nowRef = useRef(Date.now());
  nowRef.current = Date.now();
  const lastTelemetryIdRef = useRef<string | null>(null);

  const resolveOverlayTtl = (item?: OverlayItem) => {
    if (!item) return null;
    const payloadDuration = item.payload?.durationMs;
    const ttl =
      typeof payloadDuration === "number"
        ? payloadDuration
        : OVERLAY_AUTO_DISMISS_MS[item.type];
    if (typeof ttl !== "number" || ttl <= 0) return null;
    return ttl;
  };

  const sorted = useMemo(() => {
    const now = nowRef.current;
    return queue
      .map((item) => {
        const waitBoost =
          now - item.createdAt > OVERLAY_STARVATION_MS
            ? OVERLAY_STARVATION_BOOST
            : 0;
        return {
          item,
          priority: OVERLAY_PRIORITY[item.type] + waitBoost,
        };
      })
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.item.createdAt - b.item.createdAt;
      });
  }, [queue]);

  const primary = sorted[0]?.item;
  const primaryId = primary?.id;
  const primaryCreatedAt = primary?.createdAt;
  useEffect(() => {
    if (!primaryId || typeof primaryCreatedAt !== "number") {
      lastTelemetryIdRef.current = null;
      return;
    }
    if (lastTelemetryIdRef.current === primaryId) return;
    lastTelemetryIdRef.current = primaryId;
    const waitMs = Math.max(0, Date.now() - primaryCreatedAt);
    onTelemetry?.(waitMs);
  }, [primaryId, primaryCreatedAt, onTelemetry]);
  const secondary = useMemo(() => {
    if (!primary) return undefined;
    const allowed = OVERLAY_COEXISTENCE[primary.type] ?? [];
    if (allowed.length === 0) return undefined;
    return sorted
      .map((entry) => entry.item)
      .find((item) => item.id !== primary.id && allowed.includes(item.type));
  }, [sorted, primary]);

  const milestoneEnter = reducedMotion
    ? FadeIn.duration(120)
    : FadeIn.duration(200);
  const milestoneExit = reducedMotion
    ? FadeOut.duration(150)
    : FadeOut.duration(400);
  const hasStory = primary?.type === "story" || secondary?.type === "story";
  const shouldBlockInput = Boolean(momentLockActive && hasStory);

  useEffect(() => {
    if (!primary) return undefined;
    if (primary.sticky) return undefined;
    const ttl = resolveOverlayTtl(primary);
    if (!ttl) return undefined;
    const elapsed = Date.now() - primary.createdAt;
    if (elapsed >= ttl) {
      onDismiss(primary.id);
      return undefined;
    }
    const timeout = setTimeout(() => onDismiss(primary.id), ttl - elapsed);
    return () => clearTimeout(timeout);
  }, [
    primary,
    primary?.id,
    primary?.sticky,
    primary?.type,
    primary?.createdAt,
    primary?.payload?.durationMs,
    onDismiss,
  ]);

  useEffect(() => {
    if (!secondary) return undefined;
    if (secondary.sticky) return undefined;
    const ttl = resolveOverlayTtl(secondary);
    if (!ttl) return undefined;
    const elapsed = Date.now() - secondary.createdAt;
    if (elapsed >= ttl) {
      onDismiss(secondary.id);
      return undefined;
    }
    const timeout = setTimeout(() => onDismiss(secondary.id), ttl - elapsed);
    return () => clearTimeout(timeout);
  }, [
    secondary,
    secondary?.id,
    secondary?.sticky,
    secondary?.type,
    secondary?.createdAt,
    secondary?.payload?.durationMs,
    onDismiss,
  ]);

  const renderOverlay = (item: OverlayItem, slot: "primary" | "secondary") => {
    if (item.type === "story") {
      const beatId = item.payload?.beatId as string | undefined;
      if (!beatId) return null;
      const storyTop = storyTopOffset ?? topOffset;
      return (
        <View
          key={item.id}
          style={[styles.storySlot, { top: storyTop }]}
          pointerEvents="box-none"
        >
          <StoryToast
            beatId={beatId}
            reducedMotion={reducedMotion}
            expanded
            onPress={onStoryPress}
            onDismiss={() => {
              onStoryDismiss?.();
              onDismiss(item.id);
            }}
            style={styles.storyToast}
          />
        </View>
      );
    }

    if (item.type === "milestone") {
      return (
        <Animated.View
          key={item.id}
          entering={milestoneEnter}
          exiting={milestoneExit}
          style={styles.milestoneSlot}
          pointerEvents="none"
        >
          <TrimLightStrip
            progress={1}
            bulbs={24}
            height={20}
            pattern="rainbow"
            animationMode="meteor"
            animated
            reducedMotion={reducedMotion}
          />
        </Animated.View>
      );
    }

    if (item.type === "unlock_banner") {
      const title =
        (item.payload?.title as string) ?? "Phase 3 unlocked";
      const message =
        (item.payload?.message as string) ??
        "Standards Council is open. Draft standards to shape the city.";
      return (
        <View
          key={item.id}
          style={[styles.unlockSlot, { bottom: bottomInset + 140 }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["#0F2A3D", "#0F2435", "#101626"]}
            style={styles.unlockCard}
          >
            <View style={styles.unlockHeader}>
              <View style={styles.unlockIcon}>
                <Feather
                  name="award"
                  size={14}
                  color={GameColors.currency.research}
                />
              </View>
              <ThemedText style={styles.unlockTitle}>{title}</ThemedText>
            </View>
            <ThemedText style={styles.unlockMessage}>{message}</ThemedText>
          </LinearGradient>
        </View>
      );
    }

    if (item.type === "toast" || item.type === "system_hint") {
      const message = (item.payload?.message as string) ?? "";
      return (
        <View
          key={item.id}
          style={[styles.toastSlot, { bottom: bottomInset + 110 }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["#1A1A2E", "#252542", "#1A1A2E"]}
            style={styles.toast}
          >
            <ThemedText style={styles.toastText}>{message}</ThemedText>
          </LinearGradient>
        </View>
      );
    }

    if (item.type === "tutorial_tip") {
      const message = (item.payload?.message as string) ?? "";
      return (
        <View
          key={item.id}
          style={[
            styles.tutorialSlot,
            slot === "secondary" && styles.tutorialSlotSecondary,
            { top: topOffset },
          ]}
          pointerEvents="auto"
        >
          <LinearGradient
            colors={["#1A1A2E", "#252542", "#1A1A2E"]}
            style={styles.toast}
          >
            <ThemedText style={styles.toastText}>{message}</ThemedText>
          </LinearGradient>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {shouldBlockInput ? (
        <View style={styles.momentLockBlocker} pointerEvents="auto" />
      ) : null}
      {primary ? renderOverlay(primary, "primary") : null}
      {secondary ? renderOverlay(secondary, "secondary") : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    pointerEvents: "box-none",
  },
  storySlot: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "flex-end",
  },
  storyToast: {
    width: "92%",
    maxWidth: 360,
    minWidth: 240,
  },
  milestoneSlot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  toastSlot: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "center",
  },
  tutorialSlot: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "center",
  },
  tutorialSlotSecondary: {
    top: Spacing.lg,
  },
  toast: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  toastText: {
    fontSize: 12,
    color: GameColors.text.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  unlockSlot: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "center",
  },
  unlockCard: {
    width: "92%",
    maxWidth: 380,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A3C52",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: "#00D9FF",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  unlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unlockIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${GameColors.currency.research}55`,
    backgroundColor: `${GameColors.currency.research}18`,
  },
  unlockTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: GameColors.text.primary,
  },
  unlockMessage: {
    fontSize: 12,
    color: GameColors.text.secondary,
    lineHeight: 16,
  },
  momentLockBlocker: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
