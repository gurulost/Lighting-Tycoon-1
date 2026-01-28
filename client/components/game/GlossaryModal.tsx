import React, { useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ImageSourcePropType,
  TextInput,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { AvatarImage } from "./AvatarImage";

import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { Part, PartFamily, PartTier } from "@/types/game";
import { PartItem } from "./PartItem";
import { useGame } from "@/context/GameContext";

const stationWorkbench = require("../../../assets/images/station-workbench.webp");
const stationInbox = require("../../../assets/images/station-inbox.webp");
const stationRd = require("../../../assets/images/station-rd.webp");
const freedomControllerImage = require("../../../assets/images/freedom-controller.webp");
const tinaPortrait = require("../../../assets/images/tina/tina-portrait-256.webp");
const mentorPortrait = require("../../../assets/images/mentor/mentor-portrait-256.webp");
const baronPortrait = require("../../../assets/images/baron/baron-portrait-256.webp");

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
  isPortrait?: boolean;
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
    id: "characters",
    title: "Characters",
    items: [
      {
        id: "character-tina",
        title: "Tina",
        description:
          "You. Owner of the Glow Workshop—confident, clever, and always in control of the glow.",
        image: tinaPortrait,
        isPortrait: true,
      },
      {
        id: "character-mentor",
        title: "Mentor",
        description: "Retired installer who teaches the craft and keeps you grounded.",
        image: mentorPortrait,
        isPortrait: true,
      },
      {
        id: "character-baron",
        title: "Bulb Baron",
        description: "Corporate supplier with tempting locked offers and strict terms.",
        image: baronPortrait,
        isPortrait: true,
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
        id: "freedom-controller",
        title: "Freedom Controller",
        description: "Converts locked kits into open-compatible builds for special orders.",
        image: freedomControllerImage,
      },
    ],
  },
  {
    id: "letter-legend",
    title: "Letters + Badges",
    items: [
      {
        id: "legend-order-letters",
        title: "Order Letters (C/T/S/K/P)",
        description:
          "Order hints use letters for part tiers: C=Clip, T=Track, S=Segment, K=Smart Kit, P=Premium System.",
        icon: "type",
        color: GameColors.ui.primary,
      },
      {
        id: "legend-tile-badges",
        title: "Tile Badges (O/L/C)",
        description:
          "O=open-standard, L=locked certified, C=compatible (counts for locked + compatible orders).",
        icon: "tag",
        color: GameColors.text.secondary,
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
        id: "badge-compatible",
        title: "Compatible",
        description: "Requires open-compatible parts (liberated tech).",
        icon: "shield",
        color: GameColors.ui.success,
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
  const { state } = useGame();
  const reducedMotion = state.settings.reducedMotion;
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return GLOSSARY_SECTIONS;
    return GLOSSARY_SECTIONS.map((section) => {
      const items = section.items.filter((item) => {
        const haystack = `${item.title} ${item.description}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [normalizedQuery]);

  const handleJumpTo = (sectionId: string) => {
    const offset = sectionOffsets[sectionId];
    if (offset === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, offset - Spacing.md), animated: true });
  };
  return (
    <ModalShell
      title="Glossary"
      subtitle="Every icon, badge, and system"
      icon="help-circle"
      iconColor={GameColors.ui.primary}
      onClose={onClose}
    >
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={GameColors.text.secondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search glossary"
            placeholderTextColor={GameColors.text.disabled}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} style={styles.clearButton}>
              <Feather name="x" size={14} color={GameColors.text.secondary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.indexRow}
        >
          {filteredSections.map((section) => (
            <Pressable
              key={section.id}
              onPress={() => handleJumpTo(section.id)}
              style={styles.indexChip}
            >
              <ThemedText style={styles.indexChipText}>{section.title}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing["4xl"] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredSections.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={28} color={GameColors.text.disabled} />
            <ThemedText style={styles.emptyTitle}>No matches</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Try a different keyword or clear the search.
            </ThemedText>
          </View>
        ) : (
          filteredSections.map((section) => (
            <View
              key={section.id}
              style={styles.section}
              onLayout={(event) =>
                setSectionOffsets((prev) => ({
                  ...prev,
                  [section.id]: event.nativeEvent.layout.y,
                }))
              }
            >
              <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
              <View style={styles.sectionCard}>
                {section.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemIcon}>
                      {item.part ? (
                        <PartItem
                          part={makePart(item.part.tier, item.part.family)}
                          size={42}
                          disabled
                          reducedMotion={reducedMotion}
                        />
                      ) : item.image && item.isPortrait ? (
                        <AvatarImage
                          source={item.image}
                          size={40}
                          borderColor="#2A2A4A"
                          backgroundColor="rgba(255,255,255,0.08)"
                          icon="user"
                          iconColor={GameColors.text.secondary}
                        />
                      ) : item.image ? (
                        <Image
                          source={item.image}
                          style={styles.imageIcon}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                        />
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
          ))
        )}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
    gap: Spacing.lg,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#141426",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: GameColors.text.primary,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  indexRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  indexChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  indexChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.secondary,
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
    fontSize: 13,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  emptyDescription: {
    fontSize: 12,
    color: GameColors.text.disabled,
    textAlign: "center",
  },
});
