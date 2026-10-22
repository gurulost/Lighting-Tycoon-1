import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateIosConfig, verifyIosConfig } from "./verify-ios-config.mjs";

const require = createRequire(import.meta.url);
const plist = require("@expo/plist").default;
const appConfig = JSON.parse(
  readFileSync(new URL("../app.json", import.meta.url), "utf8"),
).expo;

function fixture() {
  return {
    config: structuredClone(appConfig),
    info: {
      ...structuredClone(appConfig.ios.infoPlist),
      UISupportedInterfaceOrientations: ["UIInterfaceOrientationPortrait"],
    },
    privacy: {
      ...structuredClone(appConfig.ios.privacyManifests),
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
      ],
    },
  };
}

test("accepts current privacy/orientation policy plus SDK API aggregation", () => {
  const { config, info, privacy } = fixture();
  assert.deepEqual(validateIosConfig(config, info, privacy), []);
  assert.deepEqual(
    validateIosConfig(config, info, {
      ...privacy,
      NSPrivacyAccessedAPITypes: [],
    }),
    [],
  );
});

test("rejects microphone, orientation, and data collection regressions", () => {
  const { config, info, privacy } = fixture();
  info.NSMicrophoneUsageDescription = "unexpected";
  info.UISupportedInterfaceOrientations.push(
    "UIInterfaceOrientationLandscapeLeft",
  );
  info.UIRequiresFullScreen = true;
  privacy.NSPrivacyTracking = true;
  privacy.NSPrivacyCollectedDataTypes[0].NSPrivacyCollectedDataTypeTracking = true;
  const errors = validateIosConfig(config, info, privacy);
  assert.equal(errors.length, 5);
});

test("rejects undeclared SDK collection instead of silently changing the inventory", () => {
  const { config, info, privacy } = fixture();
  privacy.NSPrivacyCollectedDataTypes.push({
    NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
  });
  assert.match(
    validateIosConfig(config, info, privacy).join(" "),
    /unreviewed/,
  );
});

test("reads generated native files from a clean temporary prebuild layout", (context) => {
  const root = mkdtempSync(join(tmpdir(), "lighting-ios-config-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const { config, info, privacy } = fixture();
  const nativeRoot = join(root, "ios", "LightingTycoon");
  mkdirSync(nativeRoot, { recursive: true });
  writeFileSync(join(root, "app.json"), JSON.stringify({ expo: config }));
  writeFileSync(join(nativeRoot, "Info.plist"), plist.build(info));
  writeFileSync(
    join(nativeRoot, "PrivacyInfo.xcprivacy"),
    plist.build(privacy),
  );
  const result = verifyIosConfig(root);
  assert.equal(result.ok, true);
  assert.ok(
    result.requiredReasonApiCategories.includes(
      "NSPrivacyAccessedAPICategoryUserDefaults",
    ),
  );
});
