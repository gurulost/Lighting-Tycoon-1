import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "@/components/game/ModalShell";
import { useGame } from "@/context/GameContext";
import { PROJECT_DEFINITION_BY_ID } from "@/constants/projects";
import {
  getProjectCardImage,
  getProjectTrophyImage,
} from "@/constants/projectAssets";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { ProjectStageDefinition } from "@/types/game";
import { getProjectDepositCost } from "@/lib/projects";
import { getCouncilPerkEffects, getCouncilHearingPenalty } from "@/lib/council";
import { getTuning } from "@/lib/tuning";

type StageTag = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
};

const getStageTags = (stage: ProjectStageDefinition): StageTag[] => {
  const tags: StageTag[] = [];
  if (stage.orderSpec.requiresOpenOnly) {
    tags.push({
      label: "Open-only",
      icon: "sun",
      color: GameColors.openStandard.primary,
    });
  }
  if (stage.orderSpec.requiresCompatibility) {
    tags.push({
      label: "Interop",
      icon: "shield",
      color: GameColors.ui.success,
    });
  }
  if (stage.orderSpec.ecoAudit) {
    tags.push({
      label: "Eco",
      icon: "wind",
      color: GameColors.currency.research,
    });
  }
  if (stage.orderSpec.rush) {
    tags.push({
      label: "Rush",
      icon: "clock",
      color: GameColors.ui.danger,
    });
  }
  if (stage.orderSpec.noSubstitutions) {
    tags.push({
      label: "Exact",
      icon: "slash",
      color: GameColors.text.secondary,
    });
  }
  return tags;
};

function TagChip({ tag }: { tag: StageTag }) {
  return (
    <View
      style={[
        styles.tagChip,
        { borderColor: `${tag.color}50`, backgroundColor: `${tag.color}15` },
      ]}
    >
      <Feather name={tag.icon} size={11} color={tag.color} />
      <ThemedText style={[styles.tagChipText, { color: tag.color }]}>
        {tag.label}
      </ThemedText>
    </View>
  );
}

type ProjectDossierModalProps = {
  projectId: string;
  onClose: () => void;
  onOpenBoard?: (projectId: string, tab?: "offers" | "active") => void;
};

export function ProjectDossierModal({
  projectId,
  onClose,
  onOpenBoard,
}: ProjectDossierModalProps) {
  const { state } = useGame();
  const project = PROJECT_DEFINITION_BY_ID.get(projectId);
  const tuning = getTuning();
  const narrativeParagraphs = useMemo(() => {
    if (!project) return [];
    const body = project.introNarrative || project.synopsis;
    return body.split("\n\n").map((line) => line.trim());
  }, [project]);

  if (!project) {
    return (
      <ModalShell title="Project Dossier" icon="book" onClose={onClose}>
        <View style={styles.missingState}>
          <Feather name="alert-circle" size={24} color={GameColors.ui.danger} />
          <ThemedText style={styles.missingText}>
            Project data unavailable.
          </ThemedText>
        </View>
      </ModalShell>
    );
  }

  const heroImage = getProjectCardImage(project.projectCardIcon, "md");
  const trophyImage = getProjectTrophyImage(project.trophyIcon, "sm");
  const activeProject =
    state.activeProject?.projectId === project.id ? state.activeProject : null;
  const completed = state.projectsCompleted.includes(project.id);
  const completionAt = state.projectCompletionLog[project.id];
  const offered = state.projectOffers.some(
    (offer) => offer.projectId === project.id,
  );
  const eligible =
    state.projectsUnlocked &&
    state.gamePhase >= 2 &&
    state.reputationTier >= project.unlock.minRepTier &&
    (typeof project.unlock.minProjectsCompleted !== "number" ||
      state.projectsCompleted.length >= project.unlock.minProjectsCompleted);

  const councilPerks = getCouncilPerkEffects(state);
  const councilHearing = getCouncilHearingPenalty(state);
  const depositMultiplier =
    councilPerks.projectDepositMult * councilHearing.projectDepositMult;
  const depositCost = getProjectDepositCost(
    project,
    state.reputationTier,
    state.maxTierCrafted,
    depositMultiplier,
  );

  const completionScale = Math.max(
    0,
    tuning.projects.completionRewardMultiplier,
  );
  const completionRewards = {
    cash: project.completionRewards.cashMultiplier * completionScale,
    reputation:
      project.completionRewards.reputationMultiplier * completionScale,
    research: project.completionRewards.researchMultiplier * completionScale,
  };

  const completedStages = new Set(
    activeProject?.stageHistory.map((entry) => entry.stageIndex) ?? [],
  );

  const statusLabel = completed
    ? "Completed"
    : activeProject
      ? `Active · Stage ${activeProject.stageIndex + 1}/${project.stages.length}`
      : offered
        ? "Offer Available"
        : eligible
          ? "Eligible"
          : "Locked";
  const canOpenBoard = Boolean(onOpenBoard && (offered || activeProject));
  const boardTab = activeProject ? "active" : "offers";
  const boardCtaLabel = activeProject ? "Open active project" : "Review offer";

  return (
    <ModalShell
      title="Project Dossier"
      subtitle={project.title}
      icon="book"
      iconColor={GameColors.ui.primary}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#1B263B", "#121225", "#10101F"]}
          style={styles.heroCard}
        >
          {heroImage ? (
            <Image
              source={heroImage}
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
          <View style={styles.heroOverlay}>
            <ThemedText style={styles.heroTitle}>{project.title}</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              {project.locationName}
            </ThemedText>
          </View>
        </LinearGradient>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Feather name="user" size={12} color={GameColors.text.secondary} />
            <ThemedText style={styles.metaText}>
              {project.client.name} · {project.client.role}
            </ThemedText>
          </View>
          <View style={styles.metaChip}>
            <Feather name="flag" size={12} color={GameColors.text.secondary} />
            <ThemedText style={styles.metaText}>{statusLabel}</ThemedText>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText style={styles.sectionTitle}>Briefing</ThemedText>
          {project.introHeadline ? (
            <ThemedText style={styles.headline}>
              {project.introHeadline}
            </ThemedText>
          ) : null}
          {narrativeParagraphs.map((paragraph, index) => (
            <ThemedText
              key={`${project.id}-brief-${index}`}
              style={styles.body}
            >
              {paragraph}
            </ThemedText>
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText style={styles.sectionTitle}>Contract terms</ThemedText>
          <View style={styles.termRow}>
            <View style={styles.termChip}>
              <Feather
                name="shield"
                size={12}
                color={GameColors.currency.cash}
              />
              <ThemedText style={styles.termText}>
                Deposit{" "}
                {activeProject ? activeProject.depositPaid : depositCost}
              </ThemedText>
            </View>
            <View style={styles.termChip}>
              <Feather
                name="layers"
                size={12}
                color={GameColors.text.secondary}
              />
              <ThemedText style={styles.termText}>
                {project.stages.length} stages
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText style={styles.sectionTitle}>Legacy perk</ThemedText>
          <View style={styles.perkBlock}>
            <View style={styles.perkIcon}>
              <Feather name="star" size={14} color={GameColors.ui.success} />
            </View>
            <View style={styles.perkTextBlock}>
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
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText style={styles.sectionTitle}>Stage plan</ThemedText>
          <View style={styles.stageList}>
            {project.stages.map((stage, index) => {
              const isComplete =
                completed || completedStages.has(stage.stageIndex);
              const isCurrent =
                activeProject?.stageIndex === stage.stageIndex && !completed;
              const deadlineEnabled =
                tuning.projects.deadlineEnabled &&
                stage.deadline?.type === "installs";
              return (
                <View
                  key={`${project.id}-stage-${stage.stageIndex}`}
                  style={[
                    styles.stageRow,
                    isComplete && styles.stageRowComplete,
                    isCurrent && styles.stageRowActive,
                  ]}
                >
                  <View style={styles.stageIndexBubble}>
                    <ThemedText style={styles.stageIndexText}>
                      {isComplete ? "✓" : stage.stageIndex + 1}
                    </ThemedText>
                  </View>
                  <View style={styles.stageContent}>
                    <ThemedText style={styles.stageTitle}>
                      {stage.stageTitle}
                    </ThemedText>
                    <ThemedText style={styles.stageTier}>
                      Tier {stage.orderSpec.targetTierRange[0]}-
                      {stage.orderSpec.targetTierRange[1]}
                    </ThemedText>
                    <View style={styles.stageTags}>
                      {getStageTags(stage).map((tag) => (
                        <TagChip
                          key={`${project.id}-${stage.stageIndex}-${tag.label}`}
                          tag={tag}
                        />
                      ))}
                      {deadlineEnabled ? (
                        <View style={styles.deadlineChip}>
                          <Feather
                            name="clock"
                            size={11}
                            color={GameColors.ui.danger}
                          />
                          <ThemedText style={styles.deadlineText}>
                            {stage.deadline?.installsRemaining} installs
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText style={styles.sectionTitle}>Completion bonus</ThemedText>
          <View style={styles.rewardRow}>
            <View style={styles.rewardChip}>
              <Feather
                name="dollar-sign"
                size={12}
                color={GameColors.currency.cash}
              />
              <ThemedText style={styles.rewardText}>
                x{completionRewards.cash.toFixed(1)} cash
              </ThemedText>
            </View>
            <View style={styles.rewardChip}>
              <Feather
                name="star"
                size={12}
                color={GameColors.currency.reputation}
              />
              <ThemedText style={styles.rewardText}>
                x{completionRewards.reputation.toFixed(1)} rep
              </ThemedText>
            </View>
            <View style={styles.rewardChip}>
              <Feather
                name="zap"
                size={12}
                color={GameColors.currency.research}
              />
              <ThemedText style={styles.rewardText}>
                x{completionRewards.research.toFixed(1)} research
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText style={styles.sectionTitle}>Trophy</ThemedText>
          <View style={styles.trophyRow}>
            <View style={styles.trophyFrame}>
              {trophyImage ? (
                <Image
                  source={trophyImage}
                  style={styles.trophyImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  priority="normal"
                />
              ) : (
                <Feather
                  name="award"
                  size={20}
                  color={GameColors.text.secondary}
                />
              )}
            </View>
            <View style={styles.trophyTextBlock}>
              <ThemedText style={styles.trophyTitle}>
                {project.trophyName ?? "Project Trophy"}
              </ThemedText>
              <ThemedText style={styles.trophySubtitle}>
                {completed
                  ? completionAt
                    ? `Unlocked ${new Date(completionAt).toLocaleDateString()}`
                    : "Unlocked"
                  : "Complete the project to earn this trophy."}
              </ThemedText>
            </View>
          </View>
        </View>

        {canOpenBoard ? (
          <Pressable
            style={styles.ctaButton}
            onPress={() => onOpenBoard?.(project.id, boardTab)}
          >
            <Feather name="flag" size={14} color={GameColors.ui.primary} />
            <ThemedText style={styles.ctaText}>{boardCtaLabel}</ThemedText>
          </Pressable>
        ) : activeProject ? (
          <Pressable style={styles.ctaButton} onPress={onClose}>
            <Feather name="flag" size={14} color={GameColors.ui.primary} />
            <ThemedText style={styles.ctaText}>Back to project</ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  heroCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    overflow: "hidden",
    width: "100%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
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
  heroOverlay: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(10, 12, 24, 0.72)",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: GameColors.text.primary,
  },
  heroSubtitle: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  metaText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  sectionBlock: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  headline: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  body: {
    fontSize: 13,
    color: GameColors.text.secondary,
    lineHeight: 18,
  },
  termRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  termChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  termText: {
    fontSize: 11,
    color: GameColors.text.secondary,
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
  stageList: {
    gap: Spacing.sm,
  },
  stageRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  stageRowActive: {
    borderColor: `${GameColors.ui.primary}70`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  stageRowComplete: {
    borderColor: `${GameColors.ui.success}70`,
    backgroundColor: `${GameColors.ui.success}12`,
  },
  stageIndexBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A2E",
  },
  stageIndexText: {
    fontSize: 12,
    color: GameColors.text.primary,
    fontWeight: "700",
  },
  stageContent: {
    flex: 1,
    gap: 4,
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  stageTier: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  stageTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: "600",
  },
  deadlineChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.ui.danger}55`,
    backgroundColor: `${GameColors.ui.danger}12`,
  },
  deadlineText: {
    fontSize: 10,
    fontWeight: "600",
    color: GameColors.ui.danger,
  },
  rewardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  rewardText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  trophyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  trophyFrame: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#121225",
    alignItems: "center",
    justifyContent: "center",
  },
  trophyImage: {
    width: 46,
    height: 46,
  },
  trophyTextBlock: {
    flex: 1,
    gap: 4,
  },
  trophyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  trophySubtitle: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  ctaButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}40`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.ui.primary,
  },
  missingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  missingText: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
});
