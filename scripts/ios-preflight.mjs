import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `Usage: node scripts/ios-preflight.mjs [options]
  --json                    Print a machine-readable report
  --skip-project            Check tools/runtime before prebuild or pod install
  --expect-xcode VERSION    Require an exact Xcode version
  --expect-sdk VERSION      Require an exact Simulator SDK version
  --runtime-version VERSION Select an installed iOS runtime version
  --simulator-id UUID       Require a specific available iOS simulator

Checks only; never installs components, boots devices, or changes signing.
IOS_COCOAPODS_VERSION optionally selects an installed CocoaPods gem version.
`;

export function parseOptions(args) {
  const options = {};
  const values = {
    "--expect-xcode": "expectedXcode",
    "--expect-sdk": "expectedSdk",
    "--runtime-version": "runtimeVersion",
    "--simulator-id": "simulatorId",
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--skip-project") options.skipProject = true;
    else if (arg === "--help") options.help = true;
    else if (
      values[arg] &&
      args[index + 1] &&
      !args[index + 1].startsWith("--")
    ) {
      options[values[arg]] = args[++index];
    } else throw new Error(`Unknown option or missing value: ${arg}`);
  }
  return options;
}

export function selectSimulator(runtimes, devices, requestedId) {
  const available = runtimes
    .filter(
      (runtime) => runtime.isAvailable && runtime.identifier.includes(".iOS-"),
    )
    .flatMap((runtime) =>
      (devices[runtime.identifier] ?? [])
        .filter((device) => device.isAvailable)
        .map((device) => ({
          udid: device.udid,
          name: device.name,
          state: device.state,
          runtime: runtime.version,
        })),
    )
    .sort(
      (left, right) =>
        right.runtime.localeCompare(left.runtime, "en", { numeric: true }) ||
        Number(right.name.startsWith("iPhone")) -
          Number(left.name.startsWith("iPhone")) ||
        left.name.localeCompare(right.name, "en") ||
        left.udid.localeCompare(right.udid, "en"),
    );
  return requestedId
    ? available.find((device) => device.udid === requestedId)
    : available[0];
}

export function commandTimeout(args) {
  // CoreSimulator discovery may initialize its service on a cold CI runner.
  // Keep it bounded, but allow the same budget as Xcode destination discovery.
  return args[0] === "simctl" || args.includes("-showdestinations")
    ? 90_000
    : 30_000;
}

function execute(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: commandTimeout(args),
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, COCOAPODS_DISABLE_STATS: "true" },
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")}: ${result.error?.message ?? ((result.stderr || result.stdout).trim() || `exit ${result.status}`)}`,
    );
  }
  return result.stdout.trim();
}

export function runPreflight(options = {}, dependencies = {}) {
  const run = dependencies.run ?? execute;
  const exists = dependencies.exists ?? existsSync;
  const platform = dependencies.platform ?? process.platform;
  const nodeVersion = dependencies.nodeVersion ?? process.versions.node;
  const root = dependencies.root ?? process.cwd();
  const report = { ok: false, checks: {}, errors: [] };
  const check = (name, action) => {
    try {
      report.checks[name] = action();
    } catch (error) {
      report.errors.push(`${name}: ${error.message}`);
    }
  };
  check("host", () => {
    if (platform !== "darwin")
      throw new Error("Native iOS builds require macOS.");
    return platform;
  });
  check("node", () => {
    if (Number(nodeVersion.split(".")[0]) !== 22)
      throw new Error(`Use Node 22; found ${nodeVersion}.`);
    return nodeVersion;
  });
  if (platform !== "darwin") return report;
  check("developerDirectory", () => run("xcode-select", ["-p"]));
  check("xcode", () => {
    const value = run("xcodebuild", ["-version"]).match(/^Xcode (\S+)/m)?.[1];
    if (!value)
      throw new Error("Full Xcode is not selected; check xcode-select.");
    if (options.expectedXcode && value !== options.expectedXcode) {
      throw new Error(`Expected ${options.expectedXcode}; found ${value}.`);
    }
    return value;
  });
  check("firstLaunchSetup", () => {
    run("xcodebuild", ["-checkFirstLaunchStatus"]);
    return "complete";
  });
  check("simulatorSdk", () => {
    const value = run("xcrun", [
      "--sdk",
      "iphonesimulator",
      "--show-sdk-version",
    ]);
    if (options.expectedSdk && value !== options.expectedSdk) {
      throw new Error(`Expected ${options.expectedSdk}; found ${value}.`);
    }
    return value;
  });
  check("cocoaPods", () => {
    const version = process.env.IOS_COCOAPODS_VERSION;
    return run("pod", [...(version ? [`_${version}_`] : []), "--version"]);
  });
  check("simulator", () => {
    const { runtimes } = JSON.parse(
      run("xcrun", ["simctl", "list", "runtimes", "--json"]),
    );
    const { devices } = JSON.parse(
      run("xcrun", ["simctl", "list", "devices", "available", "--json"]),
    );
    const matchingRuntimes = options.runtimeVersion
      ? runtimes.filter((runtime) => runtime.version === options.runtimeVersion)
      : runtimes;
    const simulator = selectSimulator(
      matchingRuntimes,
      devices,
      options.simulatorId,
    );
    if (!simulator)
      throw new Error(
        "No matching available iOS simulator. Install a runtime and create a device in Xcode.",
      );
    return simulator;
  });
  if (!options.skipProject) {
    check("nativeDependencies", () => {
      if (!exists(resolve(root, "ios/Pods/Manifest.lock"))) {
        throw new Error(
          "CocoaPods dependencies are missing. Run pod install in ios/ first.",
        );
      }
      return "installed";
    });
    check("projectDestination", () => {
      const workspace = resolve(root, "ios/LightingTycoon.xcworkspace");
      if (!exists(workspace))
        throw new Error(
          "Workspace missing. Run Expo iOS prebuild and pod install first.",
        );
      if (!report.checks.simulator)
        throw new Error("Simulator availability must pass first.");
      const destinations = run("xcodebuild", [
        "-workspace",
        workspace,
        "-scheme",
        "LightingTycoon",
        "-showdestinations",
      ]);
      const target = report.checks.simulator.udid;
      const eligible = destinations.split(/Ineligible destinations/i)[0];
      if (!eligible.includes(target)) {
        throw new Error(
          `Simulator ${target} is not an eligible build destination. ${destinations}`,
        );
      }
      return { scheme: "LightingTycoon", simulatorId: target };
    });
  }
  report.ok = report.errors.length === 0;
  return report;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const options = parseOptions(process.argv.slice(2));
    if (options.help) console.log(HELP);
    else {
      const report = runPreflight(options);
      if (options.json) console.log(JSON.stringify(report, null, 2));
      else {
        console.log(`iOS preflight: ${report.ok ? "PASS" : "FAIL"}`);
        for (const [name, value] of Object.entries(report.checks)) {
          console.log(
            `  ${name}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
          );
        }
        for (const error of report.errors) console.error(`  ${error}`);
      }
      process.exitCode = report.ok ? 0 : 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
