import {
  buildNormalBaseline,
  checksumRaw,
  clearPlaytestData,
  clearPlaytestSession,
  NORMAL_SAVE_KEYS,
  PLAYTEST_SAVE_KEYS,
  PLAYTEST_SESSION_KEY,
  readPlaytestSession,
  readValidatedSavePair,
  type StorageAdapter,
  writeAndValidateSavePair,
  writePlaytestSession,
} from "@/lib/gamePersistence";
import { isPlaytestPresetId } from "@/constants/playtestPresets";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>();
  failSet = new Set<string>();
  failRemove = new Set<string>();

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    if (this.failSet.has(key)) throw new Error(`set failed: ${key}`);
    this.values.set(key, value);
  }

  async removeItem(key: string) {
    if (this.failRemove.has(key)) throw new Error(`remove failed: ${key}`);
    this.values.delete(key);
  }
}

const parse = (raw: string | null) => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return value.ok === true ? value : null;
  } catch {
    return null;
  }
};

describe("game persistence coordinator", () => {
  const session = {
    version: 1 as const,
    presetId: "phase2_capstone_ready" as const,
    startedAt: 123,
    normalBaseline: { primaryHash: "p", backupHash: "b" },
  };

  it("writes backup then primary and validates exact payloads", async () => {
    const storage = new MemoryStorage();
    const payload = JSON.stringify({ ok: true, value: 1 });
    const pair = await writeAndValidateSavePair(
      "playtest",
      payload,
      parse,
      storage,
    );
    expect(pair.primaryRaw).toBe(payload);
    expect(pair.backupRaw).toBe(payload);
    expect(pair.preferred).toEqual({ ok: true, value: 1 });
  });

  it("fails before a caller can create a marker when either copy fails", async () => {
    const storage = new MemoryStorage();
    storage.failSet.add(PLAYTEST_SAVE_KEYS.primary);
    await expect(
      writeAndValidateSavePair(
        "playtest",
        JSON.stringify({ ok: true }),
        parse,
        storage,
      ),
    ).rejects.toThrow();
    expect(storage.values.has(PLAYTEST_SESSION_KEY)).toBe(false);
  });

  it("falls back to a valid backup without accepting corrupt primary", async () => {
    const storage = new MemoryStorage();
    storage.values.set(NORMAL_SAVE_KEYS.primary, "{broken");
    storage.values.set(
      NORMAL_SAVE_KEYS.backup,
      JSON.stringify({ ok: true, source: "backup" }),
    );
    const pair = await readValidatedSavePair("normal", parse, storage);
    expect(pair.primary).toBeNull();
    expect(pair.preferred).toEqual({ ok: true, source: "backup" });
  });

  it("can select a newer valid backup after an interrupted backup-first write", async () => {
    const storage = new MemoryStorage();
    storage.values.set(
      NORMAL_SAVE_KEYS.primary,
      JSON.stringify({ ok: true, savedAt: 100, value: "old" }),
    );
    storage.values.set(
      NORMAL_SAVE_KEYS.backup,
      JSON.stringify({ ok: true, savedAt: 200, value: "new" }),
    );

    const pair = await readValidatedSavePair(
      "normal",
      parse,
      storage,
      (primary, backup) =>
        Number(backup.savedAt) > Number(primary.savedAt) ? "backup" : "primary",
    );

    expect(pair.preferred).toEqual({
      ok: true,
      savedAt: 200,
      value: "new",
    });
  });

  it("produces stable baseline hashes that change with raw bytes", () => {
    const first = buildNormalBaseline({ primaryRaw: "a", backupRaw: "b" });
    const second = buildNormalBaseline({ primaryRaw: "a", backupRaw: "b" });
    expect(first).toEqual(second);
    expect(checksumRaw("a")).not.toBe(checksumRaw("A"));
  });

  it("validates marker shape and clears tester data independently", async () => {
    const storage = new MemoryStorage();
    await writePlaytestSession(session, storage);
    storage.values.set(PLAYTEST_SAVE_KEYS.primary, "primary");
    storage.values.set(PLAYTEST_SAVE_KEYS.backup, "backup");
    await expect(
      readPlaytestSession(isPlaytestPresetId, storage),
    ).resolves.toEqual(session);

    await clearPlaytestSession(storage);
    expect(storage.values.has(PLAYTEST_SESSION_KEY)).toBe(false);
    expect(storage.values.has(PLAYTEST_SAVE_KEYS.primary)).toBe(true);

    await clearPlaytestData(storage);
    expect(storage.values.has(PLAYTEST_SAVE_KEYS.primary)).toBe(false);
    expect(storage.values.has(PLAYTEST_SAVE_KEYS.backup)).toBe(false);
  });

  it("rejects malformed or unknown preset markers", async () => {
    const storage = new MemoryStorage();
    storage.values.set(
      PLAYTEST_SESSION_KEY,
      JSON.stringify({
        version: 1,
        presetId: "not_a_preset",
        startedAt: 1,
        normalBaseline: { primaryHash: null, backupHash: null },
      }),
    );
    await expect(
      readPlaytestSession(isPlaytestPresetId, storage),
    ).resolves.toBeNull();
  });

  it("leaves the active game and marker untouched when the normal-save flush fails", async () => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ ok: true, value: "main" });
    storage.values.set(NORMAL_SAVE_KEYS.primary, original);
    storage.values.set(NORMAL_SAVE_KEYS.backup, original);
    storage.failSet.add(NORMAL_SAVE_KEYS.backup);

    await expect(
      writeAndValidateSavePair(
        "normal",
        JSON.stringify({ ok: true, value: "new" }),
        parse,
        storage,
      ),
    ).rejects.toThrow();
    expect(storage.values.get(NORMAL_SAVE_KEYS.primary)).toBe(original);
    expect(storage.values.has(PLAYTEST_SESSION_KEY)).toBe(false);
  });

  it("recovers from a crash between sandbox validation and marker creation", async () => {
    const storage = new MemoryStorage();
    const normal = JSON.stringify({ ok: true, value: "main" });
    const sandbox = JSON.stringify({ ok: true, value: "scenario" });
    storage.values.set(NORMAL_SAVE_KEYS.primary, normal);
    storage.values.set(NORMAL_SAVE_KEYS.backup, normal);

    await writeAndValidateSavePair("playtest", sandbox, parse, storage);
    // Simulate termination before writePlaytestSession.
    expect(await readPlaytestSession(isPlaytestPresetId, storage)).toBeNull();
    expect(
      (await readValidatedSavePair("normal", parse, storage)).preferredRaw,
    ).toBe(normal);
  });

  it.each([
    ["primary", PLAYTEST_SAVE_KEYS.primary],
    ["backup", PLAYTEST_SAVE_KEYS.backup],
  ] as const)("recovers from a corrupt sandbox %s copy", async (_name, key) => {
    const storage = new MemoryStorage();
    const sandbox = JSON.stringify({ ok: true, value: "scenario" });
    storage.values.set(PLAYTEST_SAVE_KEYS.primary, sandbox);
    storage.values.set(PLAYTEST_SAVE_KEYS.backup, sandbox);
    storage.values.set(key, "{corrupt");

    const pair = await readValidatedSavePair("playtest", parse, storage);
    expect(pair.preferred).toEqual({ ok: true, value: "scenario" });
  });

  it("keeps the marker active when restore cannot clear it", async () => {
    const storage = new MemoryStorage();
    await writePlaytestSession(session, storage);
    storage.values.set(PLAYTEST_SAVE_KEYS.primary, "sandbox");
    storage.values.set(PLAYTEST_SAVE_KEYS.backup, "sandbox");
    storage.failRemove.add(PLAYTEST_SESSION_KEY);

    await expect(clearPlaytestSession(storage)).rejects.toThrow();
    expect(storage.values.has(PLAYTEST_SESSION_KEY)).toBe(true);
    expect(storage.values.has(PLAYTEST_SAVE_KEYS.primary)).toBe(true);
  });

  it("recovers to normal after a crash during post-marker sandbox cleanup", async () => {
    const storage = new MemoryStorage();
    const normal = JSON.stringify({ ok: true, value: "main" });
    storage.values.set(NORMAL_SAVE_KEYS.primary, normal);
    storage.values.set(NORMAL_SAVE_KEYS.backup, normal);
    await writePlaytestSession(session, storage);
    storage.values.set(PLAYTEST_SAVE_KEYS.primary, "sandbox");
    storage.values.set(PLAYTEST_SAVE_KEYS.backup, "sandbox");
    storage.failRemove.add(PLAYTEST_SAVE_KEYS.primary);

    await clearPlaytestSession(storage);
    await expect(clearPlaytestData(storage)).rejects.toThrow();
    expect(await readPlaytestSession(isPlaytestPresetId, storage)).toBeNull();
    expect(
      (await readValidatedSavePair("normal", parse, storage)).preferredRaw,
    ).toBe(normal);
  });

  it("lets production ignore an active tester marker without deleting it", async () => {
    const storage = new MemoryStorage();
    const normal = JSON.stringify({ ok: true, value: "main" });
    storage.values.set(NORMAL_SAVE_KEYS.primary, normal);
    storage.values.set(NORMAL_SAVE_KEYS.backup, normal);
    await writePlaytestSession(session, storage);

    const productionLoad = await readValidatedSavePair(
      "normal",
      parse,
      storage,
    );
    expect(productionLoad.preferredRaw).toBe(normal);
    expect(await readPlaytestSession(isPlaytestPresetId, storage)).toEqual(
      session,
    );
  });

  it("supports reload, scenario replacement, repeated cleanup, and exact baseline equality", async () => {
    const storage = new MemoryStorage();
    const normal = JSON.stringify({ ok: true, value: "main" });
    storage.values.set(NORMAL_SAVE_KEYS.primary, normal);
    storage.values.set(NORMAL_SAVE_KEYS.backup, normal);
    const baseline = buildNormalBaseline(
      await readValidatedSavePair("normal", parse, storage),
    );

    await writeAndValidateSavePair(
      "playtest",
      JSON.stringify({ ok: true, value: "first" }),
      parse,
      storage,
    );
    await writePlaytestSession(
      { ...session, normalBaseline: baseline },
      storage,
    );
    expect(
      await readPlaytestSession(isPlaytestPresetId, storage),
    ).not.toBeNull();

    await writeAndValidateSavePair(
      "playtest",
      JSON.stringify({ ok: true, value: "replacement" }),
      parse,
      storage,
    );
    expect(
      (await readValidatedSavePair("playtest", parse, storage)).preferred,
    ).toEqual({ ok: true, value: "replacement" });

    await clearPlaytestSession(storage);
    await clearPlaytestData(storage);
    await clearPlaytestSession(storage);
    await clearPlaytestData(storage);
    const restored = await readValidatedSavePair("normal", parse, storage);
    expect(restored.primaryRaw).toBe(normal);
    expect(restored.backupRaw).toBe(normal);
    expect(buildNormalBaseline(restored)).toEqual(baseline);
  });
});
