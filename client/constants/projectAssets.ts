Here’s the full corrected file content you can paste in:

```ts
import { ImageSourcePropType } from "react-native";

export type ProjectImageSize = "lg" | "md" | "sm";

type SizedImageSet = {
  lg: ImageSourcePropType;
  md: ImageSourcePropType;
  sm: ImageSourcePropType;
};

export const PROJECT_CARD_IMAGES: Record<string, SizedImageSet> = {
  project_card_airport_runway: {
    lg: require("../../assets/images/projects/project_card_airport_runway.webp"),
    md: require("../../assets/images/projects/project_card_airport_runway-512.webp"),
    sm: require("../../assets/images/projects/project_card_airport_runway-256.webp"),
  },
  project_card_childrens_hospital: {
    lg: require("../../assets/images/projects/project_card_childrens_hospital.webp"),
    md: require("../../assets/images/projects/project_card_childrens_hospital-512.webp"),
    sm: require("../../assets/images/projects/project_card_childrens_hospital-256.webp"),
  },
  project_card_festival_main_stage: {
    lg: require("../../assets/images/projects/project_card_festival_main_stage.webp"),
    md: require("../../assets/images/projects/project_card_festival_main_stage-512.webp"),
    sm: require("../../assets/images/projects/project_card_festival_main_stage-256.webp"),
  },
  project_card_harbor_beacon: {
    lg: require("../../assets/images/projects/project_card_harbor_beacon.webp"),
    md: require("../../assets/images/projects/project_card_harbor_beacon-512.webp"),
    sm: require("../../assets/images/projects/project_card_harbor_beacon-256.webp"),
  },
  project_card_international_expo: {
    lg: require("../../assets/images/projects/project_card_international_expo.webp"),
    md: require("../../assets/images/projects/project_card_international_expo-512.webp"),
    sm: require("../../assets/images/projects/project_card_international_expo-256.webp"),
  },
  project_card_metro_wayfinding: {
    lg: require("../../assets/images/projects/project_card_metro_wayfinding.webp"),
    md: require("../../assets/images/projects/project_card_metro_wayfinding-512.webp"),
    sm: require("../../assets/images/projects/project_card_metro_wayfinding-256.webp"),
  },
  project_card_museum_exhibit: {
    lg: require("../../assets/images/projects/project_card_museum_exhibit.webp"),
    md: require("../../assets/images/projects/project_card_museum_exhibit-512.webp"),
    sm: require("../../assets/images/projects/project_card_museum_exhibit-256.webp"),
  },
  project_card_neon_city_grid: {
    lg: require("../../assets/images/projects/project_card_neon_city_grid.webp"),
    md: require("../../assets/images/projects/project_card_neon_city_grid-512.webp"),
    sm: require("../../assets/images/projects/project_card_neon_city_grid-256.webp"),
  },
  project_card_skyline_tower: {
    lg: require("../../assets/images/projects/project_card_skyline_tower.webp"),
    md: require("../../assets/images/projects/project_card_skyline_tower-512.webp"),
    sm: require("../../assets/images/projects/project_card_skyline_tower-256.webp"),
  },
  project_card_stadium_halftime: {
    lg: require("../../assets/images/projects/project_card_stadium_halftime.webp"),
    md: require("../../assets/images/projects/project_card_stadium_halftime-512.webp"),
    sm: require("../../assets/images/projects/project_card_stadium_halftime-256.webp"),
  },
};

export const PROJECT_TROPHY_IMAGES: Record<string, SizedImageSet> = {
  trophy_backstage_pass: {
    lg: require("../../assets/images/trophies/trophy_backstage_pass.webp"),
    md: require("../../assets/images/trophies/trophy_backstage_pass-512.webp"),
    sm: require("../../assets/images/trophies/trophy_backstage_pass-256.webp"),
  },
  trophy_city_grid: {
    lg: require("../../assets/images/trophies/trophy_city_grid.webp"),
    md: require("../../assets/images/trophies/trophy_city_grid-512.webp"),
    sm: require("../../assets/images/trophies/trophy_city_grid-256.webp"),
  },
  trophy_clearance_badge: {
    lg: require("../../assets/images/trophies/trophy_clearance_badge.webp"),
    md: require("../../assets/images/trophies/trophy_clearance_badge-512.webp"),
    sm: require("../../assets/images/trophies/trophy_clearance_badge-256.webp"),
  },
  trophy_curator_seal: {
    lg: require("../../assets/images/trophies/trophy_curator_seal.webp"),
    md: require("../../assets/images/trophies/trophy_curator_seal-512.webp"),
    sm: require("../../assets/images/trophies/trophy_curator_seal-256.webp"),
  },
  trophy_expo_laurel: {
    lg: require("../../assets/images/trophies/trophy_expo_laurel.webp"),
    md: require("../../assets/images/trophies/trophy_expo_laurel-512.webp"),
    sm: require("../../assets/images/trophies/trophy_expo_laurel-256.webp"),
  },
  trophy_glassspire_plaque: {
    lg: require("../../assets/images/trophies/trophy_glassspire_plaque.webp"),
    md: require("../../assets/images/trophies/trophy_glassspire_plaque-512.webp"),
    sm: require("../../assets/images/trophies/trophy_glassspire_plaque-256.webp"),
  },
  trophy_halftime: {
    lg: require("../../assets/images/trophies/trophy_halftime.webp"),
    md: require("../../assets/images/trophies/trophy_halftime-512.webp"),
    sm: require("../../assets/images/trophies/trophy_halftime-256.webp"),
  },
  trophy_harbor_lantern: {
    lg: require("../../assets/images/trophies/trophy_harbor_lantern.webp"),
    md: require("../../assets/images/trophies/trophy_harbor_lantern-512.webp"),
    sm: require("../../assets/images/trophies/trophy_harbor_lantern-256.webp"),
  },
  trophy_metro_badge: {
    lg: require("../../assets/images/trophies/trophy_metro_badge.webp"),
    md: require("../../assets/images/trophies/trophy_metro_badge-512.webp"),
    sm: require("../../assets/images/trophies/trophy_metro_badge-256.webp"),
  },
  trophy_nightlight_ribbon: {
    lg: require("../../assets/images/trophies/trophy_nightlight_ribbon.webp"),
    md: require("../../assets/images/trophies/trophy_nightlight_ribbon-512.webp"),
    sm: require("../../assets/images/trophies/trophy_nightlight_ribbon-256.webp"),
  },
};

export function getProjectCardImage(
  key?: string,
  size: ProjectImageSize = "lg",
) {
  if (!key) return undefined;
  const entry = PROJECT_CARD_IMAGES[key];
  if (!entry) return undefined;
  return entry[size] ?? entry.lg;
}

export function getProjectTrophyImage(
  key?: string,
  size: ProjectImageSize = "md",
) {
  if (!key) return undefined;
  const entry = PROJECT_TROPHY_IMAGES[key];
  if (!entry) return undefined;
  return entry[size] ?? entry.lg;
}
```