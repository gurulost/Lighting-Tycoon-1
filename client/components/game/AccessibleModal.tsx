import React, { createContext, useContext, useEffect, useState } from "react";
import { Modal, Platform, View, type ModalProps } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const ModalPresentedContext = createContext(true);
const ModalReturnFocusContext = createContext<(() => void) | undefined>(
  undefined,
);
export const ModalReturnFocusProvider = ModalReturnFocusContext.Provider;
export function useModalPresented() {
  return useContext(ModalPresentedContext);
}

/** Keeps each presented native accessibility container isolated. */
type AccessibleModalProps = Omit<ModalProps, "onRequestClose"> & {
  onRequestClose?: () => void;
};

export function AccessibleModal({
  children,
  animationType,
  ...props
}: AccessibleModalProps) {
  const reducedMotion = useReducedMotion();
  const [presented, setPresented] = useState(false);
  const restoreFocus = useContext(ModalReturnFocusContext);
  useEffect(() => {
    if (!props.visible) setPresented(false);
  }, [props.visible]);
  return (
    <Modal
      {...props}
      supportedOrientations={
        props.supportedOrientations ??
        (Platform.OS === "ios" && Platform.isPad
          ? [
              "portrait",
              "portrait-upside-down",
              "landscape-left",
              "landscape-right",
            ]
          : ["portrait"])
      }
      animationType={reducedMotion ? "none" : animationType}
      onShow={(event) => {
        setPresented(true);
        props.onShow?.(event);
      }}
      onDismiss={() => {
        setPresented(false);
        props.onDismiss?.();
        restoreFocus?.();
      }}
    >
      <ModalPresentedContext.Provider value={presented}>
        <View
          style={{ flex: 1 }}
          accessibilityViewIsModal
          onAccessibilityEscape={props.onRequestClose}
        >
          {children}
        </View>
      </ModalPresentedContext.Provider>
    </Modal>
  );
}
