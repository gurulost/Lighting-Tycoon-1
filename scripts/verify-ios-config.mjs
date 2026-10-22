#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const plist = require("@expo/plist").default;
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function equalValues(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Validates generated files without requiring CocoaPods' SDK API aggregation. */
export function validateIosConfig(config, info, privacy) {
  const errors = [];
  const expectedPrivacy = config.ios?.privacyManifests;
  const expectedInfo = config.ios?.infoPlist;
  if (Object.hasOwn(info, "NSMicrophoneUsageDescription")) {
    errors.push(
      "Generated Info.plist unexpectedly requests microphone access.",
    );
  }
  const phoneOrientations = info.UISupportedInterfaceOrientations ?? [];
  if (
    config.orientation !== "portrait" ||
    !phoneOrientations.includes("UIInterfaceOrientationPortrait") ||
    phoneOrientations.some((value) => value.includes("Landscape"))
  ) {
    errors.push("Generated iPhone orientations must remain portrait-only.");
  }
  if (
    !equalValues(
      [...(info["UISupportedInterfaceOrientations~ipad"] ?? [])].sort(),
      [
        ...(expectedInfo?.["UISupportedInterfaceOrientations~ipad"] ?? []),
      ].sort(),
    ) ||
    (info["UISupportedInterfaceOrientations~ipad"] ?? []).length !== 4 ||
    info.UIRequiresFullScreen !== false
  ) {
    errors.push(
      "Generated iPad orientations/multitasking differ from app config.",
    );
  }
  if (
    !expectedPrivacy ||
    privacy.NSPrivacyTracking !== false ||
    (privacy.NSPrivacyTrackingDomains ?? []).length !== 0
  ) {
    errors.push("Generated privacy manifest must not enable tracking.");
  }
  const actualTypes = privacy.NSPrivacyCollectedDataTypes ?? [];
  const expectedTypes = expectedPrivacy?.NSPrivacyCollectedDataTypes ?? [];
  for (const expected of expectedTypes) {
    const actual = actualTypes.find(
      (entry) =>
        entry.NSPrivacyCollectedDataType ===
        expected.NSPrivacyCollectedDataType,
    );
    if (
      !actual ||
      actual.NSPrivacyCollectedDataTypeLinked !==
        expected.NSPrivacyCollectedDataTypeLinked ||
      actual.NSPrivacyCollectedDataTypeTracking !==
        expected.NSPrivacyCollectedDataTypeTracking ||
      !equalValues(
        [...(actual.NSPrivacyCollectedDataTypePurposes ?? [])].sort(),
        [...expected.NSPrivacyCollectedDataTypePurposes].sort(),
      )
    ) {
      errors.push(
        `Generated privacy declaration differs for ${expected.NSPrivacyCollectedDataType}.`,
      );
    }
  }
  const unexpectedTypes = actualTypes.filter(
    (actual) =>
      !expectedTypes.some(
        (expected) =>
          actual.NSPrivacyCollectedDataType ===
          expected.NSPrivacyCollectedDataType,
      ),
  );
  if (unexpectedTypes.length) {
    errors.push(
      "Generated manifest contains unreviewed SDK collection declarations.",
    );
  }
  // SDK-required API categories/reasons may be added by CocoaPods aggregation.
  // Preserve and report them rather than assuming a pre-pods fixed inventory.
  return errors;
}

export function verifyIosConfig(root = repositoryRoot) {
  const config = JSON.parse(
    readFileSync(resolve(root, "app.json"), "utf8"),
  ).expo;
  const nativeRoot = resolve(root, "ios/LightingTycoon");
  const info = plist.parse(
    readFileSync(resolve(nativeRoot, "Info.plist"), "utf8"),
  );
  const privacy = plist.parse(
    readFileSync(resolve(nativeRoot, "PrivacyInfo.xcprivacy"), "utf8"),
  );
  const errors = validateIosConfig(config, info, privacy);
  return {
    ok: errors.length === 0,
    errors,
    collectedDataTypes: (privacy.NSPrivacyCollectedDataTypes ?? []).map(
      (entry) => entry.NSPrivacyCollectedDataType,
    ),
    requiredReasonApiCategories: (privacy.NSPrivacyAccessedAPITypes ?? []).map(
      (entry) => entry.NSPrivacyAccessedAPIType,
    ),
  };
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const result = verifyIosConfig();
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(
      `iOS configuration verification failed: ${error.message}. Run npx expo prebuild --platform ios --no-install first.`,
    );
    process.exitCode = 1;
  }
}
