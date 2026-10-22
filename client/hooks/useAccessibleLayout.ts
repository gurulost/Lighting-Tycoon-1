import { useWindowDimensions } from "react-native";

export function useAccessibleLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  return {
    width,
    height,
    fontScale,
    largeText: fontScale >= 1.5,
    stacked: fontScale >= 1.5 || width < 360,
  };
}
