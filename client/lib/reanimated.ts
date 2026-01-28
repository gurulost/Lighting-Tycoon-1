import * as Reanimated from "react-native-reanimated";

type RepeatFn = (...args: any[]) => any;

let withRepeatSafe: RepeatFn | undefined;

try {
  withRepeatSafe = (Reanimated as { withRepeat?: RepeatFn }).withRepeat;
} catch {
  withRepeatSafe = undefined;
}

export const withRepeat: RepeatFn = (...args) => {
  if (typeof withRepeatSafe === "function") {
    return withRepeatSafe(...args);
  }
  return args[0];
};

