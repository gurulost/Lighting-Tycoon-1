import assert from "node:assert/strict";
import test from "node:test";
import {
  commandTimeout,
  parseOptions,
  runPreflight,
  selectSimulator,
} from "./ios-preflight.mjs";

test("allows bounded cold simulator discovery without extending ordinary commands", () => {
  assert.equal(
    commandTimeout(["simctl", "list", "runtimes", "--json"]),
    90_000,
  );
  assert.equal(commandTimeout(["simctl", "list", "devices", "--json"]), 90_000);
  assert.equal(
    commandTimeout(["-workspace", "/repo", "-showdestinations"]),
    90_000,
  );
  assert.equal(commandTimeout(["-version"]), 30_000);
});

const runtime = {
  identifier: "com.apple.CoreSimulator.SimRuntime.iOS-26-2",
  isAvailable: true,
  version: "26.2",
};
const device = {
  udid: "SIM-1",
  name: "iPhone 17",
  isAvailable: true,
  state: "Shutdown",
};
function fixture(overrides = {}) {
  return {
    platform: "darwin",
    nodeVersion: "22.20.0",
    root: "/repo",
    exists: () => true,
    run(command, args) {
      if (command === "xcode-select")
        return "/Applications/Xcode_26.2.app/Contents/Developer";
      if (command === "pod") return "1.16.2";
      if (args.includes("-version")) return "Xcode 26.2\nBuild version 17C52";
      if (args.includes("--show-sdk-version")) return "26.2";
      if (args.includes("runtimes"))
        return JSON.stringify({ runtimes: [runtime] });
      if (args.includes("devices"))
        return JSON.stringify({ devices: { [runtime.identifier]: [device] } });
      return "Available destinations:\n{ platform:iOS Simulator, id:SIM-1, name:iPhone 17 }";
    },
    ...overrides,
  };
}

test("passes only when toolchain and selected project destination are usable", () => {
  const result = runPreflight(
    { expectedXcode: "26.2", expectedSdk: "26.2" },
    fixture(),
  );
  assert.equal(result.ok, true);
  assert.equal(result.checks.projectDestination.simulatorId, "SIM-1");
});

test("rejects an installed runtime whose project destination is ineligible", () => {
  const base = fixture();
  const result = runPreflight(
    {},
    fixture({
      run: (command, args) =>
        args.includes("-showdestinations")
          ? "Ineligible destinations:\n{ id:SIM-1, error:iOS 26.5 is not installed }"
          : base.run(command, args),
    }),
  );
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /not an eligible build destination/);
});

test("reports version drift and missing CocoaPods without hiding other checks", () => {
  const base = fixture();
  const result = runPreflight(
    { expectedXcode: "26.6", expectedSdk: "26.5" },
    fixture({
      run: (command, args) => {
        if (command === "pod") throw new Error("not installed");
        return base.run(command, args);
      },
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 3);
  assert.equal(result.checks.simulator.udid, "SIM-1");
});

test("rejects unknown or unavailable explicit simulators", () => {
  assert.equal(
    selectSimulator([runtime], { [runtime.identifier]: [device] }, "missing"),
    undefined,
  );
  assert.equal(
    selectSimulator([{ ...runtime, isAvailable: false }], {
      [runtime.identifier]: [device],
    }),
    undefined,
  );
});

test("rejects a missing explicitly selected runtime", () => {
  const result = runPreflight({ runtimeVersion: "26.5" }, fixture());
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /No matching available iOS simulator/);
});

test("requires installed pods for a full project check", () => {
  const dependencies = fixture({
    exists: (path) => !path.includes("Manifest.lock"),
  });
  const result = runPreflight({}, dependencies);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /CocoaPods dependencies are missing/);
  assert.equal(runPreflight({ skipProject: true }, dependencies).ok, true);
});

test("reports incomplete Xcode first-launch setup", () => {
  const base = fixture();
  const result = runPreflight(
    {},
    fixture({
      run(command, args) {
        if (args.includes("-checkFirstLaunchStatus"))
          throw new Error("exit 69");
        return base.run(command, args);
      },
    }),
  );
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /firstLaunchSetup.*exit 69/);
});

test("selects newest available runtime and an iPhone deterministically", () => {
  const older = { ...runtime, identifier: "old", version: "18.5" };
  const devices = {
    old: [device],
    [runtime.identifier]: [
      { ...device, udid: "IPAD", name: "iPad Pro" },
      device,
    ],
  };
  assert.equal(selectSimulator([older, runtime], devices).udid, "SIM-1");
});

test("fails early on non-macOS without invoking native tools", () => {
  const result = runPreflight(
    {},
    fixture({
      platform: "linux",
      run: () => assert.fail("must not invoke tools"),
    }),
  );
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /require macOS/);
});

test("strict option parser prevents missing values and typoed checks", () => {
  assert.deepEqual(parseOptions(["--json", "--expect-xcode", "26.2"]), {
    json: true,
    expectedXcode: "26.2",
  });
  assert.throws(() => parseOptions(["--expect-sdk"]), /missing value/);
  assert.throws(() => parseOptions(["--skip-projects"]), /Unknown option/);
});
