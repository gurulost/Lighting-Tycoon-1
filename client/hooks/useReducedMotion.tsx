import React, { createContext, useContext, useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

const SystemMotionContext = createContext(false);
const UserMotionContext = createContext(false);

export function MotionPreferencesProvider({
  children,
  userPreference = false,
}: {
  children: React.ReactNode;
  userPreference?: boolean;
}) {
  // Avoid playing an entrance animation before the system preference resolves.
  const [systemReducedMotion, setSystemReducedMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        changed = true;
        setSystemReducedMotion(value);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted && !changed) setSystemReducedMotion(value);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return (
    <SystemMotionContext.Provider value={systemReducedMotion}>
      <UserMotionContext.Provider value={userPreference}>
        {children}
      </UserMotionContext.Provider>
    </SystemMotionContext.Provider>
  );
}

export function useSystemReducedMotion() {
  return useContext(SystemMotionContext);
}

export function useReducedMotion(userPreference = false) {
  const systemPreference = useSystemReducedMotion();
  const savedPreference = useContext(UserMotionContext);
  return systemPreference || savedPreference || userPreference;
}
