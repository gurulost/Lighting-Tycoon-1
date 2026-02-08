const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "assets", "images");

const PART_TIERS = [
  "clip",
  "track",
  "segment",
  "smartkit",
  "premium",
  "array",
  "spine",
  "stack",
  "grid",
  "kingdom",
  "lattice",
  "beacon",
  "nexus",
  "skyline",
  "atlas",
  "legacy",
];
const PART_FAMILIES = ["open", "locked"];

const PART_MAX_BYTES = 200 * 1024;
const MERGE_PARTICLE_MAX_BYTES = 80 * 1024;
const HEADER_ICON_MAX_BYTES = 20 * 1024;

function toRelative(filePath) {
  return path.relative(ROOT, filePath);
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function assertExists(filePath, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing required file: ${toRelative(filePath)}`);
  }
}

function assertMissing(filePath, errors, messagePrefix) {
  if (fs.existsSync(filePath)) {
    errors.push(`${messagePrefix}: ${toRelative(filePath)}`);
  }
}

function assertMaxSize(filePath, maxBytes, errors, label) {
  if (!fs.existsSync(filePath)) return;
  const size = fs.statSync(filePath).size;
  if (size > maxBytes) {
    errors.push(
      `${label} exceeds size budget (${formatKB(size)} > ${formatKB(maxBytes)}): ${toRelative(filePath)}`,
    );
  }
}

function run() {
  const errors = [];

  const requiredPartWebp = [];
  for (const tier of PART_TIERS) {
    for (const family of PART_FAMILIES) {
      requiredPartWebp.push(
        path.join(ASSETS_DIR, `part-${tier}-${family}.webp`),
      );
    }
  }

  for (const filePath of requiredPartWebp) {
    assertExists(filePath, errors);
    assertMaxSize(filePath, PART_MAX_BYTES, errors, "Part sprite");
  }

  const lingeringPartPng = fs
    .readdirSync(ASSETS_DIR)
    .filter((name) => name.startsWith("part-") && name.endsWith(".png"));
  for (const pngName of lingeringPartPng) {
    errors.push(`Part sprites must use .webp only: assets/images/${pngName}`);
  }

  const mergeParticleOpenWebp = path.join(
    ASSETS_DIR,
    "particle-merge-open.webp",
  );
  const mergeParticleLockedWebp = path.join(
    ASSETS_DIR,
    "particle-merge-locked.webp",
  );
  const mergeParticleOpenPng = path.join(ASSETS_DIR, "particle-merge-open.png");
  const mergeParticleLockedPng = path.join(
    ASSETS_DIR,
    "particle-merge-locked.png",
  );

  assertExists(mergeParticleOpenWebp, errors);
  assertExists(mergeParticleLockedWebp, errors);
  assertMissing(
    mergeParticleOpenPng,
    errors,
    "Merge particle PNG should not exist",
  );
  assertMissing(
    mergeParticleLockedPng,
    errors,
    "Merge particle PNG should not exist",
  );
  assertMaxSize(
    mergeParticleOpenWebp,
    MERGE_PARTICLE_MAX_BYTES,
    errors,
    "Merge particle",
  );
  assertMaxSize(
    mergeParticleLockedWebp,
    MERGE_PARTICLE_MAX_BYTES,
    errors,
    "Merge particle",
  );

  const headerIconWebp = path.join(ASSETS_DIR, "icon-header.webp");
  assertExists(headerIconWebp, errors);
  assertMaxSize(headerIconWebp, HEADER_ICON_MAX_BYTES, errors, "Header icon");

  if (errors.length > 0) {
    console.error("Asset guard failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Asset guard passed: ${requiredPartWebp.length} part sprites, 2 merge particles, and 1 header icon validated.`,
  );
}

run();
