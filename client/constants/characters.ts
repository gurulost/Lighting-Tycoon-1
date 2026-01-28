import { StoryBeat, StorySpeaker } from "@/constants/story";

export type PortraitVariant = NonNullable<StoryBeat["portrait"]>;
export type PortraitSize = "sm" | "md" | "lg";

const TINA_PORTRAITS = {
  portrait: {
    sm: require("../../assets/images/tina/tina-portrait-128.webp"),
    md: require("../../assets/images/tina/tina-portrait-256.webp"),
    lg: require("../../assets/images/tina/tina-portrait-512.webp"),
  },
  confident: {
    sm: require("../../assets/images/tina/tina-confident-128.webp"),
    md: require("../../assets/images/tina/tina-confident-256.webp"),
    lg: require("../../assets/images/tina/tina-confident-512.webp"),
  },
  focused: {
    sm: require("../../assets/images/tina/tina-focused-128.webp"),
    md: require("../../assets/images/tina/tina-focused-256.webp"),
    lg: require("../../assets/images/tina/tina-focused-512.webp"),
  },
  delighted: {
    sm: require("../../assets/images/tina/tina-delighted-128.webp"),
    md: require("../../assets/images/tina/tina-delighted-256.webp"),
    lg: require("../../assets/images/tina/tina-delighted-512.webp"),
  },
  concerned: {
    sm: require("../../assets/images/tina/tina-concerned-128.webp"),
    md: require("../../assets/images/tina/tina-concerned-256.webp"),
    lg: require("../../assets/images/tina/tina-concerned-512.webp"),
  },
} as const;

const MENTOR_PORTRAITS = {
  portrait: {
    sm: require("../../assets/images/mentor/mentor-portrait-128.webp"),
    md: require("../../assets/images/mentor/mentor-portrait-256.webp"),
    lg: require("../../assets/images/mentor/mentor-portrait-512.webp"),
  },
} as const;

const BARON_PORTRAITS = {
  portrait: {
    sm: require("../../assets/images/baron/baron-portrait-128.webp"),
    md: require("../../assets/images/baron/baron-portrait-256.webp"),
    lg: require("../../assets/images/baron/baron-portrait-512.webp"),
  },
} as const;

export function getPortraitSource(
  speaker: StorySpeaker,
  size: PortraitSize,
  portrait: PortraitVariant = "portrait"
) {
  if (speaker === "tina") {
    return (TINA_PORTRAITS[portrait] ?? TINA_PORTRAITS.portrait)[size];
  }
  if (speaker === "mentor") {
    return MENTOR_PORTRAITS.portrait[size];
  }
  if (speaker === "baron") {
    return BARON_PORTRAITS.portrait[size];
  }
  return undefined;
}

export function getPortraitForBeat(beat: StoryBeat, size: PortraitSize) {
  return getPortraitSource(beat.speaker, size, beat.portrait ?? "portrait");
}
