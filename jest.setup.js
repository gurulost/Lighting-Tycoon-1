require("react-native-gesture-handler/jestSetup");
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock("expo-image", () => {
  const { Image } = require("react-native");
  return { Image };
});
