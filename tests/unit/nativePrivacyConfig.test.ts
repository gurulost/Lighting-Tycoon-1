import appConfig from "../../app.json";

describe("native privacy configuration", () => {
  it("ships playback without requesting recording permission", () => {
    const plugin = appConfig.expo.plugins.find(
      (entry) => Array.isArray(entry) && entry[0] === "expo-audio",
    );
    expect(plugin).toEqual([
      "expo-audio",
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundRecording: false,
      },
    ]);
    expect(appConfig.expo.android.blockedPermissions).toContain(
      "android.permission.RECORD_AUDIO",
    );
  });

  it("declares portrait phones and all tablet orientations with multitasking", () => {
    expect(
      appConfig.expo.ios.infoPlist["UISupportedInterfaceOrientations~ipad"],
    ).toEqual([
      "UIInterfaceOrientationPortrait",
      "UIInterfaceOrientationPortraitUpsideDown",
      "UIInterfaceOrientationLandscapeLeft",
      "UIInterfaceOrientationLandscapeRight",
    ]);
    expect(appConfig.expo.ios.infoPlist.UIRequiresFullScreen).toBe(false);
    expect(appConfig.expo.orientation).toBe("portrait");
  });

  it("declares the reviewed collection inventory without advertising tracking", () => {
    const privacy = appConfig.expo.ios.privacyManifests;
    expect(privacy.NSPrivacyTracking).toBe(false);
    expect(privacy.NSPrivacyTrackingDomains).toEqual([]);
    expect(
      privacy.NSPrivacyCollectedDataTypes.map(
        (entry) => entry.NSPrivacyCollectedDataType,
      ).sort(),
    ).toEqual([
      "NSPrivacyCollectedDataTypeCrashData",
      "NSPrivacyCollectedDataTypeDeviceID",
      "NSPrivacyCollectedDataTypeOtherDiagnosticData",
      "NSPrivacyCollectedDataTypeProductInteraction",
    ]);
    privacy.NSPrivacyCollectedDataTypes.forEach((entry) => {
      expect(entry.NSPrivacyCollectedDataTypeLinked).toBe(true);
      expect(entry.NSPrivacyCollectedDataTypeTracking).toBe(false);
      expect(entry.NSPrivacyCollectedDataTypePurposes.length).toBeGreaterThan(
        0,
      );
    });
  });
});
