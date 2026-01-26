import React from "react";
import { View, StyleSheet, ScrollView, Pressable, ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { Part, PartFamily, PartTier } from "@/types/game";
import { PartItem } from "./PartItem";

const stationWorkbench = require("../../../assets/images/station-workbench.png");
const stationInbox = require("../../../assets/images/station-inbox.png");
const stationRd = require("../../../assets/images/station-rd.png");
const bulbBaronImage = require("../../../assets/images/bulb-baron.png");
const freedomControllerImage = require("../../../assets/images/freedom-controller.png");

interface GlossaryModalProps {
  onClose: () => void;
}

interface GlossaryItem {
  id: string;
  title: string;
  description: string;
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
  image?: ImageSourcePropType;
  part?: { tier: PartTier; family: PartFamily };
}

interface GlossarySection {
  id: string;
  title: string;
  items: GlossaryItem[];
}

const makePart = (tier: PartTier, family: PartFamily): Part => ({
  id: `glossary-${family}-${tier}`,
  tier,
  family,
  position: -1,
});

const GLOSSARY_SECTIONS: GlossarySection[] = [
  {
    id: "parts-open",
    title: "Parts (Open Standard)",
    items: [
      {
        id: "part-open-1",
        title: "Clip (Open)",
        description: "Starter part for open-standard builds.",
        part: { tier: 1, family: "open" },
      },
      {
        id: "part-open-2",
        title: "Track (Open)",
        description: "Tier 2 run for open-standard installs.",
        part: { tier: 2, family: "open" },
      },
      {
        id: "part-open-3",
        title: "Segment (Open)",
        description: "Tier 3 segment for larger installs.",
        part: { tier: 3, family: "open" },
      },
      {
        id: "part-open-4",
        title: "Smart Kit (Open)",
        description: "Tier 4 smart kit for advanced jobs.",
        part: { tier: 4, family: "open" },
      },
      {
        id: "part-open-5",
        title: "Premium System (Open)",
        description: "Top-tier open system.",
        part: { tier: 5, family: "open" },
      },
    ],
  },
  {
    id: "parts-locked",
    title: "Parts (Locked Certified)",
    items: [
      {
        id: "part-locked-1",
        title: "Clip (Locked)",
        description: "Certified part; faster early gains, raises Dependency.",
        part: { tier: 1, family: "locked" },
      },
      {
        id: "part-locked-2",
        title: "Track (Locked)",
        description: "Tier 2 locked track.",
        part: { tier: 2, family: "locked" },
      },
      {
        id: "part-locked-3",
        title: "Segment (Locked)",
        description: "Tier 3 locked segment.",
        part: { tier: 3, family: "locked" },
      },
      {
        id: "part-locked-4",
        title: "Smart Kit (Locked)",
        description: "Tier 4 locked smart kit.",
        part: { tier: 4, family: "locked" },
      },
      {
        id: "part-locked-5",
        title: "Premium System (Locked)",
        description: "Top-tier locked system.",
        part: { tier: 5, family: "locked" },
      },
    ],
  },
  {
    id: "stations",
    title: "Stations",
    items: [
      {
        id: "station-workbench",
        title: "Workbench",
        description: "Tap to spawn parts. Cooldown improves with upgrades.",
        image: stationWorkbench,
      },
      {
        id: "station-orders",
        title: "Order Inbox",
        description: "Open orders. Fulfill to earn rewards.",
        image: stationInbox,
      },
      {
        id: "station-rd",
        title: "R&D Bench",
        description: "Spend research to unlock Freedom tech.",
        image: stationRd,
      },
    ],
  },
  {
    id: "utilities",
    title: "Utilities",
    items: [
      {
        id: "utility-backpack",
        title: "Backpack",
        description: "Temporary storage. Drag items in and out.",
        icon: "archive",
        color: GameColors.ui.primary,
      },
      {
        id: "utility-recycle",
        title: "Recycle Bin",
        description: "Delete parts for a small cash/research refund.",
        icon: "trash-2",
        color: GameColors.ui.danger,
      },
    ],
  },
  {
    id: "currencies",
    title: "Currencies",
    items: [
      {
        id: "currency-cash",
        title: "Cash",
        description: "Buy upgrades and expand your workshop.",
        icon: "dollar-sign",
        color: GameColors.currency.cash,
      },
      {
        id: "currency-rep",
        title: "Reputation",
        description: "Unlocks neighborhoods and better orders.",
        icon: "star",
        color: GameColors.currency.reputation,
      },
      {
        id: "currency-research",
        title: "Research",
        description: "Unlocks R&D nodes and the Freedom Controller.",
        icon: "zap",
        color: GameColors.currency.research,
      },
    ],
  },
  {
    id: "dependency",
    title: "Dependency + Villain",
    items: [
      {
        id: "dependency-meter",
        title: "Dependency Meter",
        description: "Rises with locked parts. High levels add certified/locked orders.",
        icon: "activity",
        color: GameColors.ui.warning,
      },
      {
        id: "baron",
        title: "Bulb Baron",
        description: "Locked supplier. Tempting offers increase Dependency.",
        image: bulbBaronImage,
      },
      {
        id: "freedom-controller",
        title: "Freedom Controller",
        description: "Converts locked kits into open-compatible builds.",
        image: freedomControllerImage,
      },
    ],
  },
  {
    id: "order-badges",
    title: "Order Badges",
    items: [
      {
        id: "badge-certified",
        title: "Certified",
        description: "Locked preferred or required for full rewards.",
        icon: "lock",
        color: GameColors.locked.primary,
      },
      {
        id: "badge-rush",
        title: "Rush",
        description: "Bonus decays over time. No hard fail.",
        icon: "clock",
        color: GameColors.ui.danger,
      },
      {
        id: "badge-style",
        title: "Style Match",
        description: "All items must be Open or all Locked.",
        icon: "layers",
        color: GameColors.ui.primary,
      },
      {
        id: "badge-preference",
        title: "Preference",
        description: "Prefers Open or Locked. Wrong family reduces payout.",
        icon: "heart",
        color: GameColors.currency.reputation,
      },
      {
        id: "badge-exact",
        title: "Exact Tiers",
        description: "Exact tier required. No substitutions.",
        icon: "check-circle",
        color: GameColors.text.secondary,
      },
      {
        id: "badge-eco",
        title: "Eco Audit",
        description: "Open kits grant bonus research.",
        icon: "feather",
        color: GameColors.currency.research,
      },
      {
        id: "badge-lockout",
        title: "Lockout",
        description: "Firmware lock. Use locked or compatible kits.",
        icon: "alert-triangle",
        color: GameColors.ui.danger,
      },
    ],
  },
];

export function GlossaryModal({ onClose }: GlossaryModalProps) {
  return (
    <LinearGradient colors={["#0A0A14", "#0F0F1F", "#0A0A14"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[`${GameColors.ui.primary}30`, `${GameColors.ui.primary}10`]}
            style={styles.headerIcon}
          >
            <Feather name="help-circle" size={22} color={GameColors.ui.primary} />
          </LinearGradient>
          <View>
            <ThemedText style={styles.title}>Glossary</ThemedText>
            <ThemedText style={styles.subtitle}>Every icon, badge, and system</ThemedText>
          </View>
        </View>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Feather name="x" size={22} color={GameColors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {GLOSSARY_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <View style={styles.sectionCard}>
              {section.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemIcon}>
                    {item.part ? (
                      <PartItem part={makePart(item.part.tier, item.part.family)} size={42} disabled />
                    ) : item.image ? (
                      <Image source={item.image} style={styles.imageIcon} contentFit="contain" />
                    ) : item.icon ? (
                      <LinearGradient
                        colors={[`${item.color ?? GameColors.ui.primary}30`, `${item.color ?? GameColors.ui.primary}10`]}
                        style={styles.iconContainer}
                      >
                        <Feather name={item.icon} size={18} color={item.color ?? GameColors.ui.primary} />
                      </LinearGradient>
                    ) : null}
                  </View>
                  <View style={styles.itemText}>
                    <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  sectionCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#141426",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  itemIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  imageIcon: {
    width: 40,
    height: 40,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  itemDescription: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
});
