import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SectionList,
  SectionListData,
  ImageSourcePropType,
  TextInput,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

type GlossaryTier = "basics" | "core" | "advanced" | "endgame";
type GlossaryFilter = "all" | "pinned" | GlossaryTier;

interface GlossaryItem {
  id: string;
  title: string;
  summary: string;
  detail?: string;
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
  image?: ImageSourcePropType;
  isPortrait?: boolean;
  part?: { tier: PartTier; family: PartFamily };
}

interface GlossarySection {
  id: string;
  title: string;
  tier: GlossaryTier;
  items: GlossaryItem[];
}

type GlossaryRow = { type: "section"; section: GlossarySection };
type GlossarySectionHeader = { title: string; tier: GlossaryTier };
type GlossarySectionList = SectionListData<GlossaryRow, GlossarySectionHeader>;

const TIER_LABELS: Record<GlossaryTier, string> = {
  basics: "Basics",
  core: "Core Systems",
  advanced: "Advanced",
  endgame: "Endgame",
};

const TIER_ORDER: GlossaryTier[] = ["basics", "core", "advanced", "endgame"];
const SECTION_ORDER: Record<GlossaryTier, string[]> = {
  basics: [
    "start-here",
    "parts-open",
    "parts-locked",
    "parts-waste",
    "stations",
    "utilities",
    "letter-legend",
    "characters",
  ],
  core: [
    "suppliers",
    "currencies",
    "dependency",
    "orders-campaigns",
    "order-types",
    "baron-offers",
    "order-badges",
  ],
  advanced: ["merge-momentum", "boosts", "freedom-tech"],
  endgame: ["compliance", "projects"],
};
const getSectionSortIndex = (tier: GlossaryTier, id: string) => {
  const list = SECTION_ORDER[tier] ?? [];
  const index = list.indexOf(id);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};
const PIN_STORAGE_KEY = "lighting_tycoon_glossary_pins_v1";
const CONTROLS_COLLAPSE_KEY = "lighting_tycoon_glossary_controls_collapsed_v1";

const makePart = (tier: PartTier, family: PartFamily): Part => ({
  id: `glossary-${family}-${tier}`,
  tier,
  family,
  position: -1,
});

const GLOSSARY_SECTIONS: GlossarySection[] = [
  {
    id: "start-here",
    title: "Start Here: The Point of the Game",
    tier: "basics",
    items: [
      {
        id: "start-goal",
        title: "The Goal",
        summary: "Grow a lighting workshop and deliver installs.",
        detail:
          "Success looks like steady cash, higher-tier orders, and low Dependency and Baron pressure.",
        icon: "target",
        color: GameColors.ui.primary,
      },
      {
        id: "start-loop",
        title: "The Loop",
        summary: "Supply -> Merge -> Fulfill -> Upgrade.",
        detail:
          "Tap suppliers for parts, merge to tier up, fulfill orders, and reinvest in R&D.",
        icon: "repeat",
        color: GameColors.ui.primary,
      },
      {
        id: "start-story",
        title: "The Story",
        summary: "Locked speed vs open freedom.",
        detail:
          "The Baron tempts you with certified parts; open standards lead to liberation.",
        icon: "book-open",
        color: GameColors.ui.primary,
      },
    ],
  },
  {
    id: "parts-open",
    title: "Parts (Open Standard)",
    tier: "basics",
    items: [
      {
        id: "part-open-1",
        title: "Clip (Open)",
        summary: "Tier 1 open-standard part.",
        part: { tier: 1, family: "open" },
      },
      {
        id: "part-open-2",
        title: "Track (Open)",
        summary: "Tier 2 open-standard part.",
        part: { tier: 2, family: "open" },
      },
      {
        id: "part-open-3",
        title: "Segment (Open)",
        summary: "Tier 3 open-standard part.",
        part: { tier: 3, family: "open" },
      },
      {
        id: "part-open-4",
        title: "Smart Kit (Open)",
        summary: "Tier 4 open-standard part.",
        part: { tier: 4, family: "open" },
      },
      {
        id: "part-open-5",
        title: "Premium System (Open)",
        summary: "Tier 5 open-standard part.",
        part: { tier: 5, family: "open" },
      },
      {
        id: "part-open-6",
        title: "Routing Array (Open)",
        summary: "Tier 6 open-standard part.",
        part: { tier: 6, family: "open" },
      },
      {
        id: "part-open-7",
        title: "Network Spine (Open)",
        summary: "Tier 7 open-standard part.",
        part: { tier: 7, family: "open" },
      },
      {
        id: "part-open-8",
        title: "Control Stack (Open)",
        summary: "Tier 8 open-standard part.",
        part: { tier: 8, family: "open" },
      },
      {
        id: "part-open-9",
        title: "Signature Grid (Open)",
        summary: "Tier 9 open-standard part.",
        part: { tier: 9, family: "open" },
      },
      {
        id: "part-open-10",
        title: "Kingdom Install (Open)",
        summary: "Tier 10 open-standard part.",
        part: { tier: 10, family: "open" },
      },
    ],
  },
  {
    id: "parts-locked",
    title: "Parts (Locked Certified)",
    tier: "basics",
    items: [
      {
        id: "part-locked-1",
        title: "Clip (Locked)",
        summary: "Tier 1 certified locked part.",
        part: { tier: 1, family: "locked" },
      },
      {
        id: "part-locked-2",
        title: "Track (Locked)",
        summary: "Tier 2 certified locked part.",
        part: { tier: 2, family: "locked" },
      },
      {
        id: "part-locked-3",
        title: "Segment (Locked)",
        summary: "Tier 3 certified locked part.",
        part: { tier: 3, family: "locked" },
      },
      {
        id: "part-locked-4",
        title: "Smart Kit (Locked)",
        summary: "Tier 4 certified locked part.",
        part: { tier: 4, family: "locked" },
      },
      {
        id: "part-locked-5",
        title: "Premium System (Locked)",
        summary: "Tier 5 certified locked part.",
        part: { tier: 5, family: "locked" },
      },
      {
        id: "part-locked-6",
        title: "Routing Array (Locked)",
        summary: "Tier 6 certified locked part.",
        part: { tier: 6, family: "locked" },
      },
      {
        id: "part-locked-7",
        title: "Network Spine (Locked)",
        summary: "Tier 7 certified locked part.",
        part: { tier: 7, family: "locked" },
      },
      {
        id: "part-locked-8",
        title: "Control Stack (Locked)",
        summary: "Tier 8 certified locked part.",
        part: { tier: 8, family: "locked" },
      },
      {
        id: "part-locked-9",
        title: "Signature Grid (Locked)",
        summary: "Tier 9 certified locked part.",
        part: { tier: 9, family: "locked" },
      },
      {
        id: "part-locked-10",
        title: "Kingdom Install (Locked)",
        summary: "Tier 10 certified locked part.",
        part: { tier: 10, family: "locked" },
      },
    ],
  },
  {
    id: "parts-waste",
    title: "Waste & Salvage",
    tier: "basics",
    items: [
      {
        id: "waste-1",
        title: "Packaging Waste",
        summary: "W1 waste part.",
        detail:
          "Merge two to upgrade, or recycle for cash + a small Open Workshop cooldown cut + pressure relief.",
        part: { tier: 1, family: "waste" },
      },
      {
        id: "waste-2",
        title: "Cardboard Stack",
        summary: "W2 waste part.",
        detail:
          "Merge to W3 or recycle for a bigger cooldown cut and more pressure relief.",
        part: { tier: 2, family: "waste" },
      },
      {
        id: "waste-3",
        title: "Salvage Bale",
        summary: "W3 waste part.",
        detail:
          "Recycle to grant an Open Workshop charge plus the largest pressure relief.",
        part: { tier: 3, family: "waste" },
      },
    ],
  },
  {
    id: "stations",
    title: "Stations",
    tier: "basics",
    items: [
      {
        id: "station-workbench",
        title: "Workbench",
        summary: "Open suppliers.",
        detail:
          "Each source has charges and cooldowns. After the tutorial, you can overdraw during cooldowns at a cost.",
        image: stationWorkbench,
      },
      {
        id: "station-orders",
        title: "Order Inbox",
        summary: "View and fulfill orders.",
        detail: "Completing orders pays cash, reputation, and research.",
        image: stationInbox,
      },
      {
        id: "station-rd",
        title: "R&D Bench",
        summary: "Unlock Open Workshop and Freedom tech.",
        detail: "Costs research and upgrade materials.",
        image: stationRd,
      },
    ],
  },
  {
    id: "suppliers",
    title: "Suppliers",
    tier: "core",
    items: [
      {
        id: "supplier-baron",
        title: "Baron Supply Depot",
        summary: "Fast locked supply.",
        detail:
          "Raises Dependency; shipments can include waste. Overdraws cost cash and can add extra waste.",
        icon: "package",
        color: GameColors.locked.primary,
      },
      {
        id: "supplier-open",
        title: "Open Workshop",
        summary: "Open-standard supply.",
        detail:
          "Unlocked via R&D; scales with upgrades; can drop materials and compatibility components. Overdraws cost research.",
        icon: "tool",
        color: GameColors.openStandard.primary,
      },
      {
        id: "supplier-salvage",
        title: "Salvage Corner",
        summary: "Refurb supply source.",
        detail:
          "Drops open parts, waste, or upgrade materials. Overdraws consume waste or cost cash if you're out.",
        icon: "refresh-cw",
        color: GameColors.ui.warning,
      },
    ],
  },
  {
    id: "characters",
    title: "Characters",
    tier: "basics",
    items: [
      {
        id: "character-tina",
        title: "Tina",
        summary: "Owner of the Glow Workshop.",
        detail: "Leads the shop and drives the push for open standards.",
        image: tinaPortrait,
        isPortrait: true,
      },
      {
        id: "character-mentor",
        title: "Mentor",
        summary: "Retired installer who teaches the craft.",
        detail: "Provides guidance and boosts to help you break free.",
        image: mentorPortrait,
        isPortrait: true,
      },
      {
        id: "character-baron",
        title: "Bulb Baron",
        summary: "Corporate supplier with strict terms.",
        detail: "Tempting locked offers that increase Dependency and pressure.",
        image: baronPortrait,
        isPortrait: true,
      },
    ],
  },
  {
    id: "utilities",
    title: "Utilities",
    tier: "basics",
    items: [
      {
        id: "utility-backpack",
        title: "Backpack",
        summary: "Temporary storage slots.",
        detail: "Drag items in and out.",
        icon: "archive",
        color: GameColors.ui.primary,
      },
      {
        id: "utility-recycle",
        title: "Recycle Bin",
        summary: "Recycle parts for cash and research.",
        detail:
          "Recycling waste can cut Open Workshop cooldowns, add charges, and reduce Baron pressure.",
        icon: "trash-2",
        color: GameColors.ui.danger,
      },
    ],
  },
  {
    id: "orders-campaigns",
    title: "Orders & Campaigns",
    tier: "core",
    items: [
      {
        id: "orders-refresh",
        title: "Order Refresh",
        summary: "Replace one order for cash.",
        detail: "Cost scales with reputation.",
        icon: "refresh-cw",
        color: GameColors.ui.primary,
      },
      {
        id: "orders-marketing",
        title: "Marketing Campaign",
        summary: "Boost higher-tier orders for a short run.",
        detail: "Stacks up to a cap.",
        icon: "trending-up",
        color: GameColors.currency.reputation,
      },
    ],
  },
  {
    id: "order-types",
    title: "Order Types",
    tier: "core",
    items: [
      {
        id: "order-type-standard",
        title: "Standard Orders",
        summary: "Regular installs with tier requirements.",
        detail: "Any family allowed unless noted.",
        icon: "file-text",
        color: GameColors.ui.primary,
      },
      {
        id: "order-type-certified",
        title: "Certified Orders",
        summary: "Locked parts preferred or required.",
        detail: "Usually higher cash but adds Dependency pressure.",
        icon: "lock",
        color: GameColors.locked.primary,
      },
      {
        id: "order-type-compat",
        title: "Compatibility Orders",
        summary: "Require compatible open parts.",
        detail: "Unlocked after Freedom tech is available.",
        icon: "shield",
        color: GameColors.ui.success,
      },
      {
        id: "order-type-style",
        title: "Style Match",
        summary: "All parts must be one family.",
        detail: "Open-only or locked-only.",
        icon: "layers",
        color: GameColors.ui.primary,
      },
      {
        id: "order-type-rush",
        title: "Rush Orders",
        summary: "Timed bonus orders.",
        detail: "Finish sooner for extra cash; no hard fail.",
        icon: "clock",
        color: GameColors.ui.danger,
      },
      {
        id: "order-type-lab",
        title: "Lab Requests",
        summary: "Audit lab jobs during crackdowns.",
        detail: "Open-only and research-heavy rewards.",
        icon: "zap",
        color: GameColors.currency.research,
      },
    ],
  },
  {
    id: "baron-offers",
    title: "Baron Offers",
    tier: "core",
    items: [
      {
        id: "baron-offer-crate",
        title: "Certified Crate",
        summary: "Instant locked parts plus a payout.",
        detail: "Adds Dependency and tilts spawns toward locked parts.",
        icon: "package",
        color: GameColors.locked.primary,
      },
      {
        id: "baron-offer-contract",
        title: "Territory Contract",
        summary: "Boosts cash for the next orders.",
        detail: "Each completion nudges Dependency; locked spawns lean in.",
        icon: "trending-up",
        color: GameColors.locked.primary,
      },
      {
        id: "baron-offer-rush",
        title: "Emergency Rush Kit",
        summary: "Instant locked kit with rush spawns.",
        detail: "Adds Dependency and tilts spawns locked.",
        icon: "zap",
        color: GameColors.locked.primary,
      },
    ],
  },
  {
    id: "boosts",
    title: "Tactical Boosts",
    tier: "advanced",
    items: [
      {
        id: "boost-scout",
        title: "Supplier Scout",
        summary: "Force the next supplier spawns.",
        detail: "Choose Open, Locked (adds Baron pressure), or +1 tier.",
        icon: "compass",
        color: GameColors.ui.primary,
      },
      {
        id: "boost-clinic",
        title: "Mentor Workshop Clinic",
        summary: "Boost the next open merges.",
        detail: "Grants extra research and reduces Dependency.",
        icon: "activity",
        color: GameColors.currency.research,
      },
      {
        id: "boost-warranty",
        title: "Baron Warranty Stamp",
        summary: "Modify order payouts.",
        detail: "Reduce wrong-family penalties or boost Baron contract cash.",
        icon: "shield",
        color: GameColors.currency.cash,
      },
    ],
  },
  {
    id: "merge-momentum",
    title: "Merge Momentum",
    tier: "advanced",
    items: [
      {
        id: "merge-chain",
        title: "Merge Chain",
        summary: "Chain merges quickly to trigger Momentum.",
        detail: "Hits x3/x6/x10 thresholds.",
        icon: "link",
        color: GameColors.ui.primary,
      },
      {
        id: "merge-refill",
        title: "Refill Charge",
        summary: "+1 supplier charge.",
        detail: "Targets Open Workshop or Baron Depot if Open is locked.",
        icon: "battery-charging",
        color: GameColors.openStandard.primary,
      },
      {
        id: "merge-cooldown",
        title: "Cooldown Cut",
        summary: "Reduce an active supplier cooldown.",
        detail: "30/45/60% based on chain level.",
        icon: "clock",
        color: GameColors.ui.primary,
      },
      {
        id: "merge-quality",
        title: "Quality Boost",
        summary: "Next drop has a tier floor.",
        detail: "Tier 2/3/4 based on chain level.",
        icon: "trending-up",
        color: GameColors.ui.success,
      },
    ],
  },
  {
    id: "freedom-tech",
    title: "Freedom Tech",
    tier: "advanced",
    items: [
      {
        id: "freedom-controller",
        title: "Freedom Controller",
        summary: "R&D tool that liberates locked parts.",
        detail:
          "Converts locked to compatible open parts and reduces Dependency.",
        image: freedomControllerImage,
      },
      {
        id: "compatible-parts",
        title: "Compatible Parts",
        summary: "Open parts marked with C.",
        detail:
          "Used for compatibility orders; some locked orders accept them.",
        icon: "shield",
        color: GameColors.ui.success,
      },
      {
        id: "compatibility-orders",
        title: "Compatibility Orders",
        summary: "Orders that require compatible open parts.",
        detail: "Unlocked after Freedom tech is available.",
        icon: "check-circle",
        color: GameColors.ui.success,
      },
    ],
  },
  {
    id: "currencies",
    title: "Currencies & Materials",
    tier: "core",
    items: [
      {
        id: "currency-cash",
        title: "Cash",
        summary: "Spend on upgrades and boosts.",
        detail: "Earn from orders and recycling.",
        icon: "dollar-sign",
        color: GameColors.currency.cash,
      },
      {
        id: "currency-rep",
        title: "Reputation",
        summary: "Unlocks neighborhoods and better orders.",
        detail: "Earned from orders.",
        icon: "star",
        color: GameColors.currency.reputation,
      },
      {
        id: "currency-research",
        title: "Research",
        summary: "Unlocks R&D nodes and Freedom Controller.",
        detail: "Earned from orders and open merges.",
        icon: "zap",
        color: GameColors.currency.research,
      },
      {
        id: "currency-materials",
        title: "Upgrade Materials",
        summary: "Used for Open Workshop tiers.",
        detail: "Drops from Salvage and Open Workshop bonus rolls.",
        icon: "clipboard",
        color: GameColors.ui.primary,
      },
      {
        id: "currency-compat",
        title: "Compatibility Components",
        summary: "Used for Open Workshop IV/V upgrades.",
        detail: "Rare Open Workshop bonus drop.",
        icon: "shield",
        color: GameColors.ui.success,
      },
    ],
  },
  {
    id: "dependency",
    title: "Dependency",
    tier: "core",
    items: [
      {
        id: "dependency-meter",
        title: "Dependency Meter",
        summary: "Tracks reliance on locked supply.",
        detail:
          "Locked work raises it; open-only orders can reduce it. At 20, Compliance Audit triggers.",
        icon: "activity",
        color: GameColors.ui.warning,
      },
      {
        id: "baron-pressure",
        title: "Baron Pressure",
        summary: "Visible attention meter.",
        detail:
          "Builds from locked scout and overflow; 40+ cuts Phase 2 cash+research 10%, 70+ cuts 20%. Open-only installs and waste recycling relieve it.",
        icon: "alert-circle",
        color: GameColors.ui.warning,
      },
    ],
  },
  {
    id: "compliance",
    title: "Compliance & Liberation",
    tier: "endgame",
    items: [
      {
        id: "compliance-audit",
        title: "Compliance Audit",
        summary: "Crackdown triggered at Dependency 20.",
        detail: "A compliance order appears and must be resolved.",
        icon: "alert-triangle",
        color: GameColors.ui.danger,
      },
      {
        id: "audit-paths",
        title: "Audit Choices",
        summary: "Choose how to resolve the audit.",
        detail:
          "Take Baron help for fast compliance or complete lab requests and craft Freedom Controller.",
        icon: "compass",
        color: GameColors.locked.primary,
      },
      {
        id: "phase-two",
        title: "Phase 2",
        summary: "Liberation phase after Freedom.",
        detail:
          "Dependency resets and harder orders arrive; Baron pressure can cut payouts.",
        icon: "flag",
        color: GameColors.ui.primary,
      },
    ],
  },
  {
    id: "projects",
    title: "Empire Contracts",
    tier: "endgame",
    items: [
      {
        id: "projects-board",
        title: "Project Board",
        summary: "Multi-stage city-scale contracts.",
        detail:
          "Unlocked after the Phase 2 goal order. Accept a contract, pay a large deposit, and complete protected stages.",
        icon: "flag",
        color: GameColors.ui.primary,
      },
      {
        id: "projects-deadlines",
        title: "Action Deadlines",
        summary: "Complete stages within X installs.",
        detail:
          "Deadlines count down with each non-project fulfillment. Use Permit Expeditor to add installs.",
        icon: "clock",
        color: GameColors.ui.danger,
      },
      {
        id: "projects-addons",
        title: "Project Add-ons",
        summary: "Pay for logistics support.",
        detail:
          "Site Logistics adds Open supplier charges; Overtime Crew adds an order slot; Change Order rerolls constraints.",
        icon: "truck",
        color: GameColors.ui.success,
      },
    ],
  },
  {
    id: "letter-legend",
    title: "Letters + Badges",
    tier: "basics",
    items: [
      {
        id: "legend-order-letters",
        title: "Order Letters (CL/TR/SG/KT/PR/AR/SP/ST/GR/KI)",
        summary: "Tier code legend for order hints.",
        detail:
          "CL=Clip, TR=Track, SG=Segment, KT=Kit, PR=System, AR=Array, SP=Spine, ST=Stack, GR=Grid, KI=Kingdom.",
        icon: "type",
        color: GameColors.ui.primary,
      },
      {
        id: "legend-tile-badges",
        title: "Tile Badges (O/L/W/C)",
        summary: "Tile family indicators.",
        detail:
          "O=open-standard, L=locked, W=waste (W1/W2/W3), C=compatible open part.",
        icon: "tag",
        color: GameColors.text.secondary,
      },
    ],
  },
  {
    id: "order-badges",
    title: "Order Badges",
    tier: "core",
    items: [
      {
        id: "badge-certified",
        title: "Certified",
        summary: "Locked preferred or required.",
        detail: "Often higher payouts with locked parts.",
        icon: "lock",
        color: GameColors.locked.primary,
      },
      {
        id: "badge-compatible",
        title: "Compatible",
        summary: "Requires compatible open parts.",
        detail: "Parts must be marked with C.",
        icon: "shield",
        color: GameColors.ui.success,
      },
      {
        id: "badge-mentor",
        title: "Mentor Job",
        summary: "Mentor-guided training order.",
        detail: "Usually tied to story or tutorial beats.",
        icon: "compass",
        color: GameColors.openStandard.primary,
      },
      {
        id: "badge-baron-contract",
        title: "Baron Contract",
        summary: "Contract order pays extra cash.",
        detail: "Raises Dependency.",
        icon: "briefcase",
        color: GameColors.locked.primary,
      },
      {
        id: "badge-story",
        title: "Story",
        summary: "Narrative order tied to story beats.",
        detail: "Completing it advances the narrative.",
        icon: "book-open",
        color: GameColors.ui.primary,
      },
      {
        id: "badge-rush",
        title: "Rush",
        summary: "Bonus decays over time.",
        detail: "No hard fail.",
        icon: "clock",
        color: GameColors.ui.danger,
      },
      {
        id: "badge-style",
        title: "Style Match",
        summary: "All Open only or Locked only.",
        detail: "No mixing families.",
        icon: "layers",
        color: GameColors.ui.primary,
      },
      {
        id: "badge-preference",
        title: "Preference",
        summary: "Prefers Open or Locked.",
        detail: "Wrong family reduces payout.",
        icon: "heart",
        color: GameColors.currency.reputation,
      },
      {
        id: "badge-exact",
        title: "Exact Tiers",
        summary: "Exact tier required.",
        detail: "No substitutions allowed.",
        icon: "check-circle",
        color: GameColors.text.secondary,
      },
      {
        id: "badge-eco",
        title: "Eco Audit",
        summary: "Open kits grant bonus research.",
        detail: "Bonus applies only if no locked parts are used.",
        icon: "feather",
        color: GameColors.currency.research,
      },
      {
        id: "badge-lockout",
        title: "Lockout",
        summary: "Compliance Audit order.",
        detail: "Locked or compatible kits only.",
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
  const { height: windowHeight } = useWindowDimensions();
  const isCompactHeight = windowHeight < 720;
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<GlossaryFilter>("all");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [controlsCollapsed, setControlsCollapsed] = useState(true);
  const [collapseLoaded, setCollapseLoaded] = useState(false);
  const listRef = useRef<SectionList<GlossaryRow, GlossarySectionHeader>>(null);

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(PIN_STORAGE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const validIds = new Set(
              GLOSSARY_SECTIONS.flatMap((section) =>
                section.items.map((item) => item.id),
              ),
            );
            const filtered = parsed.filter(
              (id) => typeof id === "string" && validIds.has(id),
            );
            setPinnedIds(filtered);
          }
        }
        setPinsLoaded(true);
      })
      .catch(() => {
        if (mounted) setPinsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(CONTROLS_COLLAPSE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw === "true" || raw === "false") {
          setControlsCollapsed(raw === "true");
        } else {
          setControlsCollapsed(isCompactHeight);
        }
        setCollapseLoaded(true);
      })
      .catch(() => {
        if (mounted) {
          setControlsCollapsed(isCompactHeight);
          setCollapseLoaded(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [isCompactHeight]);

  useEffect(() => {
    if (!collapseLoaded) return;
    AsyncStorage.setItem(
      CONTROLS_COLLAPSE_KEY,
      controlsCollapsed ? "true" : "false",
    ).catch(() => undefined);
  }, [controlsCollapsed, collapseLoaded]);

  useEffect(() => {
    if (!pinsLoaded) return;
    AsyncStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pinnedIds)).catch(
      () => undefined,
    );
  }, [pinnedIds, pinsLoaded]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    const tierFilter =
      activeFilter !== "all" && activeFilter !== "pinned" ? activeFilter : null;
    const pinnedOnly = activeFilter === "pinned";

    return GLOSSARY_SECTIONS.filter((section) =>
      tierFilter ? section.tier === tierFilter : true,
    )
      .map((section) => {
        const items = section.items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => {
            if (pinnedOnly && !pinnedSet.has(item.id)) return false;
            if (!normalizedQuery) return true;
            const haystack =
              `${item.title} ${item.summary} ${item.detail ?? ""}`.toLowerCase();
            return haystack.includes(normalizedQuery);
          })
          .sort((a, b) => {
            const pinDelta =
              Number(pinnedSet.has(b.item.id)) -
              Number(pinnedSet.has(a.item.id));
            return pinDelta !== 0 ? pinDelta : a.index - b.index;
          })
          .map(({ item }) => item);
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [activeFilter, normalizedQuery, pinnedSet]);

  const groupedSections = useMemo(
    () =>
      TIER_ORDER.map((tier) => ({
        tier,
        title: TIER_LABELS[tier],
        sections: filteredSections
          .filter((section) => section.tier === tier)
          .sort(
            (a, b) =>
              getSectionSortIndex(tier, a.id) - getSectionSortIndex(tier, b.id),
          ),
      })).filter((group) => group.sections.length > 0),
    [filteredSections],
  );

  const listSections = useMemo<GlossarySectionList[]>(
    () =>
      groupedSections.map((group) => ({
        title: group.title,
        tier: group.tier,
        data: group.sections.map(
          (section): GlossaryRow => ({ type: "section", section }),
        ),
      })),
    [groupedSections],
  );

  const sectionIndexMap = useMemo(() => {
    const map: Record<string, { sectionIndex: number; itemIndex: number }> = {};
    listSections.forEach((group, sectionIndex) => {
      group.data.forEach((row, itemIndex) => {
        map[row.section.id] = { sectionIndex, itemIndex };
      });
    });
    return map;
  }, [listSections]);

  const handleJumpTo = (sectionId: string) => {
    const target = sectionIndexMap[sectionId];
    if (!target) return;
    listRef.current?.scrollToLocation({
      sectionIndex: target.sectionIndex,
      itemIndex: target.itemIndex,
      animated: true,
      viewOffset: Spacing.md,
    });
    setControlsCollapsed(true);
  };

  const togglePin = (id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const pinnedEmpty = activeFilter === "pinned" && pinnedIds.length === 0;
  const emptyTitle = pinnedEmpty ? "No pinned items" : "No matches";
  const emptyDescription = pinnedEmpty
    ? "Tap the bookmark on any entry to pin it here."
    : "Try a different keyword or clear the search.";

  const showIndex = normalizedQuery.length === 0 && groupedSections.length > 0;

  return (
    <ModalShell
      title="Glossary"
      subtitle="Every icon, badge, and system"
      icon="help-circle"
      iconColor={GameColors.ui.primary}
      onClose={onClose}
    >
      <View style={styles.searchSection}>
        <View style={styles.searchHeaderRow}>
          <View style={styles.searchBar}>
            <Feather
              name="search"
              size={16}
              color={GameColors.text.secondary}
            />
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
              <Pressable
                onPress={() => setQuery("")}
                style={styles.clearButton}
              >
                <Feather name="x" size={14} color={GameColors.text.secondary} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setControlsCollapsed((prev) => !prev)}
            style={styles.collapseButton}
          >
            <Feather
              name={controlsCollapsed ? "chevrons-down" : "chevrons-up"}
              size={18}
              color={GameColors.text.secondary}
            />
          </Pressable>
        </View>

        {!controlsCollapsed ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {[
                { key: "all", label: "All" },
                { key: "pinned", label: "Pinned" },
                { key: "basics", label: TIER_LABELS.basics },
                { key: "core", label: TIER_LABELS.core },
                { key: "advanced", label: TIER_LABELS.advanced },
                { key: "endgame", label: TIER_LABELS.endgame },
              ].map((filter) => {
                const active = activeFilter === filter.key;
                return (
                  <Pressable
                    key={filter.key}
                    onPress={() =>
                      setActiveFilter(filter.key as GlossaryFilter)
                    }
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {filter.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>

            {showIndex ? (
              <View style={styles.indexGroup}>
                <ThemedText style={styles.indexTitle}>Jump to</ThemedText>
                {groupedSections.map((group) => (
                  <View key={group.tier} style={styles.indexGroupBlock}>
                    <ThemedText style={styles.indexGroupTitle}>
                      {group.title}
                    </ThemedText>
                    <View style={styles.indexChipRow}>
                      {group.sections.map((section) => (
                        <Pressable
                          key={section.id}
                          onPress={() => handleJumpTo(section.id)}
                          style={styles.indexChip}
                        >
                          <ThemedText style={styles.indexChipText}>
                            {section.title}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      <SectionList
        ref={listRef}
        sections={listSections}
        keyExtractor={(item) => item.section.id}
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing["4xl"] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Feather name="search" size={28} color={GameColors.text.disabled} />
            <ThemedText style={styles.emptyTitle}>{emptyTitle}</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              {emptyDescription}
            </ThemedText>
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.groupHeader}>
            <ThemedText style={styles.groupHeaderText}>
              {section.title}
            </ThemedText>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {item.section.title}
            </ThemedText>
            <View style={styles.sectionCard}>
              {item.section.items.map((entry) => {
                const isPinned = pinnedSet.has(entry.id);
                const hasDetail = Boolean(entry.detail);
                const isExpanded = hasDetail && expandedItems.has(entry.id);
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => {
                      if (!hasDetail) return;
                      toggleExpanded(entry.id);
                    }}
                    style={({ pressed }) => [
                      styles.itemRow,
                      pressed && hasDetail && styles.itemRowPressed,
                    ]}
                  >
                    <View style={styles.itemIcon}>
                      {entry.part ? (
                        <PartItem
                          part={makePart(entry.part.tier, entry.part.family)}
                          size={42}
                          disabled
                          reducedMotion={reducedMotion}
                        />
                      ) : entry.image && entry.isPortrait ? (
                        <AvatarImage
                          source={entry.image}
                          size={40}
                          borderColor="#2A2A4A"
                          backgroundColor="rgba(255,255,255,0.08)"
                          icon="user"
                          iconColor={GameColors.text.secondary}
                        />
                      ) : entry.image ? (
                        <Image
                          source={entry.image}
                          style={styles.imageIcon}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                        />
                      ) : entry.icon ? (
                        <LinearGradient
                          colors={[
                            `${entry.color ?? GameColors.ui.primary}30`,
                            `${entry.color ?? GameColors.ui.primary}10`,
                          ]}
                          style={styles.iconContainer}
                        >
                          <Feather
                            name={entry.icon}
                            size={18}
                            color={entry.color ?? GameColors.ui.primary}
                          />
                        </LinearGradient>
                      ) : null}
                    </View>
                    <View style={styles.itemText}>
                      <View style={styles.itemTitleRow}>
                        <ThemedText style={styles.itemTitle}>
                          {entry.title}
                        </ThemedText>
                        <View style={styles.itemActions}>
                          <Pressable
                            onPress={(event) => {
                              event.stopPropagation?.();
                              togglePin(entry.id);
                            }}
                            style={styles.pinButton}
                          >
                            <Feather
                              name="bookmark"
                              size={14}
                              color={
                                isPinned
                                  ? GameColors.ui.primary
                                  : GameColors.text.disabled
                              }
                            />
                          </Pressable>
                          {hasDetail ? (
                            <Feather
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={16}
                              color={GameColors.text.secondary}
                            />
                          ) : null}
                        </View>
                      </View>
                      <ThemedText style={styles.itemSummary} numberOfLines={2}>
                        {entry.summary}
                      </ThemedText>
                      {isExpanded && entry.detail ? (
                        <ThemedText style={styles.itemDetail}>
                          {entry.detail}
                        </ThemedText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
    gap: Spacing.lg,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  searchHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
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
  collapseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
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
  filtersRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  filterChipActive: {
    borderColor: GameColors.ui.primary + "60",
    backgroundColor: GameColors.ui.primary + "15",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  filterChipTextActive: {
    color: GameColors.ui.primary,
  },
  indexGroup: {
    gap: Spacing.sm,
  },
  indexTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.secondary,
    letterSpacing: 0.4,
  },
  indexGroupBlock: {
    gap: Spacing.xs,
  },
  indexGroupTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  indexChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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
  groupHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: GameColors.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A2E",
  },
  groupHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.secondary,
  },
  section: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  sectionCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#141426",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  itemRowPressed: {
    backgroundColor: "#1A1A2E",
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
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  pinButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  itemSummary: {
    fontSize: 13,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  itemDetail: {
    fontSize: 12,
    color: GameColors.text.disabled,
    marginTop: 4,
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
