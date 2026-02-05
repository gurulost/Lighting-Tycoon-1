import process from "node:process";

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function printLine(
  key,
  value,
  purpose,
  { required = false, defaultValue } = {},
) {
  if (isPresent(value)) {
    console.log(`- ${key}: set (${purpose})`);
    return true;
  }
  if (required) {
    console.log(`- ${key}: missing (${purpose})`);
    return false;
  }
  const defaultNote =
    typeof defaultValue === "string" && defaultValue.length > 0
      ? `, default=${defaultValue}`
      : "";
  console.log(`- ${key}: not set (${purpose}${defaultNote})`);
  return true;
}

console.log("Telemetry doctor");
console.log(
  "- Loaded env via current process (use `npm run with:env -- ...`).",
);
console.log("- Secrets are expected in `.env.local` (gitignored).");

printLine(
  "EXPO_PUBLIC_POSTHOG_KEY",
  process.env.EXPO_PUBLIC_POSTHOG_KEY,
  "client event ingestion",
);
printLine(
  "EXPO_PUBLIC_POSTHOG_HOST",
  process.env.EXPO_PUBLIC_POSTHOG_HOST,
  "client ingestion host",
  { defaultValue: "https://us.i.posthog.com" },
);
printLine(
  "POSTHOG_PERSONAL_API_KEY",
  process.env.POSTHOG_PERSONAL_API_KEY,
  "server-side querying (HogQL/API)",
);
printLine(
  "POSTHOG_PROJECT_ID",
  process.env.POSTHOG_PROJECT_ID,
  "server-side querying project scope",
);
printLine(
  "POSTHOG_API_HOST",
  process.env.POSTHOG_API_HOST,
  "server-side API host",
  {
    defaultValue: "https://us.posthog.com",
  },
);

const queryReady =
  isPresent(process.env.POSTHOG_PERSONAL_API_KEY) &&
  isPresent(process.env.POSTHOG_PROJECT_ID);

if (!queryReady) {
  console.log(
    "- Query readiness: missing POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID",
  );
  process.exitCode = 1;
} else {
  const resolvedHost = process.env.POSTHOG_API_HOST || "https://us.posthog.com";
  console.log(`- Query readiness: ready (host=${resolvedHost})`);
}
