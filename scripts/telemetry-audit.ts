import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { TELEMETRY_EVENT_NAMES } from "../client/lib/telemetryCatalog";

const ROOT = path.resolve(__dirname, "..");
const CLIENT_DIR = path.join(ROOT, "client");
const TELEMETRY_DOC_PATH = path.join(ROOT, "docs", "telemetry.md");

function walkFiles(dir: string, collector: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      walkFiles(full, collector);
      continue;
    }
    if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      collector.push(full);
    }
  }
}

function extractCodeEventNames(content: string) {
  const names = new Set<string>();
  const regex = /captureEvent\(\s*["'`]([a-z0-9_]+)["'`]/g;
  let match: RegExpExecArray | null = regex.exec(content);
  while (match) {
    names.add(match[1]);
    match = regex.exec(content);
  }
  return names;
}

function extractDocEventNames(content: string) {
  const names = new Set<string>();
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*-\s+`([a-z0-9_]+)`/);
    if (!match) return;
    names.add(match[1]);
  });
  return names;
}

function toSortedArray(values: Set<string>) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function printSection(title: string, values: string[]) {
  if (values.length === 0) return;
  console.log(`\n${title}`);
  values.forEach((value) => {
    console.log(`- ${value}`);
  });
}

const files: string[] = [];
walkFiles(CLIENT_DIR, files);

const codeEvents = new Set<string>();
files.forEach((filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const names = extractCodeEventNames(content);
  names.forEach((name) => codeEvents.add(name));
});

const catalogEvents = new Set<string>(TELEMETRY_EVENT_NAMES);

const docContent = fs.readFileSync(TELEMETRY_DOC_PATH, "utf8");
const docEvents = extractDocEventNames(docContent);

const unknownInCode = toSortedArray(
  new Set([...codeEvents].filter((name) => !catalogEvents.has(name))),
);
const unusedInCatalog = toSortedArray(
  new Set([...catalogEvents].filter((name) => !codeEvents.has(name))),
);
const missingInDocs = toSortedArray(
  new Set([...catalogEvents].filter((name) => !docEvents.has(name))),
);
const unknownInDocs = toSortedArray(
  new Set([...docEvents].filter((name) => !catalogEvents.has(name))),
);

console.log("Telemetry audit summary");
console.log(`- Code events: ${codeEvents.size}`);
console.log(`- Catalog events: ${catalogEvents.size}`);
console.log(`- Doc events: ${docEvents.size}`);

printSection("Code events not in catalog (fix required):", unknownInCode);
printSection("Catalog events not used in code:", unusedInCatalog);
printSection("Catalog events missing from docs (fix required):", missingInDocs);
printSection("Doc events not in catalog (fix required):", unknownInDocs);

if (
  unknownInCode.length > 0 ||
  missingInDocs.length > 0 ||
  unknownInDocs.length > 0
) {
  console.error("\nTelemetry audit failed.");
  process.exit(1);
}

console.log("\nTelemetry audit passed.");
