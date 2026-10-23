import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const disabledMessage = "Cloud saves are disabled; progress is stored locally.";
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

export async function verifyDeployment(
  value,
  { fetchImpl = fetch, timeoutMs = 10_000 } = {},
) {
  const origin = new URL(value);
  if (
    !["https:", "http:"].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error("Provide an HTTP(S) origin without credentials or a path.");
  }
  const checks = [];
  async function check(path, method, status, expectedBody) {
    const response = await fetchImpl(new URL(path, origin), {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status !== status) {
      throw new Error(
        `${method} ${path}: expected ${status}, received ${response.status}`,
      );
    }
    if (path === "/api/healthz") {
      if (
        !response.headers
          .get("cache-control")
          ?.split(",")
          .some((directive) => directive.trim().toLowerCase() === "no-store")
      ) {
        throw new Error(`${method} ${path}: missing no-store cache policy`);
      }
    }
    const body = await response.text();
    if (method === "HEAD") {
      if (body !== "")
        throw new Error(`HEAD ${path}: unexpected response body`);
    } else {
      let json;
      try {
        json = JSON.parse(body);
      } catch {
        throw new Error(`${method} ${path}: response is not JSON`);
      }
      const [key, value] = Object.entries(expectedBody)[0];
      if (Object.keys(json ?? {}).length !== 1 || json?.[key] !== value) {
        throw new Error(`${method} ${path}: unexpected response contract`);
      }
    }
    checks.push({ method, path, status: response.status });
  }
  for (const method of ["GET", "HEAD"]) {
    await check("/api/healthz", method, 200, { status: "ok" });
  }
  for (const path of ["/api/game", "/api/game/deployment-contract-check"]) {
    for (const method of methods) {
      await check(path, method, 410, { error: disabledMessage });
    }
  }
  return { origin: origin.origin, checks };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.length !== 3) {
      throw new Error(
        "Usage: node scripts/verify-deployment.mjs https://app.example",
      );
    }
    console.log(
      JSON.stringify(await verifyDeployment(process.argv[2]), null, 2),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
