import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { PROJECT_DEFINITION_BY_ID } from "@/constants/projects";
import { getProjectCardImage } from "@/constants/projectAssets";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

type ProjectRevealModalProps = {
  projectId: string | null;
  onDismiss: () => void;
  onOpenDossier: (projectId: string) => void;
};

export function ProjectRevealModal({
  projectId,
  onDismiss,
  onOpenDossier,
}: ProjectRevealModalProps) {
  const insets = useSafeAreaInsets();
  const project = projectId
    ? PROJECT_DEFINITION_BY_ID.get(projectId)
    : undefined;
  const imageSource = project
    ? getProjectCardImage(project.projectCardIcon)
    : undefined;

  const narrativeParagraphs = useMemo(() => {
    if (!project) return [];
    const body = project.introNarrative || project.synopsis;
    return body.split("\n\n").map((line) => line.trim());
  }, [project]);

  if (!project) return null;

  const screen = Dimensions.get("window");
  const maxCardHeight = Math.min(screen.height * 0.92, 780);

  return (
    <View style={styles.backdrop}>
      <LinearGradient
        colors={["#0B0B16", "#121225", "#101022"]}
        style={[
          styles.card,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.lg,
            maxHeight: maxCardHeight,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.kickerRow}>
            <Feather name="flag" size={14} color={GameColors.ui.primary} />
            <ThemedText style={styles.kickerText}>
              New Empire Contract
            </ThemedText>
          </View>
          <Pressable style={styles.closeButton} onPress={onDismiss}>
            <Feather name="x" size={18} color={GameColors.text.primary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleBlock}>
            <ThemedText style={styles.title}>{project.title}</ThemedText>
            <ThemedText style={styles.subtitle}>
              {project.locationName}
            </ThemedText>
            <ThemedText style={styles.meta}>
              {project.client.name} · {project.client.role}
            </ThemedText>
          </View>

          <View style={styles.heroFrame}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={styles.heroImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
                transition={150}
              />
            ) : (
              <View style={styles.heroFallback}>
                <Feather
                  name="image"
                  size={32}
                  color={GameColors.text.secondary}
                />
              </View>
            )}
          </View>

          {project.introHeadline ? (
            <ThemedText style={styles.headline}>
              {project.introHeadline}
            </ThemedText>
          ) : null}

          <View style={styles.storyBlock}>
            {narrativeParagraphs.map((paragraph, index) => (
              <ThemedText key={`${project.id}-p-${index}`} style={styles.story}>
                {paragraph}
              </ThemedText>
            ))}
          </View>

          <View style={styles.perkBlock}>
            <View style={styles.perkIcon}>
              <Feather name="star" size={14} color={GameColors.ui.success} />
            </View>
            <View style={styles.perkTextBlock}>
              <ThemedText style={styles.perkTitle}>Legacy perk</ThemedText>
              <ThemedText style={styles.perkName}>
                {project.permanentPerk ?? "Legacy Reward"}
              </ThemedText>
              {project.perkDescription ? (
                <ThemedText style={styles.perkDescription}>
                  {project.perkDescription}
                </ThemedText>
              ) : null}
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={onDismiss}>
              <ThemedText style={styles.secondaryButtonText}>
                Maybe later
              </ThemedText>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => onOpenDossier(project.id)}
            >
              <LinearGradient
                colors={["#3E8CFF", "#2E5BFF"]}
                style={styles.primaryButtonFill}
              >
                <Feather name="book" size={14} color="#FFFFFF" />
                <ThemedText style={styles.primaryButtonText}>
                  View dossier
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 6, 18, 0.78)",
    padding: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    paddingHorizontal: Spacing.lg,
    shadowColor: "#0B0B1F",
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  kickerText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#161629",
  },
  content: {
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: GameColors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  meta: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  heroFrame: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#0F0F1E",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  storyBlock: {
    gap: Spacing.sm,
  },
  story: {
    fontSize: 13,
    color: GameColors.text.secondary,
    lineHeight: 18,
  },
  perkBlock: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#14142A",
  },
  perkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1F2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  perkTextBlock: {
    flex: 1,
    gap: 2,
  },
  perkTitle: {
    fontSize: 11,
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  perkName: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  perkDescription: {
    fontSize: 12,
    color: GameColors.text.secondary,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  primaryButton: {
    flex: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  primaryButtonFill: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151528",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
});
