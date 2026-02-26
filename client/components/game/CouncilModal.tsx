import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  type DimensionValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  COUNCIL_CAMPAIGNS,
  COUNCIL_CAMPAIGN_BY_ID,
  CouncilCampaignDefinition,
  CouncilObjectiveDef,
} from "@/constants/councilCampaigns";
import { COUNCIL_PERKS } from "@/constants/councilPerks";
import { COUNCIL_HEARING_BY_ID } from "@/constants/councilHearings";
import { getCouncilHearingPenalty, getCouncilPerkEffects } from "@/lib/council";
import { canStartLegacyCycle, getDoctrineSlotCap } from "@/lib/legacy";
import { getTuning } from "@/lib/tuning";
import type { CouncilCampaignStatus } from "@/types/game";

interface CouncilModalProps {
  onClose: () => void;
  onOpenLegacyCycle?: () => void;
  onOpenOrders?: () => void;
  entryHint?: "hearing_play" | "hearing_lobby" | null;
}

type StatusMeta = {
  label: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
};

const STATUS_META: Record<
  "LOCKED" | "AVAILABLE" | CouncilCampaignStatus,
  StatusMeta
> = {
  LOCKED: {
    label: "Locked",
    color: GameColors.text.disabled,
    icon: "lock",
  },
  AVAILABLE: {
    label: "Available",
    color: GameColors.currency.reputation,
    icon: "unlock",
  },
  DRAFTING: {
    label: "Draft",
    color: GameColors.currency.cash,
    icon: "edit-3",
  },
  PILOT: {
    label: "Pilot",
    color: GameColors.ui.primary,
    icon: "activity",
  },
  RATIFY: {
    label: "Ratify",
    color: GameColors.currency.research,
    icon: "award",
  },
  COMPLETED: {
    label: "Complete",
    color: GameColors.ui.success,
    icon: "check-circle",
  },
};

function getCampaignStatusMeta(
  status: CouncilCampaignStatus,
  canStart: boolean,
): StatusMeta {
  if (status === "LOCKED" && canStart) {
    return STATUS_META.AVAILABLE;
  }
  return STATUS_META[status];
}

function LobbyPressureMeter({
  value,
  thresholds,
}: {
  value: number;
  thresholds: number[];
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const progress = clamped / 100;

  return (
    <View style={styles.pressureMeterWrapper}>
      <View style={styles.pressureMeterHeader}>
        <ThemedText style={styles.pressureMeterLabel}>
          Lobby Pressure
        </ThemedText>
        <ThemedText style={styles.pressureMeterValue}>{clamped}</ThemedText>
      </View>
      <View style={styles.pressureMeterTrack}>
        <LinearGradient
          colors={["#34D399", "#FBBF24", "#FF6B6B"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.pressureMeterFill, { width: `${progress * 100}%` }]}
        />
        {thresholds.map((threshold) => {
          const left =
            `${Math.min(100, Math.max(0, threshold))}%` as DimensionValue;
          return (
            <View key={threshold} style={[styles.pressureTick, { left }]}>
              <View style={styles.pressureTickLine} />
              <ThemedText style={styles.pressureTickLabel}>
                {threshold}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ProgressBar({ value, color }: { value: number; color?: string }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: color ?? GameColors.currency.cash,
          },
        ]}
      />
    </View>
  );
}

function ObjectiveRow({
  objective,
  progress,
}: {
  objective: CouncilObjectiveDef;
  progress: number;
}) {
  const completed = progress >= objective.target;
  return (
    <View style={styles.objectiveRow}>
      <View
        style={[styles.objectiveIcon, completed && styles.objectiveIconDone]}
      >
        <Feather
          name={completed ? "check" : "circle"}
          size={12}
          color={completed ? GameColors.ui.success : GameColors.text.secondary}
        />
      </View>
      <View style={styles.objectiveTextGroup}>
        <ThemedText style={styles.objectiveLabel}>{objective.label}</ThemedText>
        <ThemedText style={styles.objectiveProgress}>
          {Math.min(progress, objective.target)} / {objective.target}
        </ThemedText>
      </View>
    </View>
  );
}

function CampaignCard({
  campaign,
  status,
  canStart,
  isSelected,
  onPress,
  progressSummary,
}: {
  campaign: CouncilCampaignDefinition;
  status: CouncilCampaignStatus;
  canStart: boolean;
  isSelected: boolean;
  onPress: () => void;
  progressSummary: string;
}) {
  const statusMeta = getCampaignStatusMeta(status, canStart);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.campaignCard, isSelected && styles.campaignCardSelected]}
    >
      <View style={styles.campaignCardHeader}>
        <View style={styles.campaignCardTitleBlock}>
          <ThemedText style={styles.campaignCardTitle}>
            {campaign.title}
          </ThemedText>
          <ThemedText style={styles.campaignCardTagline}>
            {campaign.tagline}
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusChip,
            {
              borderColor: `${statusMeta.color}55`,
              backgroundColor: `${statusMeta.color}15`,
            },
          ]}
        >
          <Feather name={statusMeta.icon} size={12} color={statusMeta.color} />
          <ThemedText
            style={[styles.statusChipText, { color: statusMeta.color }]}
          >
            {statusMeta.label}
          </ThemedText>
        </View>
      </View>
      <View style={styles.campaignCardFooter}>
        <View style={styles.campaignCardProgress}>
          <Feather
            name="activity"
            size={12}
            color={GameColors.text.secondary}
          />
          <ThemedText style={styles.campaignCardProgressText}>
            {progressSummary}
          </ThemedText>
        </View>
        <Feather
          name={isSelected ? "chevron-up" : "chevron-down"}
          size={16}
          color={GameColors.text.secondary}
        />
      </View>
    </Pressable>
  );
}

export function CouncilModal({
  onClose,
  onOpenLegacyCycle,
  onOpenOrders,
  entryHint = null,
}: CouncilModalProps) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGame();
  const tuning = getTuning();
  const perks = getCouncilPerkEffects(state);
  const hearingPenalty = getCouncilHearingPenalty(state);
  const activeHearing = state.council.activeHearing
    ? COUNCIL_HEARING_BY_ID[state.council.activeHearing.hearingId]
    : undefined;
  const hearingPayCash = activeHearing
    ? Math.round(
        activeHearing.payToClear.cash *
          tuning.council.payToClearCostMultiplier *
          perks.hearingPayToClearCostMult,
      )
    : 0;
  const hearingPayResearch = activeHearing
    ? Math.round(
        activeHearing.payToClear.research *
          tuning.council.payToClearCostMultiplier *
          perks.hearingPayToClearCostMult,
      )
    : 0;
  const canPayHearing =
    !activeHearing ||
    (state.cash >= hearingPayCash && state.research >= hearingPayResearch);

  const campaignList = React.useMemo(
    () => [...COUNCIL_CAMPAIGNS].sort((a, b) => a.sortIndex - b.sortIndex),
    [],
  );
  const allCampaignsCompleted = campaignList.every((campaign) => {
    const progress = state.council.campaigns[campaign.id];
    return progress?.status === "COMPLETED";
  });
  const legacyDoctrineSlots = getDoctrineSlotCap(state.legacy.cyclesCompleted);
  const legacySetupReady = canStartLegacyCycle(state);
  const canOpenLegacySetup = !!onOpenLegacyCycle && legacySetupReady;
  const legacyDisplayCycle = state.legacy.pendingCycleStart
    ? Math.max(1, state.legacy.cyclesCompleted + 1)
    : Math.max(1, state.legacy.currentCycle || 1);

  const canStartCampaign = React.useCallback(
    (campaign: CouncilCampaignDefinition) => {
      if (!state.council.unlocked) return false;
      if (typeof campaign.unlock.minRepTier === "number") {
        if (state.reputationTier < campaign.unlock.minRepTier) return false;
      }
      if (typeof campaign.unlock.minProjectsCompleted === "number") {
        if (
          state.projectsCompleted.length < campaign.unlock.minProjectsCompleted
        ) {
          return false;
        }
      }
      if (typeof campaign.unlock.minCampaignsCompleted === "number") {
        const completedCount = Object.values(state.council.campaigns).filter(
          (progress) => progress.status === "COMPLETED",
        ).length;
        if (completedCount < campaign.unlock.minCampaignsCompleted) {
          return false;
        }
      }
      if (campaign.unlock.requiredProjectIds?.length) {
        const missingProject = campaign.unlock.requiredProjectIds.some(
          (id) => !state.projectsCompleted.includes(id),
        );
        if (missingProject) return false;
      }
      if (campaign.unlock.requiredCampaignIds?.length) {
        const missingCampaign = campaign.unlock.requiredCampaignIds.some(
          (id) => {
            const progress = state.council.campaigns[id];
            return !progress || progress.status !== "COMPLETED";
          },
        );
        if (missingCampaign) return false;
      }
      return true;
    },
    [
      state.council.unlocked,
      state.council.campaigns,
      state.reputationTier,
      state.projectsCompleted,
    ],
  );

  const getDefaultCampaignId = React.useCallback(() => {
    if (state.council.activeCampaignId) return state.council.activeCampaignId;
    const firstEligible = campaignList.find((campaign) => {
      const progress = state.council.campaigns[campaign.id];
      if (!progress || progress.status === "COMPLETED") return false;
      return canStartCampaign(campaign);
    });
    if (firstEligible) return firstEligible.id;
    const firstUnlocked = campaignList.find((campaign) => {
      const progress = state.council.campaigns[campaign.id];
      return progress && progress.status !== "LOCKED";
    });
    return firstUnlocked?.id ?? campaignList[0]?.id;
  }, [
    campaignList,
    canStartCampaign,
    state.council.activeCampaignId,
    state.council.campaigns,
  ]);

  const [selectedCampaignId, setSelectedCampaignId] = React.useState<
    string | undefined
  >(() => getDefaultCampaignId());

  React.useEffect(() => {
    if (!selectedCampaignId || !COUNCIL_CAMPAIGN_BY_ID[selectedCampaignId]) {
      setSelectedCampaignId(getDefaultCampaignId());
    }
  }, [
    getDefaultCampaignId,
    selectedCampaignId,
    campaignList,
    state.council.activeCampaignId,
    state.council.campaigns,
    state.council.unlocked,
    state.reputationTier,
    state.projectsCompleted,
  ]);

  const selectedCampaign = selectedCampaignId
    ? COUNCIL_CAMPAIGN_BY_ID[selectedCampaignId]
    : undefined;

  const selectedProgress = selectedCampaign
    ? state.council.campaigns[selectedCampaign.id]
    : undefined;

  const thresholdShift = perks.lobbyPressureThresholdShift ?? 0;
  const thresholds = (tuning.council.hearingThresholds || [])
    .map((value) => value + thresholdShift)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  const municipalGrantAvailable = perks.unlockMunicipalGrants;
  const municipalGrantCash = Math.max(
    0,
    Math.round(tuning.council.municipalGrantCashCost ?? 0),
  );
  const municipalGrantResearch = Math.max(
    0,
    Math.round(tuning.council.municipalGrantResearchCost ?? 0),
  );
  const municipalGrantDrop = Math.max(
    0,
    Math.round(tuning.council.municipalGrantLobbyPressureDrop ?? 0),
  );
  const municipalGrantBaronDrop = Math.max(
    0,
    Math.round(tuning.council.municipalGrantBaronPressureDrop ?? 0),
  );
  const canUseMunicipalGrant =
    municipalGrantAvailable &&
    state.cash >= municipalGrantCash &&
    state.research >= municipalGrantResearch &&
    (municipalGrantDrop > 0 || municipalGrantBaronDrop > 0);

  const getCampaignUnlocks = (campaign: CouncilCampaignDefinition) => {
    const unlocks: string[] = [];
    if (typeof campaign.unlock.minRepTier === "number") {
      unlocks.push(`Requires Rep Tier ${campaign.unlock.minRepTier}`);
    }
    if (typeof campaign.unlock.minProjectsCompleted === "number") {
      unlocks.push(
        `Complete ${campaign.unlock.minProjectsCompleted} Empire Contracts`,
      );
    }
    if (typeof campaign.unlock.minCampaignsCompleted === "number") {
      unlocks.push(
        `Complete ${campaign.unlock.minCampaignsCompleted} Council campaigns`,
      );
    }
    if (campaign.unlock.requiredProjectIds?.length) {
      unlocks.push("Finish required Mega-Projects");
    }
    if (campaign.unlock.requiredCampaignIds?.length) {
      unlocks.push("Complete prerequisite Council campaigns");
    }
    return unlocks;
  };

  const formatPenaltyList = () => {
    if (!activeHearing) return [] as string[];
    const penalties: string[] = [];
    const disallowRefresh = activeHearing.constraints?.disallowRefresh;
    if (hearingPenalty.globalRewardMult.cash < 1) {
      penalties.push(
        `Cash rewards -${Math.round((1 - hearingPenalty.globalRewardMult.cash) * 100)}%`,
      );
    }
    if (hearingPenalty.globalRewardMult.reputation < 1) {
      penalties.push(
        `Reputation rewards -${Math.round(
          (1 - hearingPenalty.globalRewardMult.reputation) * 100,
        )}%`,
      );
    }
    if (hearingPenalty.globalRewardMult.research < 1) {
      penalties.push(
        `Research rewards -${Math.round(
          (1 - hearingPenalty.globalRewardMult.research) * 100,
        )}%`,
      );
    }
    if (hearingPenalty.refreshCostMult > 1) {
      penalties.push(
        `Order refresh +${Math.round((hearingPenalty.refreshCostMult - 1) * 100)}%`,
      );
    }
    if (hearingPenalty.projectDepositMult > 1) {
      penalties.push(
        `Project deposits +${Math.round((hearingPenalty.projectDepositMult - 1) * 100)}%`,
      );
    }
    if (hearingPenalty.ecoAuditResearchBonusMult < 1) {
      penalties.push(
        `Eco-audit research -${Math.round(
          (1 - hearingPenalty.ecoAuditResearchBonusMult) * 100,
        )}%`,
      );
    }
    if (hearingPenalty.compatOrderWeightMult > 1.05) {
      penalties.push("Compatibility orders appear more often");
    }
    if (hearingPenalty.rushRewardMult.cash < 1) {
      penalties.push(
        `Rush rewards -${Math.round(
          (1 - hearingPenalty.rushRewardMult.cash) * 100,
        )}%`,
      );
    }
    if (disallowRefresh) {
      penalties.push("No refreshes allowed while the hearing is active");
    }
    if (!penalties.length) {
      penalties.push("Minor scrutiny slows rewards until resolved");
    }
    return penalties;
  };

  const hearingPenaltyList = formatPenaltyList();

  const getProgressSummary = (campaign: CouncilCampaignDefinition) => {
    const progress = state.council.campaigns[campaign.id];
    if (!progress) return "No data";
    if (progress.status === "COMPLETED") return "Perk unlocked";
    if (progress.status === "RATIFY") return "Council showcase ready";
    if (progress.status === "PILOT") {
      const completeCount = campaign.pilotObjectives.reduce((sum, obj) => {
        const value = progress.pilotObjectiveProgress[obj.id] ?? 0;
        return sum + (value >= obj.target ? 1 : 0);
      }, 0);
      return `${completeCount}/${campaign.pilotObjectives.length} objectives`;
    }
    if (progress.status === "DRAFTING") return "Draft in progress";
    return "Awaiting draft";
  };

  const renderSelectedCampaign = () => {
    if (!selectedCampaign || !selectedProgress) {
      return (
        <View style={styles.emptyPanel}>
          <ThemedText style={styles.emptyPanelText}>
            Select a campaign to view details.
          </ThemedText>
        </View>
      );
    }

    const canStart = canStartCampaign(selectedCampaign);
    const statusMeta = getCampaignStatusMeta(selectedProgress.status, canStart);

    const cashCost = Math.max(
      0,
      Math.round(
        selectedCampaign.draftCost.cash *
          tuning.council.draftCostCashMultiplier,
      ),
    );
    const researchCost = Math.max(
      0,
      Math.round(
        selectedCampaign.draftCost.research *
          tuning.council.draftCostResearchMultiplier,
      ),
    );
    const cashRemaining = Math.max(
      0,
      cashCost - selectedProgress.draftCashInvested,
    );
    const researchRemaining = Math.max(
      0,
      researchCost - selectedProgress.draftResearchInvested,
    );
    const cashProgress =
      cashCost > 0 ? selectedProgress.draftCashInvested / cashCost : 1;
    const researchProgress =
      researchCost > 0
        ? selectedProgress.draftResearchInvested / researchCost
        : 1;
    const draftComplete = cashProgress >= 1 && researchProgress >= 1;

    const canInvest =
      canStart &&
      (selectedProgress.status === "LOCKED" ||
        selectedProgress.status === "DRAFTING") &&
      (state.cash > 0 || state.research > 0) &&
      (!selectedCampaign.draftCost.allowPartial
        ? state.cash >= cashRemaining && state.research >= researchRemaining
        : true);
    const cashShortfall = Math.max(0, cashRemaining - state.cash);
    const researchShortfall = Math.max(0, researchRemaining - state.research);
    const needsDraftResourceRecovery =
      canStart &&
      !canInvest &&
      (selectedProgress.status === "LOCKED" ||
        selectedProgress.status === "DRAFTING") &&
      (cashRemaining > 0 || researchRemaining > 0);
    const canSetActive = selectedProgress.status !== "LOCKED" || canStart;
    const showCampaignActivationCoachmark =
      state.gamePhase >= 3 &&
      !state.phase3Onboarding.campaignSelectedSeen &&
      canSetActive &&
      state.council.activeCampaignId !== selectedCampaign.id;

    const perk = COUNCIL_PERKS[selectedCampaign.perkId];

    const storyText = (() => {
      switch (selectedProgress.status) {
        case "LOCKED":
        case "DRAFTING":
          return selectedCampaign.story.intro;
        case "PILOT":
          return selectedCampaign.story.draftComplete;
        case "RATIFY":
          return selectedCampaign.story.pilotComplete;
        case "COMPLETED":
          return selectedCampaign.story.ratifyComplete;
        default:
          return selectedCampaign.story.intro;
      }
    })();

    const ratifyOrderExists = state.orders.some((order) =>
      order.modifierIds?.includes(`council:${selectedCampaign.id}`),
    );

    const canSpawnRatify =
      selectedProgress.status === "RATIFY" && !ratifyOrderExists;

    return (
      <View style={styles.detailPanel}>
        <View style={styles.detailHeader}>
          <View style={styles.detailTitleRow}>
            <ThemedText style={styles.detailTitle}>
              {selectedCampaign.title}
            </ThemedText>
            <View
              style={[
                styles.statusChip,
                {
                  borderColor: `${statusMeta.color}55`,
                  backgroundColor: `${statusMeta.color}15`,
                },
              ]}
            >
              <Feather
                name={statusMeta.icon}
                size={12}
                color={statusMeta.color}
              />
              <ThemedText
                style={[styles.statusChipText, { color: statusMeta.color }]}
              >
                {statusMeta.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.detailTagline}>
            {selectedCampaign.tagline}
          </ThemedText>
        </View>

        <View style={styles.storyPanel}>
          <Feather
            name="message-circle"
            size={14}
            color={GameColors.text.secondary}
          />
          <ThemedText style={styles.storyText}>{storyText}</ThemedText>
        </View>

        {selectedProgress.status === "LOCKED" && !canStart ? (
          <View style={styles.unlockPanel}>
            <ThemedText style={styles.sectionTitle}>
              Unlock Requirements
            </ThemedText>
            {getCampaignUnlocks(selectedCampaign).map((item) => (
              <View key={item} style={styles.unlockRow}>
                <Feather
                  name="lock"
                  size={12}
                  color={GameColors.text.secondary}
                />
                <ThemedText style={styles.unlockText}>{item}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        {(selectedProgress.status === "DRAFTING" ||
          (selectedProgress.status === "LOCKED" && canStart)) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Draft</ThemedText>
              {draftComplete ? (
                <View style={styles.sectionBadge}>
                  <Feather
                    name="check"
                    size={12}
                    color={GameColors.ui.success}
                  />
                  <ThemedText style={styles.sectionBadgeText}>
                    Complete
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <View style={styles.costRow}>
              <View style={styles.costBlock}>
                <ThemedText style={styles.costLabel}>Cash</ThemedText>
                <ThemedText style={styles.costValue}>
                  {selectedProgress.draftCashInvested} / {cashCost}
                </ThemedText>
                <ProgressBar
                  value={cashProgress}
                  color={GameColors.currency.cash}
                />
              </View>
              <View style={styles.costBlock}>
                <ThemedText style={styles.costLabel}>Research</ThemedText>
                <ThemedText style={styles.costValue}>
                  {selectedProgress.draftResearchInvested} / {researchCost}
                </ThemedText>
                <ProgressBar
                  value={researchProgress}
                  color={GameColors.currency.research}
                />
              </View>
            </View>
            <Pressable
              style={[
                styles.primaryButton,
                !canInvest && styles.buttonDisabled,
              ]}
              onPress={
                canInvest
                  ? () =>
                      dispatch({
                        type: "COUNCIL_INVEST_DRAFT",
                        campaignId: selectedCampaign.id,
                      })
                  : undefined
              }
              testID="council-invest-draft"
            >
              <Feather
                name="edit-3"
                size={14}
                color={GameColors.text.primary}
              />
              <ThemedText style={styles.primaryButtonText}>
                Invest in Draft
              </ThemedText>
            </Pressable>
            {needsDraftResourceRecovery ? (
              <View style={styles.draftRecoveryWrap}>
                <ThemedText style={styles.draftRecoveryText}>
                  {selectedCampaign.draftCost.allowPartial
                    ? `Remaining ${cashRemaining} cash • ${researchRemaining} research. Build resources from Orders to keep draft momentum.`
                    : `Shortfall ${cashShortfall} cash • ${researchShortfall} research. Finish installs to fund draft requirements.`}
                </ThemedText>
                {onOpenOrders ? (
                  <Pressable
                    style={styles.draftRecoveryButton}
                    onPress={onOpenOrders}
                  >
                    <Feather
                      name="inbox"
                      size={13}
                      color={GameColors.ui.primary}
                    />
                    <ThemedText style={styles.draftRecoveryButtonText}>
                      Open Orders
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        )}

        {selectedProgress.status === "PILOT" && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                Pilot Objectives
              </ThemedText>
              <View style={styles.sectionBadge}>
                <Feather
                  name="activity"
                  size={12}
                  color={GameColors.ui.primary}
                />
                <ThemedText style={styles.sectionBadgeText}>Active</ThemedText>
              </View>
            </View>
            {selectedCampaign.pilotObjectives.map((objective) => (
              <ObjectiveRow
                key={objective.id}
                objective={objective}
                progress={
                  selectedProgress.pilotObjectiveProgress[objective.id] ?? 0
                }
              />
            ))}
          </View>
        )}

        {selectedProgress.status === "RATIFY" && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Ratify</ThemedText>
              <View style={styles.sectionBadge}>
                <Feather
                  name="award"
                  size={12}
                  color={GameColors.currency.research}
                />
                <ThemedText style={styles.sectionBadgeText}>
                  Showcase
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.ratifyText}>
              Council Showcase order is ready. Complete it to ratify the
              standard and unlock the perk.
            </ThemedText>
            <View style={styles.ratifyTags}>
              <View style={styles.ratifyTag}>
                <Feather
                  name="layers"
                  size={12}
                  color={GameColors.text.secondary}
                />
                <ThemedText style={styles.ratifyTagText}>
                  Tier {selectedCampaign.ratifyOrder.tierMin}-
                  {selectedCampaign.ratifyOrder.tierMax}
                </ThemedText>
              </View>
              {selectedCampaign.ratifyOrder.requiresOpenOnly ? (
                <View style={styles.ratifyTag}>
                  <Feather
                    name="sun"
                    size={12}
                    color={GameColors.openStandard.primary}
                  />
                  <ThemedText style={styles.ratifyTagText}>
                    Open-only
                  </ThemedText>
                </View>
              ) : null}
              {selectedCampaign.ratifyOrder.requiresCompatibility ? (
                <View style={styles.ratifyTag}>
                  <Feather
                    name="shield"
                    size={12}
                    color={GameColors.ui.success}
                  />
                  <ThemedText style={styles.ratifyTagText}>
                    Compatibility
                  </ThemedText>
                </View>
              ) : null}
              {selectedCampaign.ratifyOrder.requiresEcoAudit ? (
                <View style={styles.ratifyTag}>
                  <Feather
                    name="wind"
                    size={12}
                    color={GameColors.currency.research}
                  />
                  <ThemedText style={styles.ratifyTagText}>
                    Eco Audit
                  </ThemedText>
                </View>
              ) : null}
              {selectedCampaign.ratifyOrder.requiresRush ? (
                <View style={styles.ratifyTag}>
                  <Feather
                    name="clock"
                    size={12}
                    color={GameColors.ui.danger}
                  />
                  <ThemedText style={styles.ratifyTagText}>Rush</ThemedText>
                </View>
              ) : null}
            </View>
            {ratifyOrderExists ? (
              <View style={styles.noticeRow}>
                <Feather
                  name="check-circle"
                  size={14}
                  color={GameColors.ui.success}
                />
                <ThemedText style={styles.noticeText}>
                  Council showcase order is active in your Orders list.
                </ThemedText>
              </View>
            ) : (
              <Pressable
                style={[
                  styles.primaryButton,
                  !canSpawnRatify && styles.buttonDisabled,
                ]}
                onPress={
                  canSpawnRatify
                    ? () =>
                        dispatch({
                          type: "COUNCIL_SPAWN_RATIFY",
                          campaignId: selectedCampaign.id,
                        })
                    : undefined
                }
              >
                <Feather
                  name="send"
                  size={14}
                  color={GameColors.text.primary}
                />
                <ThemedText style={styles.primaryButtonText}>
                  Spawn Council Showcase
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {selectedProgress.status === "COMPLETED" ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                Campaign Complete
              </ThemedText>
              <View style={styles.sectionBadge}>
                <Feather name="check" size={12} color={GameColors.ui.success} />
                <ThemedText style={styles.sectionBadgeText}>
                  Perk Active
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.completedText}>
              Standard ratified. This campaign perk stays active for this run.
            </ThemedText>
          </View>
        ) : null}

        {perk ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Perk</ThemedText>
            </View>
            <View style={styles.perkRow}>
              <Feather
                name="star"
                size={14}
                color={GameColors.currency.research}
              />
              <View style={styles.perkTextGroup}>
                <ThemedText style={styles.perkTitle}>{perk.title}</ThemedText>
                <ThemedText style={styles.perkDescription}>
                  {perk.description}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        {state.council.activeCampaignId !== selectedCampaign.id ? (
          <View style={styles.setActiveWrap}>
            {showCampaignActivationCoachmark ? (
              <View style={styles.setActiveCoachmark}>
                <Feather
                  name="target"
                  size={12}
                  color={GameColors.ui.primary}
                />
                <ThemedText style={styles.setActiveCoachmarkText}>
                  Start here: set this as your active campaign.
                </ThemedText>
              </View>
            ) : null}
            <Pressable
              style={[
                styles.secondaryButton,
                !canSetActive && styles.buttonDisabled,
              ]}
              onPress={
                canSetActive
                  ? () =>
                      dispatch({
                        type: "COUNCIL_SET_ACTIVE_CAMPAIGN",
                        campaignId: selectedCampaign.id,
                      })
                  : undefined
              }
              testID={`council-set-active-${selectedCampaign.id}`}
            >
              <Feather
                name="target"
                size={14}
                color={GameColors.text.primary}
              />
              <ThemedText style={styles.secondaryButtonText}>
                Set Active Campaign
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.noticeRow}>
            <Feather
              name="check-circle"
              size={14}
              color={GameColors.ui.success}
            />
            <ThemedText style={styles.noticeText}>
              Active campaign tracking progress.
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <ModalShell
      title="Standards Council"
      subtitle="Draft policies, run pilots, and ratify the standards"
      icon="award"
      iconColor={GameColors.currency.research}
      onClose={onClose}
      closeTestID="council-modal-close"
      testID="council-modal"
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Spacing["4xl"] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <ThemedText style={styles.introLead}>Mentor</ThemedText>
          <ThemedText style={styles.introText}>
            You didn&apos;t just win contracts - you changed minds. Now the
            Council is listening. Draft the standards, prove them in the field,
            and ratify the rules everyone will have to follow.
          </ThemedText>
          <ThemedText style={styles.introLead}>Tina</ThemedText>
          <ThemedText style={styles.introText}>
            We&apos;re not just building installs anymore. We&apos;re writing
            the rulebook. Every campaign we pass makes the open way the default,
            and the lobby has to keep up.
          </ThemedText>
        </View>

        {state.legacy.unlocked || allCampaignsCompleted ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                Legacy Standards
              </ThemedText>
              <View style={styles.sectionBadge}>
                <Feather
                  name={canOpenLegacySetup ? "zap" : "clock"}
                  size={12}
                  color={GameColors.currency.research}
                />
                <ThemedText style={styles.sectionBadgeText}>
                  Cycle {legacyDisplayCycle}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.legacyText}>
              {canOpenLegacySetup
                ? "Final accord ratified. Start a new cycle with a doctrine loadout and custom kit."
                : state.legacy.pendingCycleStart
                  ? "Legacy cycle is ready. Open setup to begin the next run."
                  : state.legacy.unlocked
                    ? "Finish the final Council campaign in this run to re-open the next legacy cycle."
                    : "Complete every Council campaign to unlock the first legacy cycle."}
            </ThemedText>
            <View style={styles.legacyMetaRow}>
              <ThemedText style={styles.legacyMetaLabel}>
                Doctrine points: {state.legacy.doctrinePoints}
              </ThemedText>
              <ThemedText style={styles.legacyMetaLabel}>
                Loadout slots: {legacyDoctrineSlots}
              </ThemedText>
              <ThemedText style={styles.legacyMetaLabel}>
                Cycles complete: {state.legacy.cyclesCompleted}
              </ThemedText>
            </View>
            {canOpenLegacySetup ? (
              <Pressable
                style={styles.primaryButton}
                onPress={onOpenLegacyCycle}
              >
                <Feather
                  name="rotate-ccw"
                  size={14}
                  color={GameColors.text.primary}
                />
                <ThemedText style={styles.primaryButtonText}>
                  Begin Legacy Cycle
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <LobbyPressureMeter
            value={state.council.lobbyPressure}
            thresholds={thresholds}
          />
          {municipalGrantAvailable ? (
            <Pressable
              style={[
                styles.primaryButton,
                !canUseMunicipalGrant && styles.buttonDisabled,
              ]}
              onPress={
                canUseMunicipalGrant
                  ? () => dispatch({ type: "COUNCIL_USE_MUNICIPAL_GRANT" })
                  : undefined
              }
            >
              <Feather
                name="shield"
                size={14}
                color={GameColors.text.primary}
              />
              <ThemedText style={styles.primaryButtonText}>
                Municipal Grant (-{municipalGrantDrop} Pressure)
              </ThemedText>
              <View style={styles.buttonCostInline}>
                <Feather
                  name="dollar-sign"
                  size={12}
                  color={GameColors.currency.cash}
                />
                <ThemedText style={styles.buttonCostText}>
                  {municipalGrantCash}
                </ThemedText>
                {municipalGrantResearch > 0 ? (
                  <>
                    <Feather
                      name="zap"
                      size={12}
                      color={GameColors.currency.research}
                    />
                    <ThemedText style={styles.buttonCostText}>
                      {municipalGrantResearch}
                    </ThemedText>
                  </>
                ) : null}
              </View>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sectionCard} testID="council-hearing-section">
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Hearings</ThemedText>
            <View style={styles.sectionBadge}>
              <Feather
                name={activeHearing ? "alert-triangle" : "check"}
                size={12}
                color={
                  activeHearing ? GameColors.ui.warning : GameColors.ui.success
                }
              />
              <ThemedText style={styles.sectionBadgeText}>
                {activeHearing ? "Active" : "Clear"}
              </ThemedText>
            </View>
          </View>
          {entryHint ? (
            <View
              style={styles.hearingEntryHintCard}
              testID="council-hearing-entry-hint"
            >
              <Feather
                name={entryHint === "hearing_lobby" ? "credit-card" : "list"}
                size={13}
                color={GameColors.currency.research}
              />
              <ThemedText style={styles.hearingEntryHintText}>
                {entryHint === "hearing_lobby"
                  ? "Lobby Back is in this Hearings panel. Pay costs to clear penalties instantly."
                  : "Clear by play from this Hearings panel: complete listed objectives to remove penalties."}
              </ThemedText>
            </View>
          ) : null}
          {activeHearing ? (
            <View>
              <ThemedText style={styles.hearingTitle}>
                {activeHearing.title}
              </ThemedText>
              <ThemedText style={styles.hearingDescription}>
                {activeHearing.description}
              </ThemedText>
              {hearingPenaltyList.length > 0 ? (
                <View style={styles.hearingPenaltyList}>
                  {hearingPenaltyList.map((penalty) => (
                    <View key={penalty} style={styles.hearingPenaltyRow}>
                      <Feather
                        name="alert-circle"
                        size={12}
                        color={GameColors.ui.warning}
                      />
                      <ThemedText style={styles.hearingPenaltyText}>
                        {penalty}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.hearingObjectives}>
                {activeHearing.clearObjectives.map((objective) => {
                  const remaining =
                    state.council.activeHearing?.remainingObjectives[
                      objective.id
                    ] ?? objective.target;
                  const progress = Math.max(0, objective.target - remaining);
                  return (
                    <ObjectiveRow
                      key={objective.id}
                      objective={objective}
                      progress={progress}
                    />
                  );
                })}
              </View>

              <Pressable
                style={[
                  styles.secondaryButton,
                  !canPayHearing && styles.buttonDisabled,
                ]}
                onPress={
                  canPayHearing
                    ? () => dispatch({ type: "COUNCIL_PAY_CLEAR_HEARING" })
                    : undefined
                }
                testID="council-hearing-lobby-back"
              >
                <Feather
                  name="credit-card"
                  size={14}
                  color={GameColors.text.primary}
                />
                <ThemedText style={styles.secondaryButtonText}>
                  Lobby Back
                </ThemedText>
                <View style={styles.buttonCostInline}>
                  <Feather
                    name="dollar-sign"
                    size={12}
                    color={GameColors.currency.cash}
                  />
                  <ThemedText style={styles.buttonCostText}>
                    {hearingPayCash}
                  </ThemedText>
                  {hearingPayResearch > 0 ? (
                    <>
                      <Feather
                        name="zap"
                        size={12}
                        color={GameColors.currency.research}
                      />
                      <ThemedText style={styles.buttonCostText}>
                        {hearingPayResearch}
                      </ThemedText>
                    </>
                  ) : null}
                </View>
              </Pressable>
            </View>
          ) : (
            <ThemedText style={styles.hearingDescription}>
              No hearings active. Keep drafting and piloting to build momentum.
            </ThemedText>
          )}
        </View>

        <View style={styles.sectionCard}>{renderSelectedCampaign()}</View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Campaigns</ThemedText>
          </View>
          {campaignList.map((campaign) => {
            const progress = state.council.campaigns[campaign.id];
            const status = progress?.status ?? "LOCKED";
            const canStart = canStartCampaign(campaign);
            return (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                status={status}
                canStart={canStart}
                isSelected={campaign.id === selectedCampaignId}
                progressSummary={getProgressSummary(campaign)}
                onPress={() => setSelectedCampaignId(campaign.id)}
              />
            );
          })}
        </View>
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  introCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#1C1C33",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: Spacing.sm,
  },
  introLead: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.currency.research,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  introText: {
    fontSize: 14,
    color: GameColors.text.primary,
    lineHeight: 20,
  },
  sectionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  sectionBadgeText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  pressureMeterWrapper: {
    gap: Spacing.sm,
  },
  pressureMeterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pressureMeterLabel: {
    fontSize: 14,
    color: GameColors.text.secondary,
  },
  pressureMeterValue: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  pressureMeterTrack: {
    position: "relative",
    height: 10,
    borderRadius: 8,
    backgroundColor: "#22223A",
    overflow: "hidden",
  },
  pressureMeterFill: {
    height: "100%",
    borderRadius: 8,
  },
  pressureTick: {
    position: "absolute",
    top: -18,
    alignItems: "center",
  },
  pressureTickLine: {
    width: 2,
    height: 16,
    backgroundColor: "#2A2A4A",
  },
  pressureTickLabel: {
    fontSize: 10,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: GameColors.currency.research,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: "#22223A",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  setActiveWrap: {
    gap: Spacing.xs,
  },
  setActiveCoachmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}55`,
    backgroundColor: `${GameColors.ui.primary}14`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  setActiveCoachmarkText: {
    fontSize: 12,
    color: GameColors.text.primary,
    lineHeight: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  buttonCostInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: Spacing.sm,
  },
  buttonCostText: {
    fontSize: 12,
    color: GameColors.text.primary,
  },
  hearingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: GameColors.text.primary,
    marginBottom: Spacing.xs,
  },
  hearingDescription: {
    fontSize: 13,
    color: GameColors.text.secondary,
    lineHeight: 18,
  },
  hearingEntryHintCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.currency.research}55`,
    backgroundColor: `${GameColors.currency.research}14`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  hearingEntryHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: GameColors.text.primary,
  },
  hearingPenaltyList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  hearingPenaltyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  hearingPenaltyText: {
    fontSize: 12,
    color: GameColors.text.primary,
  },
  hearingObjectives: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  detailPanel: {
    gap: Spacing.md,
  },
  detailHeader: {
    gap: Spacing.xs,
  },
  detailTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: GameColors.text.primary,
    flex: 1,
  },
  detailTagline: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  storyPanel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "#1B1B33",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  storyText: {
    fontSize: 13,
    color: GameColors.text.primary,
    lineHeight: 18,
    flex: 1,
  },
  unlockPanel: {
    gap: Spacing.xs,
  },
  unlockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  unlockText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  costRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  costBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  costLabel: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: "#22223A",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: GameColors.currency.cash,
  },
  draftRecoveryWrap: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  draftRecoveryText: {
    fontSize: 12,
    lineHeight: 17,
    color: GameColors.text.secondary,
  },
  draftRecoveryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}55`,
    backgroundColor: `${GameColors.ui.primary}14`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
  },
  draftRecoveryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.ui.primary,
  },
  objectiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  objectiveIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  objectiveIconDone: {
    borderColor: GameColors.ui.success,
  },
  objectiveTextGroup: {
    flex: 1,
  },
  objectiveLabel: {
    fontSize: 13,
    color: GameColors.text.primary,
  },
  objectiveProgress: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  ratifyText: {
    fontSize: 13,
    color: GameColors.text.secondary,
    lineHeight: 18,
  },
  ratifyTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  ratifyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: "#1B1B33",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  ratifyTagText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  completedText: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  legacyText: {
    fontSize: 13,
    color: GameColors.text.secondary,
    lineHeight: 18,
  },
  legacyMetaRow: {
    gap: Spacing.xs,
  },
  legacyMetaLabel: {
    fontSize: 12,
    color: GameColors.text.primary,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  perkTextGroup: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  perkDescription: {
    fontSize: 12,
    color: GameColors.text.secondary,
    lineHeight: 18,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  noticeText: {
    fontSize: 12,
    color: GameColors.text.secondary,
    flex: 1,
  },
  emptyPanel: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  emptyPanelText: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  campaignCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1B1B33",
    marginBottom: Spacing.sm,
  },
  campaignCardSelected: {
    borderColor: GameColors.currency.research,
    backgroundColor: "#202044",
  },
  campaignCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  campaignCardTitleBlock: {
    flex: 1,
  },
  campaignCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  campaignCardTagline: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  campaignCardFooter: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  campaignCardProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  campaignCardProgressText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
