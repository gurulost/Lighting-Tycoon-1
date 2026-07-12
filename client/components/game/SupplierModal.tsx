import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ModalShell } from "./ModalShell";
import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { useGame } from "@/context/GameContext";
import { getEffectiveSupplierConfig } from "@/constants/suppliers";
import type { SupplierId } from "@/types/game";
import {
  formatCooldownSeconds,
  getCooldownRemainingMs,
  getCooldownRemainingSeconds,
} from "@/lib/cooldown";

interface SupplierModalProps {
  visible: boolean;
  onClose: () => void;
  onToast?: (message: string, duration?: number) => void;
}

const SUPPLIER_META: Record<
  SupplierId,
  {
    name: string;
    description: string;
    icon: keyof typeof Feather.glyphMap;
    accent: string;
  }
> = {
  baron: {
    name: "Baron Supply Depot",
    description: "Fast locked supply. Reliable, but it tightens the leash.",
    icon: "package",
    accent: GameColors.locked.primary,
  },
  open: {
    name: "Open Workshop",
    description: "Open-standard supply. Starts slow, scales hard.",
    icon: "tool",
    accent: GameColors.openStandard.primary,
  },
  salvage: {
    name: "Salvage Corner",
    description: "Refurb drops plus cleanup value. Strategic relief.",
    icon: "refresh-cw",
    accent: GameColors.ui.warning,
  },
};

export function SupplierModal({
  visible,
  onClose,
  onToast,
}: SupplierModalProps) {
  const { state, tapSupplier, getSupplierTapStatus, dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const [now, setNow] = useState(() => Date.now());
  const baronEarlyRelief =
    state.suppliers.open.level <= 0 && state.suppliers.salvage.level <= 0;

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!state.tutorialComplete) return;
    if (state.suppliers.open.level > 0) return;
    if (state.storySeen["tina_open_locked"]) return;
    dispatch({ type: "QUEUE_STORY_BEAT", beatId: "tina_open_locked" });
  }, [
    visible,
    state.tutorialComplete,
    state.suppliers.open.level,
    state.storySeen,
    dispatch,
  ]);

  const handleTap = (supplierId: SupplierId) => {
    const result = tapSupplier(supplierId);
    if (result.ok) return;
    const message =
      result.reason === "locked"
        ? "Supplier locked."
        : result.reason === "no_space"
          ? "No space available."
          : result.reason === "insufficient_cash"
            ? "Not enough cash to overdraw."
            : result.reason === "insufficient_research"
              ? "Not enough research to overdraw."
              : result.reason === "insufficient_waste"
                ? "Need more waste to overdraw."
                : "Cooling down.";
    onToast?.(message, 1800);
  };

  const materialLabel = useMemo(
    () => `Upgrade Materials: ${state.upgradeMaterials}`,
    [state.upgradeMaterials],
  );
  const compatLabel = useMemo(
    () => `Interop Cores: ${state.compatibilityComponents}`,
    [state.compatibilityComponents],
  );

  if (!visible) return null;
  const maxHeight = screenHeight - insets.top - insets.bottom - Spacing["4xl"];

  return (
    <View
      style={[
        styles.overlay,
        {
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.lg,
          paddingLeft: insets.left + Spacing.lg,
          paddingRight: insets.right + Spacing.lg,
        },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <View style={[styles.container, { maxHeight }]}>
        <ModalShell
          variant="card"
          title="Suppliers"
          subtitle="Choose a supply source. Charges refill over time."
          onClose={onClose}
          testID="supplier-modal"
          closeTestID="supplier-modal-close"
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resourceRow}>
              <View style={styles.resourcePill}>
                <Feather
                  name="clipboard"
                  size={12}
                  color={GameColors.text.secondary}
                />
                <ThemedText style={styles.resourceText}>
                  {materialLabel}
                </ThemedText>
              </View>
              <View style={styles.resourcePill}>
                <Feather
                  name="cpu"
                  size={12}
                  color={GameColors.currency.research}
                />
                <ThemedText style={styles.resourceText}>
                  {compatLabel}
                </ThemedText>
              </View>
            </View>

            {(["baron", "open", "salvage"] as SupplierId[]).map(
              (supplierId) => {
                const meta = SUPPLIER_META[supplierId];
                const supplier = state.suppliers[supplierId];
                const locked = supplier.level <= 0;
                const lockedHint =
                  supplierId === "open"
                    ? "Requires R&D Access + Open Workshop I (1 Upgrade Material). Upgrade Materials come from Salvage (unlock in Upgrades)."
                    : supplierId === "salvage"
                      ? "Unlock via Upgrades: Salvage Corner (350 cash)."
                      : undefined;
                const mentorTip =
                  supplierId === "baron"
                    ? "Mentor tip: Baron shipments include waste — merge or recycle it for value."
                    : undefined;
                const speedLevel = state.upgrades["workbench_speed_1"] || 0;
                const config = getEffectiveSupplierConfig(
                  supplierId,
                  Math.max(1, supplier.level),
                  speedLevel,
                  { baronEarlyRelief },
                );
                const cooldownRemaining = getCooldownRemainingMs(
                  supplier.cooldownEndsAt,
                  now,
                );
                const charges = supplier.chargesRemaining;
                const tapStatus = getSupplierTapStatus(supplierId, now);
                const chargesDisplay = locked
                  ? "Locked"
                  : `${charges}/${config.maxCharges}`;
                const isCooling =
                  !locked && charges <= 0 && cooldownRemaining > 0;
                const isOverdraw = tapStatus.mode === "overdraw";
                const buttonLabel = locked
                  ? "Locked"
                  : isOverdraw
                    ? "Overdraw"
                    : isCooling
                      ? `Cooldown ${formatCooldownSeconds(
                          getCooldownRemainingSeconds(
                            supplier.cooldownEndsAt,
                            now,
                          ),
                        )}s`
                      : "Tap";
                const overdrawCost = tapStatus.cost;
                let overdrawLabel: string | null = null;
                if (isOverdraw && overdrawCost) {
                  const parts: string[] = [];
                  const isSalvageFallback =
                    supplierId === "salvage" &&
                    overdrawCost.salvageMethod === "cash_fallback";
                  if (isSalvageFallback && overdrawCost.wasteRequired > 0) {
                    parts.push(
                      `${overdrawCost.wasteRequired} waste or $${overdrawCost.cash}`,
                    );
                  } else {
                    if (overdrawCost.cash > 0) {
                      parts.push(`$${overdrawCost.cash}`);
                    }
                    if (overdrawCost.research > 0) {
                      parts.push(`-${overdrawCost.research} research`);
                    }
                    if (overdrawCost.wasteRequired > 0) {
                      parts.push(`-${overdrawCost.wasteRequired} waste`);
                    }
                  }
                  if (overdrawCost.extraWasteChance > 0) {
                    parts.push(
                      `+${Math.round(overdrawCost.extraWasteChance * 100)}% waste`,
                    );
                  }
                  if (overdrawCost.overheatMs > 0) {
                    parts.push(
                      `+${formatCooldownSeconds(
                        overdrawCost.overheatMs / 1000,
                      )}s cooldown`,
                    );
                  }
                  if (parts.length > 0) {
                    overdrawLabel = `Overdraw: ${parts.join(" · ")}`;
                  }
                }
                return (
                  <LinearGradient
                    key={supplierId}
                    colors={["#1F1F2E", "#26263A", "#1F1F2E"]}
                    style={[styles.card, { borderColor: meta.accent + "40" }]}
                  >
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.iconWrap,
                          { backgroundColor: meta.accent + "20" },
                        ]}
                      >
                        <Feather
                          name={meta.icon}
                          size={18}
                          color={meta.accent}
                        />
                      </View>
                      <View style={styles.cardTitleWrap}>
                        <ThemedText style={styles.cardTitle}>
                          {meta.name}
                        </ThemedText>
                        <ThemedText style={styles.cardSubtitle}>
                          {meta.description}
                        </ThemedText>
                        {locked && lockedHint ? (
                          <ThemedText style={styles.lockedHint}>
                            {lockedHint}
                          </ThemedText>
                        ) : null}
                        {mentorTip ? (
                          <ThemedText style={styles.mentorTip}>
                            {mentorTip}
                          </ThemedText>
                        ) : null}
                        {overdrawLabel ? (
                          <ThemedText style={styles.overdrawHint}>
                            {overdrawLabel}
                          </ThemedText>
                        ) : null}
                      </View>
                      <View style={styles.levelPill}>
                        <ThemedText style={styles.levelText}>
                          {locked ? "L0" : `L${supplier.level}`}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <ThemedText style={styles.chargeText}>
                        Charges: {chargesDisplay}
                      </ThemedText>
                      <Pressable
                        onPress={() => handleTap(supplierId)}
                        disabled={locked || !tapStatus.ok}
                        testID={`supplier-tap-${supplierId}`}
                        style={[
                          styles.tapButton,
                          {
                            backgroundColor:
                              locked || !tapStatus.ok
                                ? GameColors.ui.surface
                                : meta.accent,
                          },
                        ]}
                      >
                        <ThemedText style={styles.tapButtonText}>
                          {buttonLabel}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </LinearGradient>
                );
              },
            )}
          </ScrollView>
        </ModalShell>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,20,0.6)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: GameColors.ui.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  resourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  resourcePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: GameColors.ui.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  resourceText: {
    color: GameColors.text.secondary,
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  lockedHint: {
    marginTop: 6,
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  mentorTip: {
    marginTop: 6,
    fontSize: 11,
    color: GameColors.text.primary,
  },
  overdrawHint: {
    marginTop: 6,
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  levelPill: {
    borderRadius: BorderRadius.full,
    backgroundColor: GameColors.ui.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  cardFooter: {
    marginTop: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chargeText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  tapButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
  },
  tapButtonText: {
    color: "#0F0F1F",
    fontWeight: "700",
    fontSize: 12,
  },
});
