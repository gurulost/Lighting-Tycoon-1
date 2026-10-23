import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { verifyDeployment } from "./verify-deployment.mjs";

function response(url, { method }) {
  const health = url.pathname === "/api/healthz";
  return new Response(
    method === "HEAD"
      ? null
      : JSON.stringify(
          health
            ? { status: "ok" }
            : {
                error: "Cloud saves are disabled; progress is stored locally.",
              },
        ),
    { status: health ? 200 : 410, headers: { "cache-control": "no-store" } },
  );
}

test("checks the explicit hosted health path and all disabled-save methods", async () => {
  const calls = [];
  const result = await verifyDeployment("https://example.com", {
    fetchImpl: async (url, init) => {
      assert.equal(init.redirect, "error");
      assert.ok(init.signal instanceof AbortSignal);
      calls.push([url.pathname, init.method]);
      return response(url, init);
    },
  });
  assert.equal(result.origin, "https://example.com");
  assert.equal(result.checks.length, 16);
  assert.deepEqual(calls.slice(0, 2), [
    ["/api/healthz", "GET"],
    ["/api/healthz", "HEAD"],
  ]);
  assert.equal(calls.filter(([, method]) => method === "HEAD").length, 3);
  assert.ok(calls.every(([path]) => path !== "/healthz/"));
});

test(
  "starts the actual server and checks real HTTP without DATABASE_URL",
  { timeout: 15_000 },
  async (t) => {
    const reservation = createServer();
    await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
    const port = reservation.address().port;
    await new Promise((resolve) => reservation.close(resolve));
    const env = { ...process.env, NODE_ENV: "production", PORT: String(port) };
    delete env.DATABASE_URL;
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "server/index.ts"],
      {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    t.after(async () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      const timer = setTimeout(() => child.kill("SIGKILL"), 2000);
      try {
        await exited;
      } finally {
        clearTimeout(timer);
      }
    });
    await new Promise((resolve, reject) => {
      let output = "";
      const timer = setTimeout(
        () => reject(new Error("Server startup timed out")),
        10_000,
      );
      const finish = (error) => {
        clearTimeout(timer);
        child.off("error", finish);
        child.off("exit", earlyExit);
        if (error) reject(error);
        else resolve();
      };
      const earlyExit = (code) =>
        finish(new Error(`Server exited before readiness (${code})`));
      child.once("error", finish);
      child.once("exit", earlyExit);
      child.stdout.on("data", (chunk) => {
        output = (output + chunk.toString()).slice(-16_384);
        if (output.includes(`express server serving on port ${port}`)) finish();
      });
      child.stderr.resume();
    });
    const base = `http://127.0.0.1:${port}`;
    const result = await verifyDeployment(base);
    assert.equal(result.checks.length, 16);
    const legacy = await fetch(`${base}/healthz`);
    assert.equal(legacy.status, 200);
    assert.deepEqual(await legacy.json(), { status: "ok" });
    assert.equal(legacy.headers.get("cache-control"), "no-store");
  },
);

for (const [name, value] of [
  ["non-HTTP protocol", "file:///tmp/test"],
  ["credentials", "https://user:password@example.com"],
  ["path", "https://example.com/path"],
  ["query", "https://example.com/?key=private"],
  ["fragment", "https://example.com/#fragment"],
]) {
  test(`rejects origin ${name} before issuing requests`, async () => {
    await assert.rejects(
      verifyDeployment(value, {
        fetchImpl: () => assert.fail("must not issue a request"),
      }),
      /HTTP\(S\) origin/,
    );
  });
}

for (const [name, fetchImpl, expected] of [
  ["upstream 404", async () => new Response("missing", { status: 404 }), /404/],
  [
    "incorrect body",
    async () =>
      new Response('{"status":"not-ok"}', {
        headers: { "cache-control": "no-store" },
      }),
    /unexpected response contract/,
  ],
  ["cacheable health", async () => new Response('{"status":"ok"}'), /no-store/],
  [
    "lookalike cache directive",
    async () =>
      new Response('{"status":"ok"}', {
        headers: { "cache-control": "no-store-ish" },
      }),
    /no-store/,
  ],
  [
    "non-JSON health",
    async () =>
      new Response("<html>sign in</html>", {
        headers: { "cache-control": "no-store" },
      }),
    /not JSON/,
  ],
  [
    "network failure",
    async () => {
      throw new Error("network unavailable");
    },
    /network unavailable/,
  ],
]) {
  test(`fails closed on ${name}`, async () => {
    await assert.rejects(
      verifyDeployment("https://example.com", { fetchImpl }),
      expected,
    );
  });
}

test("does not accept a health-only deployment with enabled cloud saves", async () => {
  await assert.rejects(
    verifyDeployment("https://example.com", {
      fetchImpl: async (url, init) =>
        url.pathname === "/api/healthz"
          ? response(url, init)
          : new Response("{}", { status: 200 }),
    }),
    /expected 410, received 200/,
  );
});

test("requires the stable disabled-save explanation, not only status 410", async () => {
  await assert.rejects(
    verifyDeployment("https://example.com", {
      fetchImpl: async (url, init) =>
        url.pathname === "/api/healthz"
          ? response(url, init)
          : new Response('{"error":"different contract"}', { status: 410 }),
    }),
    /unexpected response contract/,
  );
});

test("rejects an unexpected HEAD response body", async () => {
  await assert.rejects(
    verifyDeployment("https://example.com", {
      fetchImpl: async (url, init) =>
        init.method === "HEAD"
          ? new Response("{}", { headers: { "cache-control": "no-store" } })
          : response(url, init),
    }),
    /HEAD .*unexpected response body/,
  );
});
