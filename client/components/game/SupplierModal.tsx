import React, { useMemo, useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ModalShell } from "./ModalShell";
import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { useGame } from "@/context/GameContext";
import { SUPPLIER_CONFIG } from "@/constants/dropTables";
import type { SupplierId } from "@/types/game";

interface SupplierModalProps {
  visible: boolean;
  onClose: () => void;
  onToast?: (message: string, duration?: number) => void;
}

const SUPPLIER_META: Record<
  SupplierId,
  { name: string; description: string; icon: keyof typeof Feather.glyphMap; accent: string }
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

const SUPPLIER_COOLDOWN_REDUCTION_MS_PER_LEVEL = 2000;
const SUPPLIER_COOLDOWN_MIN_MS = 15000;

function getSupplierConfig(supplierId: SupplierId, level: number, speedLevel = 0) {
  const config = SUPPLIER_CONFIG[supplierId] || {};
  if (config[level]) return config[level];
  const levels = Object.keys(config)
    .map((entry) => Number(entry))
    .filter((value) => Number.isFinite(value));
  const fallbackLevel = levels.length > 0 ? Math.max(...levels) : 1;
  const base = config[fallbackLevel] || { maxCharges: 0, cooldownMs: 60000 };
  if (!speedLevel) return base;
  const reduction = speedLevel * SUPPLIER_COOLDOWN_REDUCTION_MS_PER_LEVEL;
  return {
    ...base,
    cooldownMs: Math.max(SUPPLIER_COOLDOWN_MIN_MS, base.cooldownMs - reduction),
  };
}

export function SupplierModal({ visible, onClose, onToast }: SupplierModalProps) {
  const { state, tapSupplier, dispatch } = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!visible) return;
    dispatch({ type: "TICK_SUPPLIERS" });
    const timer = setInterval(() => {
      setNow(Date.now());
      dispatch({ type: "TICK_SUPPLIERS" });
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, dispatch]);

  const handleTap = (supplierId: SupplierId) => {
    const success = tapSupplier(supplierId);
    if (!success) {
      onToast?.("No space or charges available.", 1800);
    }
  };

  const materialLabel = useMemo(
    () => `Upgrade Materials: ${state.upgradeMaterials}`,
    [state.upgradeMaterials]
  );
  const compatLabel = useMemo(
    () => `Compatibility Components: ${state.compatibilityComponents}`,
    [state.compatibilityComponents]
  );

  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.container} onPress={(event) => event.stopPropagation()}>
        <ModalShell
          variant="card"
          title="Suppliers"
          subtitle="Choose a supply source. Charges refill over time."
          onClose={onClose}
        >
          <View style={styles.resourceRow}>
            <View style={styles.resourcePill}>
              <Feather name="clipboard" size={12} color={GameColors.text.secondary} />
              <ThemedText style={styles.resourceText}>{materialLabel}</ThemedText>
            </View>
            <View style={styles.resourcePill}>
              <Feather name="shield" size={12} color={GameColors.text.secondary} />
              <ThemedText style={styles.resourceText}>{compatLabel}</ThemedText>
            </View>
          </View>

          {(["baron", "open", "salvage"] as SupplierId[]).map((supplierId) => {
            const meta = SUPPLIER_META[supplierId];
            const supplier = state.suppliers[supplierId];
            const locked = supplier.level <= 0;
            const speedLevel = state.upgrades["workbench_speed_1"] || 0;
            const config = getSupplierConfig(
              supplierId,
              Math.max(1, supplier.level),
              speedLevel
            );
            const cooldownRemaining = Math.max(0, supplier.cooldownEndsAt - now);
            const charges = supplier.chargesRemaining;
            const chargesDisplay = locked ? "Locked" : `${charges}/${config.maxCharges}`;
            const isCooling = !locked && charges <= 0 && cooldownRemaining > 0;
            const buttonLabel = locked
              ? "Locked"
              : isCooling
              ? `Cooldown ${Math.ceil(cooldownRemaining / 1000)}s`
              : "Tap";
            return (
              <LinearGradient
                key={supplierId}
                colors={["#1F1F2E", "#26263A", "#1F1F2E"]}
                style={[styles.card, { borderColor: meta.accent + "40" }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: meta.accent + "20" }]}
                    >
                    <Feather name={meta.icon} size={18} color={meta.accent} />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <ThemedText style={styles.cardTitle}>{meta.name}</ThemedText>
                    <ThemedText style={styles.cardSubtitle}>{meta.description}</ThemedText>
                  </View>
                  <View style={styles.levelPill}>
                    <ThemedText style={styles.levelText}>{locked ? "L0" : `L${supplier.level}`}</ThemedText>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <ThemedText style={styles.chargeText}>Charges: {chargesDisplay}</ThemedText>
                  <Pressable
                    onPress={() => handleTap(supplierId)}
                    disabled={locked || isCooling}
                    style={[
                      styles.tapButton,
                      {
                        backgroundColor:
                          locked || isCooling ? GameColors.ui.surface : meta.accent,
                      },
                    ]}
                  >
                    <ThemedText style={styles.tapButtonText}>{buttonLabel}</ThemedText>
                  </Pressable>
                </View>
              </LinearGradient>
            );
          })}
        </ModalShell>
      </Pressable>
    </Pressable>
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
