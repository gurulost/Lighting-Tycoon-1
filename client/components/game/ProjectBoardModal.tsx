import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  ProjectDefinition,
  ProjectOffer,
  ProjectStageDefinition,
} from "@/types/game";
import {
  PROJECT_DEFINITIONS,
  PROJECT_DEFINITION_BY_ID,
} from "@/constants/projects";
import { getProjectTrophyImage } from "@/constants/projectAssets";
import {
  getProjectDepositCost,
  getProjectOfferRefreshCost,
} from "@/lib/projects";
import { getTuning } from "@/lib/tuning";
import {
  getCouncilPerkEffects,
  getCouncilHearingPenalty,
  getCouncilUnlockInfo,
} from "@/lib/council";

type TabKey = "offers" | "active" | "trophies";

type AddonSelection = {
  permitExpeditor?: boolean;
  siteLogistics?: boolean;
  overtimeCrew?: boolean;
};

type StageTag = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
};

const TONE_META: Record<
  ProjectDefinition["client"]["tone"],
  { icon: keyof typeof Feather.glyphMap; color: string }
> = {
  warm: { icon: "heart", color: GameColors.characters.tina },
  demanding: { icon: "alert-circle", color: GameColors.ui.warning },
  visionary: { icon: "aperture", color: GameColors.currency.research },
  skeptical: { icon: "shield", color: GameColors.text.secondary },
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
      label: "Compat",
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

function AddonToggle({
  label,
  description,
  cost,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  description: string;
  cost: number;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.addonCard,
        selected && styles.addonCardSelected,
        disabled && styles.addonCardDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
    >
      <View style={styles.addonHeader}>
        <ThemedText style={styles.addonTitle}>{label}</ThemedText>
        <View style={styles.addonCost}>
          <Feather
            name="dollar-sign"
            size={12}
            color={GameColors.currency.cash}
          />
          <ThemedText style={styles.addonCostText}>{cost}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.addonDescription}>{description}</ThemedText>
    </Pressable>
  );
}

function ProjectOfferCard({
  project,
  depositCost,
  addonSelection,
  onToggleAddon,
  onAccept,
  disableAccept,
  totalCost,
  canAfford,
  onViewDossier,
  isNew,
  isFocused,
}: {
  project: ProjectDefinition;
  depositCost: number;
  addonSelection: AddonSelection;
  onToggleAddon: (key: keyof AddonSelection) => void;
  onAccept: () => void;
  disableAccept: boolean;
  totalCost: number;
  canAfford: boolean;
  onViewDossier?: () => void;
  isNew?: boolean;
  isFocused?: boolean;
}) {
  const tone = TONE_META[project.client.tone];
  const tuning = getTuning();
  const stageDeadlineEnabled =
    tuning.projects.deadlineEnabled &&
    (project.stages[0]?.deadline?.type === "installs" ||
      typeof tuning.projects.deadlineInstallsByStage[0] === "number");

  return (
    <LinearGradient
      colors={[`${tone.color}20`, "#1A1A2E", "#1A1A2E"]}
      style={[styles.offerCard, isFocused && styles.offerCardFocused]}
    >
      <View style={styles.offerHeader}>
        <View style={styles.offerTitleRow}>
          <View style={[styles.offerIcon, { borderColor: `${tone.color}70` }]}>
            <Feather name={tone.icon} size={16} color={tone.color} />
          </View>
          <View style={styles.offerTitleText}>
            <ThemedText style={styles.offerTitle} numberOfLines={1}>
              {project.title}
            </ThemedText>
            <ThemedText style={styles.offerMeta} numberOfLines={1}>
              {project.client.name} · {project.client.role}
            </ThemedText>
          </View>
        </View>
        <View style={styles.offerHeaderRight}>
          {isNew ? (
            <View style={styles.newChip}>
              <Feather name="star" size={11} color={GameColors.ui.warning} />
              <ThemedText style={styles.newChipText}>New</ThemedText>
            </View>
          ) : null}
          <View style={styles.stageCountChip}>
            <Feather
              name="layers"
              size={12}
              color={GameColors.text.secondary}
            />
            <ThemedText style={styles.stageCountText}>
              {project.stages.length} stages
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedText style={styles.offerLocation}>
        {project.locationName}
      </ThemedText>
      <ThemedText style={styles.offerSynopsis}>{project.synopsis}</ThemedText>

      {onViewDossier ? (
        <Pressable style={styles.dossierButton} onPress={onViewDossier}>
          <Feather name="book" size={12} color={GameColors.ui.primary} />
          <ThemedText style={styles.dossierButtonText}>View dossier</ThemedText>
        </Pressable>
      ) : null}

      <View style={styles.offerCosts}>
        <View style={styles.costChip}>
          <Feather name="shield" size={12} color={GameColors.currency.cash} />
          <ThemedText style={styles.costChipText}>
            Deposit {depositCost}
          </ThemedText>
        </View>
        <View style={styles.costChip}>
          <Feather
            name="dollar-sign"
            size={12}
            color={GameColors.currency.cash}
          />
          <ThemedText style={styles.costChipText}>Total {totalCost}</ThemedText>
        </View>
      </View>

      <View style={styles.addonGrid}>
        <AddonToggle
          label="Permit Expeditor"
          description="+2 installs on the stage deadline."
          cost={tuning.projects.addonPermitExpeditorCost}
          selected={!!addonSelection.permitExpeditor}
          disabled={!stageDeadlineEnabled}
          onPress={() => onToggleAddon("permitExpeditor")}
        />
        <AddonToggle
          label="Site Logistics"
          description="+2 Open supplier charges."
          cost={tuning.projects.addonSiteLogisticsCost}
          selected={!!addonSelection.siteLogistics}
          disabled={false}
          onPress={() => onToggleAddon("siteLogistics")}
        />
        <AddonToggle
          label="Overtime Crew"
          description="+1 order slot for this project."
          cost={tuning.projects.addonOvertimeCrewCost}
          selected={!!addonSelection.overtimeCrew}
          disabled={false}
          onPress={() => onToggleAddon("overtimeCrew")}
        />
      </View>

      <Pressable
        style={[
          styles.acceptButton,
          (disableAccept || !canAfford) && styles.acceptButtonDisabled,
        ]}
        onPress={!disableAccept && canAfford ? onAccept : undefined}
      >
        <LinearGradient
          colors={[`${GameColors.ui.primary}30`, `${GameColors.ui.primary}18`]}
          style={styles.acceptButtonInner}
        >
          <Feather name="flag" size={16} color={GameColors.ui.primary} />
          <ThemedText style={styles.acceptButtonText}>
            {disableAccept ? "Active project in progress" : "Accept Contract"}
          </ThemedText>
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

export function ProjectBoardModal({
  onClose,
  onOpenDossier,
  focusProjectId,
  initialTab,
  openId = 0,
}: {
  onClose: () => void;
  onOpenDossier?: (projectId: string) => void;
  focusProjectId?: string | null;
  initialTab?: TabKey | null;
  openId?: number;
}) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGame();
  const tuning = getTuning();
  const councilPerks = getCouncilPerkEffects(state);
  const councilHearing = getCouncilHearingPenalty(state);
  const depositMultiplier =
    councilPerks.projectDepositMult * councilHearing.projectDepositMult;

  const resolveOpenTab = React.useCallback((): TabKey => {
    if (initialTab === "trophies") return "trophies";
    if (initialTab === "active") {
      return state.activeProject ? "active" : "offers";
    }
    if (initialTab === "offers") return "offers";
    return state.activeProject ? "active" : "offers";
  }, [initialTab, state.activeProject]);
  const [activeTab, setActiveTab] = React.useState<TabKey>(resolveOpenTab);
  const openIdRef = React.useRef(openId);
  const skipAutoTabRef = React.useRef(false);
  const [addonSelections, setAddonSelections] = React.useState<
    Record<string, AddonSelection>
  >({});

  React.useEffect(() => {
    if (openIdRef.current === openId) return;
    openIdRef.current = openId;
    setActiveTab(resolveOpenTab());
    skipAutoTabRef.current = true;
  }, [openId, resolveOpenTab]);

  React.useEffect(() => {
    if (skipAutoTabRef.current) {
      skipAutoTabRef.current = false;
      return;
    }
    setActiveTab(state.activeProject ? "active" : "offers");
  }, [state.activeProject]);

  React.useEffect(() => {
    if (
      state.projectsUnlocked &&
      !state.activeProject &&
      state.projectOffers.length === 0
    ) {
      dispatch({ type: "PROJECT_GENERATE_OFFERS" });
    }
  }, [
    state.projectsUnlocked,
    state.projectOffers.length,
    state.activeProject,
    dispatch,
  ]);

  React.useEffect(() => {
    const offerIds = new Set(
      state.projectOffers.map((offer) => offer.projectId),
    );
    setAddonSelections((prev) => {
      const next: Record<string, AddonSelection> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (offerIds.has(key)) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [state.projectOffers]);

  const offers = state.projectOffers
    .map((offer) => ({
      offer,
      project: PROJECT_DEFINITION_BY_ID.get(offer.projectId),
    }))
    .filter(
      (entry): entry is { offer: ProjectOffer; project: ProjectDefinition } =>
        Boolean(entry.project),
    );
  const focusOfferId =
    focusProjectId &&
    offers.some((entry) => entry.offer.projectId === focusProjectId)
      ? focusProjectId
      : null;
  const orderedOffers = focusOfferId
    ? [
        offers.find((entry) => entry.offer.projectId === focusOfferId)!,
        ...offers.filter((entry) => entry.offer.projectId !== focusOfferId),
      ]
    : offers;

  const activeProject = state.activeProject;
  const activeDefinition = activeProject
    ? PROJECT_DEFINITION_BY_ID.get(activeProject.projectId)
    : undefined;

  const activeStage = activeDefinition
    ? activeDefinition.stages[activeProject?.stageIndex ?? 0]
    : undefined;
  const completionScale = Math.max(
    0,
    tuning.projects.completionRewardMultiplier,
  );
  const effectiveCompletionRewards = activeDefinition
    ? {
        cash:
          activeDefinition.completionRewards.cashMultiplier * completionScale,
        reputation:
          activeDefinition.completionRewards.reputationMultiplier *
          completionScale,
        research:
          activeDefinition.completionRewards.researchMultiplier *
          completionScale,
      }
    : null;
  const completedStages = new Set(
    activeProject?.stageHistory.map((entry) => entry.stageIndex) ?? [],
  );

  const refreshCost = getProjectOfferRefreshCost(state.reputationTier);
  const canRefresh = state.cash >= refreshCost;

  const completedCount = state.projectsCompleted.length;
  const stageProgressLabel =
    activeDefinition && activeProject
      ? `Stage ${activeProject.stageIndex + 1}/${activeDefinition.stages.length}`
      : "No active project";
  const completedProjects = state.projectsCompleted
    .map((id) => PROJECT_DEFINITION_BY_ID.get(id))
    .filter((project): project is ProjectDefinition => Boolean(project));
  const trophyProjects = PROJECT_DEFINITIONS;
  const completedPerks = completedProjects
    .map((project) =>
      project.permanentPerk
        ? {
            name: project.permanentPerk,
            description: project.perkDescription,
          }
        : null,
    )
    .filter(Boolean) as { name: string; description?: string }[];
  const milestoneThresholds = [3, 6, 9];
  const nextMilestone = milestoneThresholds.find(
    (value) => completedCount < value,
  );
  const milestoneProgressLabel = nextMilestone
    ? `${completedCount}/${nextMilestone}`
    : "All milestones complete";

  const progressRate =
    activeDefinition && activeProject
      ? activeProject.stageIndex / activeDefinition.stages.length
      : 0;
  const cancelPenaltyRate = Math.min(
    1,
    tuning.projects.cancelPenaltyRate + progressRate * 0.2,
  );
  const cancelRefund =
    activeProject && activeProject.depositPaid > 0
      ? Math.max(
          0,
          Math.floor(activeProject.depositPaid * (1 - cancelPenaltyRate)),
        )
      : 0;

  const deadlineRemaining = activeProject?.stageDeadlineRemaining;
  const expeditorUsed =
    activeProject?.expeditorUsedStages?.includes(
      activeProject.stageIndex ?? 0,
    ) ?? false;
  const rerollUsed =
    activeProject?.rerolledStages?.includes(activeProject.stageIndex ?? 0) ??
    false;
  const canAffordExpeditor =
    state.cash >= tuning.projects.addonPermitExpeditorCost;
  const canAffordLogistics =
    state.cash >= tuning.projects.addonSiteLogisticsCost;
  const canAffordOvertime = state.cash >= tuning.projects.addonOvertimeCrewCost;
  const canAffordChangeOrder =
    state.cash >= tuning.projects.addonChangeOrderCost;
  const councilUnlockInfo = getCouncilUnlockInfo({
    council: state.council,
    projectsCompleted: state.projectsCompleted,
    reputationTier: state.reputationTier,
  });
  const councilUnlockMinProjects = councilUnlockInfo.minProjects;
  const councilUnlockMinRepTier = councilUnlockInfo.minRepTier;
  const councilCapstoneTitle = councilUnlockInfo.capstoneTitle;
  const councilCapstoneComplete = councilUnlockInfo.capstoneComplete;
  const councilProjectsProgress = councilUnlockInfo.projectsProgress;
  const councilRepProgress = councilUnlockInfo.repProgress;
  const showCouncilGate = state.projectsUnlocked;
  const councilGateCopy = councilUnlockInfo.copy;

  return (
    <ModalShell
      title="Project Board"
      subtitle="Empire Contracts for city-scale installs"
      icon="flag"
      iconColor={GameColors.ui.primary}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing["4xl"] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Feather name="award" size={14} color={GameColors.ui.success} />
            <ThemedText style={styles.statValue}>{completedCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Completed</ThemedText>
          </View>
          <View style={styles.statChip}>
            <Feather name="layers" size={14} color={GameColors.ui.primary} />
            <ThemedText style={styles.statValue}>
              {stageProgressLabel}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Active</ThemedText>
          </View>
        </View>

        <View style={styles.tabRow}>
          {(["offers", "active", "trophies"] as TabKey[]).map((tab) => {
            const selected = activeTab === tab;
            const label =
              tab === "offers"
                ? "Offers"
                : tab === "active"
                  ? "Active"
                  : "Trophies";
            const disabled = tab === "active" && !activeProject;
            return (
              <Pressable
                key={tab}
                style={[
                  styles.tabButton,
                  selected && styles.tabButtonActive,
                  disabled && styles.tabButtonDisabled,
                ]}
                onPress={disabled ? undefined : () => setActiveTab(tab)}
              >
                <ThemedText
                  style={[
                    styles.tabLabel,
                    selected && styles.tabLabelActive,
                    disabled && styles.tabLabelDisabled,
                  ]}
                >
                  {label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {showCouncilGate ? (
          <View style={styles.councilGateCard}>
            <View style={styles.councilGateHeader}>
              <View style={styles.councilGateTitleRow}>
                <Feather
                  name="award"
                  size={16}
                  color={GameColors.currency.research}
                />
                <ThemedText style={styles.councilGateTitle}>
                  Standards Council
                </ThemedText>
              </View>
              <View
                style={[
                  styles.councilGateStatus,
                  state.council.unlocked && styles.councilGateStatusUnlocked,
                ]}
              >
                <ThemedText style={styles.councilGateStatusText}>
                  {state.council.unlocked ? "Unlocked" : "Locked"}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.councilGateCopy}>
              {councilGateCopy}
            </ThemedText>
            {!state.council.unlocked ? (
              <View style={styles.councilGateProgress}>
                {councilUnlockMinProjects > 0 ? (
                  <View style={styles.councilGatePill}>
                    <Feather
                      name="layers"
                      size={12}
                      color={GameColors.ui.primary}
                    />
                    <ThemedText style={styles.councilGatePillText}>
                      Projects {councilProjectsProgress}/
                      {councilUnlockMinProjects}
                    </ThemedText>
                  </View>
                ) : null}
                {councilUnlockMinRepTier > 0 ? (
                  <View style={styles.councilGatePill}>
                    <Feather
                      name="trending-up"
                      size={12}
                      color={GameColors.currency.research}
                    />
                    <ThemedText style={styles.councilGatePillText}>
                      Rep Tier {councilRepProgress}/{councilUnlockMinRepTier}
                    </ThemedText>
                  </View>
                ) : null}
                {councilCapstoneTitle ? (
                  <View style={styles.councilGatePill}>
                    <Feather
                      name="flag"
                      size={12}
                      color={GameColors.ui.success}
                    />
                    <ThemedText style={styles.councilGatePillText}>
                      Capstone{" "}
                      {councilCapstoneComplete ? "Complete" : "Pending"}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {!state.projectsUnlocked ? (
          <View style={styles.lockedState}>
            <Feather name="lock" size={28} color={GameColors.text.disabled} />
            <ThemedText style={styles.lockedTitle}>
              Empire Contracts Locked
            </ThemedText>
            <ThemedText style={styles.lockedSubtitle}>
              Complete the Phase 2 goal order to unlock city-scale projects.
            </ThemedText>
          </View>
        ) : activeTab === "offers" ? (
          <View style={styles.offerSection}>
            <View style={styles.offerHeaderRow}>
              <ThemedText style={styles.sectionTitle}>
                Available offers
              </ThemedText>
              <Pressable
                style={[
                  styles.refreshButton,
                  !canRefresh && styles.refreshButtonDisabled,
                ]}
                onPress={
                  canRefresh
                    ? () => dispatch({ type: "PROJECT_REFRESH_OFFERS" })
                    : undefined
                }
              >
                <Feather
                  name="refresh-cw"
                  size={14}
                  color={GameColors.ui.primary}
                />
                <ThemedText style={styles.refreshLabel}>Refresh</ThemedText>
                <View style={styles.refreshCost}>
                  <Feather
                    name="dollar-sign"
                    size={12}
                    color={GameColors.currency.cash}
                  />
                  <ThemedText style={styles.refreshCostText}>
                    {refreshCost}
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            {orderedOffers.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather
                  name="flag"
                  size={28}
                  color={GameColors.text.disabled}
                />
                <ThemedText style={styles.emptyTitle}>No offers yet</ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Check back after your next install for new contracts.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.offerList}>
                {orderedOffers.map(({ offer, project }) => {
                  const depositCost = getProjectDepositCost(
                    project,
                    state.reputationTier,
                    state.maxTierCrafted,
                    depositMultiplier,
                  );
                  const selection = addonSelections[project.id] || {};
                  const addonCost =
                    (selection.permitExpeditor
                      ? tuning.projects.addonPermitExpeditorCost
                      : 0) +
                    (selection.siteLogistics
                      ? tuning.projects.addonSiteLogisticsCost
                      : 0) +
                    (selection.overtimeCrew
                      ? tuning.projects.addonOvertimeCrewCost
                      : 0);
                  const totalCost = depositCost + addonCost;
                  const canAfford = state.cash >= totalCost;
                  return (
                    <ProjectOfferCard
                      key={offer.projectId}
                      project={project}
                      depositCost={depositCost}
                      addonSelection={selection}
                      onToggleAddon={(key) =>
                        setAddonSelections((prev) => ({
                          ...prev,
                          [project.id]: {
                            ...(prev[project.id] ?? {}),
                            [key]: !prev[project.id]?.[key],
                          },
                        }))
                      }
                      onAccept={() =>
                        dispatch({
                          type: "PROJECT_ACCEPT",
                          projectId: project.id,
                          addons: selection,
                        })
                      }
                      disableAccept={!!state.activeProject}
                      totalCost={totalCost}
                      canAfford={canAfford}
                      isNew={!state.projectRevealSeen?.[project.id]}
                      isFocused={offer.projectId === focusOfferId}
                      onViewDossier={
                        onOpenDossier
                          ? () => onOpenDossier(project.id)
                          : undefined
                      }
                    />
                  );
                })}
              </View>
            )}

            <View style={styles.sectionBlock}>
              <ThemedText style={styles.sectionTitle}>
                Empire milestones
              </ThemedText>
              <View style={styles.milestoneRow}>
                {milestoneThresholds.map((threshold) => {
                  const achieved = completedCount >= threshold;
                  return (
                    <View
                      key={`milestone-${threshold}`}
                      style={[
                        styles.milestoneChip,
                        achieved && styles.milestoneChipActive,
                      ]}
                    >
                      <Feather
                        name={achieved ? "check-circle" : "circle"}
                        size={12}
                        color={
                          achieved
                            ? GameColors.ui.success
                            : GameColors.text.secondary
                        }
                      />
                      <ThemedText
                        style={[
                          styles.milestoneText,
                          achieved && styles.milestoneTextActive,
                        ]}
                      >
                        {threshold} projects · +1 slot
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
              {nextMilestone ? (
                <ThemedText style={styles.milestoneProgress}>
                  Next milestone: {milestoneProgressLabel}
                </ThemedText>
              ) : (
                <ThemedText style={styles.milestoneProgress}>
                  {milestoneProgressLabel}
                </ThemedText>
              )}
            </View>

            <View style={styles.sectionBlock}>
              <ThemedText style={styles.sectionTitle}>
                Perks unlocked
              </ThemedText>
              {completedPerks.length === 0 ? (
                <ThemedText style={styles.emptySubtitle}>
                  Finish your first project to unlock a legacy perk.
                </ThemedText>
              ) : (
                <View style={styles.perkList}>
                  {completedPerks.map((perk, index) => (
                    <View key={`${perk.name}-${index}`} style={styles.perkRow}>
                      <Feather
                        name="star"
                        size={12}
                        color={GameColors.currency.reputation}
                      />
                      <View style={styles.perkTextBlock}>
                        <ThemedText style={styles.perkText}>
                          {perk.name}
                        </ThemedText>
                        {perk.description ? (
                          <ThemedText style={styles.perkDescription}>
                            {perk.description}
                          </ThemedText>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : activeTab === "trophies" ? (
          <View style={styles.trophySection}>
            <View style={styles.trophyHeaderRow}>
              <ThemedText style={styles.sectionTitle}>
                Trophy cabinet
              </ThemedText>
              <View style={styles.trophyCountChip}>
                <Feather name="award" size={12} color={GameColors.ui.success} />
                <ThemedText style={styles.trophyCountText}>
                  {completedCount}/{trophyProjects.length}
                </ThemedText>
              </View>
            </View>

            <View style={styles.trophyGrid}>
              {trophyProjects.map((project) => {
                const unlocked = state.projectsCompleted.includes(project.id);
                const trophySource = getProjectTrophyImage(
                  project.trophyIcon,
                  "sm",
                );
                return (
                  <Pressable
                    key={`trophy-${project.id}`}
                    style={[
                      styles.trophyCard,
                      !unlocked && styles.trophyCardLocked,
                    ]}
                    onPress={
                      onOpenDossier
                        ? () => onOpenDossier(project.id)
                        : undefined
                    }
                  >
                    <View style={styles.trophyFrame}>
                      {trophySource ? (
                        <Image
                          source={trophySource}
                          style={[
                            styles.trophyImage,
                            !unlocked && styles.trophyImageLocked,
                          ]}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                          priority="normal"
                          transition={150}
                        />
                      ) : (
                        <Feather
                          name="award"
                          size={22}
                          color={GameColors.text.secondary}
                        />
                      )}
                      {!unlocked ? (
                        <View style={styles.trophyLock}>
                          <Feather
                            name="lock"
                            size={12}
                            color={GameColors.text.secondary}
                          />
                        </View>
                      ) : null}
                    </View>
                    <ThemedText
                      style={[
                        styles.trophyLabel,
                        !unlocked && styles.trophyLabelLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {project.trophyName ?? project.title}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.trophyHint}>
              <ThemedText style={styles.emptySubtitle}>
                Tap a trophy to view its project dossier and requirements.
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.activeSection}>
            {!activeDefinition || !activeProject ? (
              <View style={styles.emptyState}>
                <Feather
                  name="flag"
                  size={28}
                  color={GameColors.text.disabled}
                />
                <ThemedText style={styles.emptyTitle}>
                  No active project
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Accept an Empire Contract to begin.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.activeCardStack}>
                <LinearGradient
                  colors={["#1B263B", "#1A1A2E", "#1A1A2E"]}
                  style={styles.activeCard}
                >
                  <View style={styles.activeHeader}>
                    <View style={styles.activeHeaderLeft}>
                      <Feather
                        name="flag"
                        size={18}
                        color={GameColors.ui.primary}
                      />
                      <View>
                        <ThemedText style={styles.activeTitle}>
                          {activeDefinition.title}
                        </ThemedText>
                        <ThemedText style={styles.activeSubtitle}>
                          {activeDefinition.locationName}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.activeHeaderRight}>
                      {onOpenDossier ? (
                        <Pressable
                          style={styles.dossierChip}
                          onPress={() => onOpenDossier(activeDefinition.id)}
                        >
                          <Feather
                            name="book"
                            size={12}
                            color={GameColors.ui.primary}
                          />
                          <ThemedText style={styles.dossierChipText}>
                            Dossier
                          </ThemedText>
                        </Pressable>
                      ) : null}
                      <View style={styles.stageCountChip}>
                        <Feather
                          name="layers"
                          size={12}
                          color={GameColors.text.secondary}
                        />
                        <ThemedText style={styles.stageCountText}>
                          {stageProgressLabel}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.activeMetaRow}>
                    <Feather
                      name="user"
                      size={13}
                      color={GameColors.text.secondary}
                    />
                    <ThemedText style={styles.activeMetaText}>
                      {activeDefinition.client.name} ·{" "}
                      {activeDefinition.client.role}
                    </ThemedText>
                  </View>

                  <View style={styles.activeMetaRow}>
                    <Feather
                      name="dollar-sign"
                      size={13}
                      color={GameColors.currency.cash}
                    />
                    <ThemedText style={styles.activeMetaText}>
                      Deposit locked: {activeProject.depositPaid}
                    </ThemedText>
                  </View>

                  {typeof deadlineRemaining === "number" ? (
                    <View style={styles.activeMetaRow}>
                      <Feather
                        name="clock"
                        size={13}
                        color={GameColors.ui.danger}
                      />
                      <ThemedText style={styles.activeMetaText}>
                        Installs remaining: {Math.max(0, deadlineRemaining)}
                      </ThemedText>
                    </View>
                  ) : null}

                  <View style={styles.activePerksRow}>
                    {activeProject.siteLogisticsUsed ? (
                      <View style={styles.activePerkChip}>
                        <Feather
                          name="truck"
                          size={12}
                          color={GameColors.ui.success}
                        />
                        <ThemedText style={styles.activePerkText}>
                          Site logistics
                        </ThemedText>
                      </View>
                    ) : null}
                    {activeProject.overtimeCrew ? (
                      <View style={styles.activePerkChip}>
                        <Feather
                          name="clock"
                          size={12}
                          color={GameColors.ui.warning}
                        />
                        <ThemedText style={styles.activePerkText}>
                          Overtime crew
                        </ThemedText>
                      </View>
                    ) : null}
                    {activeProject.expeditorUsedStages?.includes(
                      activeProject.stageIndex,
                    ) ? (
                      <View style={styles.activePerkChip}>
                        <Feather
                          name="zap"
                          size={12}
                          color={GameColors.ui.primary}
                        />
                        <ThemedText style={styles.activePerkText}>
                          Permit expeditor
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>

                <View style={styles.sectionBlock}>
                  <ThemedText style={styles.sectionTitle}>
                    Stage plan
                  </ThemedText>
                  <View style={styles.stageList}>
                    {activeDefinition.stages.map((stage, index) => {
                      const isCurrent = index === activeProject.stageIndex;
                      const isComplete = completedStages.has(index);
                      return (
                        <View
                          key={`${stage.stageTitle}-${index}`}
                          style={[
                            styles.stageRow,
                            isComplete && styles.stageRowComplete,
                            isCurrent && styles.stageRowActive,
                          ]}
                        >
                          <View style={styles.stageIndexBubble}>
                            <ThemedText style={styles.stageIndexText}>
                              {isComplete ? "✓" : index + 1}
                            </ThemedText>
                          </View>
                          <View style={styles.stageContent}>
                            <ThemedText style={styles.stageTitle}>
                              {stage.stageTitle}
                            </ThemedText>
                            <View style={styles.stageTags}>
                              {getStageTags(stage).map((tag) => (
                                <TagChip
                                  key={`${tag.label}-${index}`}
                                  tag={tag}
                                />
                              ))}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.sectionBlock}>
                  <ThemedText style={styles.sectionTitle}>
                    Support options
                  </ThemedText>
                  <View style={styles.supportGrid}>
                    <AddonToggle
                      label="Permit Expeditor"
                      description="+2 installs on the deadline."
                      cost={tuning.projects.addonPermitExpeditorCost}
                      selected={false}
                      disabled={
                        expeditorUsed ||
                        typeof deadlineRemaining !== "number" ||
                        !canAffordExpeditor
                      }
                      onPress={() =>
                        dispatch({
                          type: "PROJECT_ADDON_PURCHASE",
                          addon: "permit_expeditor",
                        })
                      }
                    />
                    <AddonToggle
                      label="Site Logistics"
                      description="+2 Open supplier charges."
                      cost={tuning.projects.addonSiteLogisticsCost}
                      selected={!!activeProject.siteLogisticsUsed}
                      disabled={
                        !!activeProject.siteLogisticsUsed || !canAffordLogistics
                      }
                      onPress={() =>
                        dispatch({
                          type: "PROJECT_ADDON_PURCHASE",
                          addon: "site_logistics",
                        })
                      }
                    />
                    <AddonToggle
                      label="Overtime Crew"
                      description="+1 order slot for duration."
                      cost={tuning.projects.addonOvertimeCrewCost}
                      selected={!!activeProject.overtimeCrew}
                      disabled={
                        !!activeProject.overtimeCrew || !canAffordOvertime
                      }
                      onPress={() =>
                        dispatch({
                          type: "PROJECT_ADDON_PURCHASE",
                          addon: "overtime_crew",
                        })
                      }
                    />
                    <AddonToggle
                      label="Change Order"
                      description="Swap stage constraint once."
                      cost={tuning.projects.addonChangeOrderCost}
                      selected={false}
                      disabled={rerollUsed || !canAffordChangeOrder}
                      onPress={() => dispatch({ type: "PROJECT_CHANGE_ORDER" })}
                    />
                  </View>
                </View>

                {activeStage ? (
                  <View style={styles.sectionBlock}>
                    <ThemedText style={styles.sectionTitle}>
                      Completion bonus
                    </ThemedText>
                    <View style={styles.rewardRow}>
                      <View style={styles.rewardChip}>
                        <Feather
                          name="dollar-sign"
                          size={12}
                          color={GameColors.currency.cash}
                        />
                        <ThemedText style={styles.rewardText}>
                          x
                          {(
                            effectiveCompletionRewards?.cash ??
                            activeDefinition.completionRewards.cashMultiplier
                          ).toFixed(1)}{" "}
                          cash
                        </ThemedText>
                      </View>
                      <View style={styles.rewardChip}>
                        <Feather
                          name="star"
                          size={12}
                          color={GameColors.currency.reputation}
                        />
                        <ThemedText style={styles.rewardText}>
                          x
                          {(
                            effectiveCompletionRewards?.reputation ??
                            activeDefinition.completionRewards
                              .reputationMultiplier
                          ).toFixed(1)}{" "}
                          rep
                        </ThemedText>
                      </View>
                      <View style={styles.rewardChip}>
                        <Feather
                          name="zap"
                          size={12}
                          color={GameColors.currency.research}
                        />
                        <ThemedText style={styles.rewardText}>
                          x
                          {(
                            effectiveCompletionRewards?.research ??
                            activeDefinition.completionRewards
                              .researchMultiplier
                          ).toFixed(1)}{" "}
                          research
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ) : null}

                <Pressable
                  style={styles.cancelButton}
                  onPress={() => dispatch({ type: "PROJECT_CANCEL" })}
                >
                  <Feather name="x" size={14} color={GameColors.ui.danger} />
                  <ThemedText style={styles.cancelText}>
                    Cancel contract · Refund {cancelRefund}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  tabRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#161626",
    alignItems: "center",
  },
  tabButtonActive: {
    borderColor: `${GameColors.ui.primary}70`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  tabButtonDisabled: {
    opacity: 0.4,
  },
  tabLabel: {
    fontSize: 13,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: GameColors.ui.primary,
  },
  tabLabelDisabled: {
    color: GameColors.text.secondary,
  },
  councilGateCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#141424",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  councilGateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  councilGateTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  councilGateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  councilGateStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.text.disabled}50`,
    backgroundColor: `${GameColors.text.disabled}12`,
  },
  councilGateStatusUnlocked: {
    borderColor: `${GameColors.ui.success}60`,
    backgroundColor: `${GameColors.ui.success}18`,
  },
  councilGateStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.text.secondary,
  },
  councilGateCopy: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  councilGateProgress: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  councilGatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  councilGatePillText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  lockedState: {
    alignItems: "center",
    padding: Spacing["3xl"],
    gap: Spacing.sm,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  lockedSubtitle: {
    fontSize: 13,
    color: GameColors.text.secondary,
    textAlign: "center",
  },
  offerSection: {
    gap: Spacing.lg,
  },
  offerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}40`,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  refreshLabel: {
    fontSize: 12,
    color: GameColors.text.primary,
    fontWeight: "600",
  },
  refreshCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshCostText: {
    fontSize: 12,
    color: GameColors.currency.cash,
    fontWeight: "600",
  },
  offerList: {
    gap: Spacing.lg,
  },
  milestoneRow: {
    gap: Spacing.sm,
  },
  milestoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  milestoneChipActive: {
    borderColor: `${GameColors.ui.success}60`,
    backgroundColor: `${GameColors.ui.success}12`,
  },
  milestoneText: {
    fontSize: 11,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
  milestoneTextActive: {
    color: GameColors.ui.success,
  },
  milestoneProgress: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  offerCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  offerCardFocused: {
    borderColor: `${GameColors.ui.primary}70`,
    shadowColor: GameColors.ui.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  offerHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  offerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  offerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#1A1A2E",
  },
  offerTitleText: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  offerMeta: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  stageCountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  stageCountText: {
    fontSize: 11,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
  newChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.ui.warning}70`,
    backgroundColor: `${GameColors.ui.warning}18`,
  },
  newChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: GameColors.ui.warning,
  },
  offerLocation: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  offerSynopsis: {
    fontSize: 13,
    color: GameColors.text.primary,
  },
  dossierButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}40`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  dossierButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: GameColors.ui.primary,
  },
  offerCosts: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  costChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: "#151525",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  costChipText: {
    fontSize: 11,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
  addonGrid: {
    gap: Spacing.sm,
  },
  addonCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
    gap: 4,
  },
  addonCardSelected: {
    borderColor: `${GameColors.ui.primary}70`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  addonCardDisabled: {
    opacity: 0.5,
  },
  addonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addonTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  addonCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addonCostText: {
    fontSize: 11,
    color: GameColors.currency.cash,
    fontWeight: "600",
  },
  addonDescription: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  acceptButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}60`,
  },
  acceptButtonDisabled: {
    opacity: 0.5,
  },
  acceptButtonInner: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.ui.primary,
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing["2xl"],
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: GameColors.text.secondary,
    textAlign: "center",
  },
  perkList: {
    gap: Spacing.sm,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  perkTextBlock: {
    flex: 1,
    gap: 2,
  },
  perkText: {
    fontSize: 12,
    color: GameColors.text.primary,
  },
  perkDescription: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  activeSection: {
    gap: Spacing.lg,
  },
  activeCardStack: {
    gap: Spacing.lg,
  },
  activeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  activeHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dossierChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}40`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  dossierChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: GameColors.ui.primary,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  activeSubtitle: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  activeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  activeMetaText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  activePerksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  activePerkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  activePerkText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  sectionBlock: {
    gap: Spacing.sm,
  },
  stageList: {
    gap: Spacing.sm,
  },
  stageRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.sm,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A2E",
  },
  stageIndexText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.primary,
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
  stageTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  supportGrid: {
    gap: Spacing.sm,
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
  },
  rewardText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.danger}60`,
    backgroundColor: `${GameColors.ui.danger}12`,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.ui.danger,
  },
  trophySection: {
    gap: Spacing.lg,
  },
  trophyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trophyCountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.ui.success}50`,
    backgroundColor: `${GameColors.ui.success}12`,
  },
  trophyCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.ui.success,
  },
  trophyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  trophyCard: {
    width: "47%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#151525",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  trophyCardLocked: {
    opacity: 0.55,
  },
  trophyFrame: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#111120",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  trophyImage: {
    width: "86%",
    height: "86%",
  },
  trophyImageLocked: {
    opacity: 0.4,
  },
  trophyLock: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  trophyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  trophyLabelLocked: {
    color: GameColors.text.secondary,
  },
  trophyHint: {
    alignItems: "center",
  },
});
