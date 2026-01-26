import { Platform } from "react-native";

export const GameColors = {
  openStandard: {
    primary: "#4A9EFF",
    glow: "#FFFFFF",
  },
  locked: {
    primary: "#FFB84D",
    accent: "#A855F7",
  },
  board: {
    background: "#1A1A2E",
    tile: "#252542",
    tileEmpty: "#1E1E36",
  },
  ui: {
    background: "#0F0F1F",
    surface: "#1F1F2E",
    surfaceElevated: "#2A2A3E",
    primary: "#00D9FF",
    danger: "#FF4D4D",
    success: "#4DFF88",
    warning: "#FFB84D",
  },
  currency: {
    cash: "#FFD700",
    reputation: "#00D9FF",
    research: "#9D4EDD",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#A0A0B8",
    disabled: "#505064",
  },
  tiers: {
    1: "#8B9DC3",
    2: "#4A9EFF",
    3: "#00D9FF",
    4: "#4DFF88",
    5: "#FFD700",
  },
};

const tintColorLight = "#00D9FF";
const tintColorDark = "#00D9FF";

export const Colors = {
  light: {
    text: "#FFFFFF",
    buttonText: "#0F0F1F",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    link: "#00D9FF",
    backgroundRoot: "#0F0F1F",
    backgroundDefault: "#1F1F2E",
    backgroundSecondary: "#2A2A3E",
    backgroundTertiary: "#353548",
  },
  dark: {
    text: "#FFFFFF",
    buttonText: "#0F0F1F",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: "#00D9FF",
    backgroundRoot: "#0F0F1F",
    backgroundDefault: "#1F1F2E",
    backgroundSecondary: "#2A2A3E",
    backgroundTertiary: "#353548",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  tileSize: 64,
  tileGap: 4,
  partSize: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const ModalTokens = {
  gradient: ["#0A0A14", "#0F0F1F", "#0A0A14"] as const,
  border: "#2A2A4A",
  headerHeight: 56,
  titleSize: 22,
  subtitleSize: 13,
  closeButton: {
    size: 44,
    radius: 22,
    background: "#1A1A2E",
    border: "#2A2A4A",
  },
};

export const ModalTypography = {
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: GameColors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: GameColors.text.secondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: GameColors.text.primary,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: GameColors.text.secondary,
  },
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  micro: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  tier: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
