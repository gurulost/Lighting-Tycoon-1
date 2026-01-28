import { ImageSourcePropType } from "react-native";

import { MissionGiver } from "@/types/game";
import { GameColors } from "@/constants/theme";
import { getPortraitSource } from "@/constants/characters";

export interface MissionGiverMeta {
  label: string;
  color: string;
  icon: string;
  portrait?: ImageSourcePropType;
}

export function getMissionGiverMeta(giver: MissionGiver): MissionGiverMeta {
  switch (giver) {
    case "mentor":
      return {
        label: "Mentor",
        color: GameColors.openStandard.primary,
        icon: "compass",
        portrait: getPortraitSource("mentor", "sm", "portrait"),
      };
    case "baron":
      return {
        label: "Baron",
        color: GameColors.locked.primary,
        icon: "briefcase",
        portrait: getPortraitSource("baron", "sm", "portrait"),
      };
    case "rd":
      return {
        label: "R&D",
        color: GameColors.currency.research,
        icon: "cpu",
      };
    case "customer":
      return {
        label: "Customer",
        color: GameColors.ui.primary,
        icon: "users",
      };
    case "system":
      return {
        label: "System",
        color: GameColors.text.secondary,
        icon: "shield",
      };
    default:
      return {
        label: "Goal",
        color: GameColors.text.secondary,
        icon: "target",
      };
  }
}
