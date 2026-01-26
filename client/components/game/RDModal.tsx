import React from "react";

import { RDTree } from "./RDTree";
import { ModalShell } from "./ModalShell";
import { GameColors } from "@/constants/theme";

interface RDModalProps {
  onClose: () => void;
}

export function RDModal({ onClose }: RDModalProps) {
  return (
    <ModalShell
      title="R&D Lab"
      subtitle="Spend research to unlock Freedom tech"
      icon="cpu"
      iconColor={GameColors.currency.research}
      onClose={onClose}
    >
      <RDTree onCraftFreedomController={() => {}} />
    </ModalShell>
  );
}
