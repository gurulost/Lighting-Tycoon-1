import { ImageSourcePropType } from "react-native";

export const PROJECT_CARD_IMAGES: Record<string, ImageSourcePropType> = {
  project_card_airport_runway: require("../../assets/images/projects/project_card_airport_runway.webp"),
  project_card_childrens_hospital: require("../../assets/images/projects/project_card_childrens_hospital.webp"),
  project_card_festival_main_stage: require("../../assets/images/projects/project_card_festival_main_stage.webp"),
  project_card_harbor_beacon: require("../../assets/images/projects/project_card_harbor_beacon.webp"),
  project_card_international_expo: require("../../assets/images/projects/project_card_international_expo.webp"),
  project_card_metro_wayfinding: require("../../assets/images/projects/project_card_metro_wayfinding.webp"),
  project_card_museum_exhibit: require("../../assets/images/projects/project_card_museum_exhibit.webp"),
  project_card_neon_city_grid: require("../../assets/images/projects/project_card_neon_city_grid.webp"),
  project_card_skyline_tower: require("../../assets/images/projects/project_card_skyline_tower.webp"),
  project_card_stadium_halftime: require("../../assets/images/projects/project_card_stadium_halftime.webp"),
};

export const PROJECT_TROPHY_IMAGES: Record<string, ImageSourcePropType> = {
  trophy_backstage_pass: require("../../assets/images/trophies/trophy_backstage_pass.webp"),
  trophy_city_grid: require("../../assets/images/trophies/trophy_city_grid.webp"),
  trophy_clearance_badge: require("../../assets/images/trophies/trophy_clearance_badge.webp"),
  trophy_curator_seal: require("../../assets/images/trophies/trophy_curator_seal.webp"),
  trophy_expo_laurel: require("../../assets/images/trophies/trophy_expo_laurel.webp"),
  trophy_glasspire_plaque: require("../../assets/images/trophies/trophy_glasspire_plaque.webp"),
  trophy_halftime: require("../../assets/images/trophies/trophy_halftime.webp"),
  trophy_harbor_lantern: require("../../assets/images/trophies/trophy_harbor_lantern.webp"),
  trophy_metro_badge: require("../../assets/images/trophies/trophy_metro_badge.webp"),
  trophy_nightlight_ribbon: require("../../assets/images/trophies/trophy_nightlight_ribbon.webp"),
};

export function getProjectCardImage(key?: string) {
  if (!key) return undefined;
  return PROJECT_CARD_IMAGES[key];
}

export function getProjectTrophyImage(key?: string) {
  if (!key) return undefined;
  return PROJECT_TROPHY_IMAGES[key];
}
