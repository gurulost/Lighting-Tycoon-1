import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PlaytestPresetId } from "@/constants/playtestPresets";

export const NORMAL_SAVE_KEYS = {
  primary: "lighting_tycoon_state_v1",
  backup: "lighting_tycoon_state_v1_backup",
} as const;

export const PLAYTEST_SAVE_KEYS = {
  primary: "lighting_tycoon_playtest_state_v1",
  backup: "lighting_tycoon_playtest_state_v1_backup",
} as const;

export const PLAYTEST_SESSION_KEY = "lighting_tycoon_playtest_session_v1";

export type SaveDestination = "normal" | "playtest";

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface PlaytestNormalBaseline {
  primaryHash: string | null;
  backupHash: string | null;
}

export interface PersistedPlaytestSession {
  version: 1;
  presetId: PlaytestPresetId;
  startedAt: number;
  normalBaseline: PlaytestNormalBaseline;
}

export interface ValidatedSavePair<T> {
  primaryRaw: string | null;
  backupRaw: string | null;
  primary: T | null;
  backup: T | null;
  preferred: T | null;
  preferredRaw: string | null;
}

export type SavePairSelector<T> = (
  primary: T,
  backup: T,
) => "primary" | "backup";

export const gameStorage: StorageAdapter = AsyncStorage;

function keysFor(destination: SaveDestination) {
  return destination === "playtest" ? PLAYTEST_SAVE_KEYS : NORMAL_SAVE_KEYS;
}

export function checksumRaw(value: string | null): string | null {
  if (value === null) return null;
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${value.length}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function readValidatedSavePair<T>(
  destination: SaveDestination,
  parse: (raw: string | null) => T | null,
  storage: StorageAdapter = gameStorage,
  selectPreferred?: SavePairSelector<T>,
): Promise<ValidatedSavePair<T>> {
  const keys = keysFor(destination);
  const [primaryRaw, backupRaw] = await Promise.all([
    storage.getItem(keys.primary),
    storage.getItem(keys.backup),
  ]);
  const primary = parse(primaryRaw);
  const backup = parse(backupRaw);
  const preferredSource =
    primary && backup
      ? (selectPreferred?.(primary, backup) ?? "primary")
      : primary
        ? "primary"
        : backup
          ? "backup"
          : null;
  return {
    primaryRaw,
    backupRaw,
    primary,
    backup,
    preferred:
      preferredSource === "backup"
        ? backup
        : preferredSource === "primary"
          ? primary
          : null,
    preferredRaw:
      preferredSource === "backup"
        ? backupRaw
        : preferredSource === "primary"
          ? primaryRaw
          : null,
  };
}

export async function writeAndValidateSavePair<T>(
  destination: SaveDestination,
  payload: string,
  parse: (raw: string | null) => T | null,
  storage: StorageAdapter = gameStorage,
  selectPreferred?: SavePairSelector<T>,
): Promise<ValidatedSavePair<T>> {
  const keys = keysFor(destination);
  await storage.setItem(keys.backup, payload);
  await storage.setItem(keys.primary, payload);
  const pair = await readValidatedSavePair(
    destination,
    parse,
    storage,
    selectPreferred,
  );
  if (
    pair.primaryRaw !== payload ||
    pair.backupRaw !== payload ||
    !pair.primary ||
    !pair.backup
  ) {
    throw new Error(`Failed to validate ${destination} save copies`);
  }
  return pair;
}

export function buildNormalBaseline(
  pair: Pick<ValidatedSavePair<unknown>, "primaryRaw" | "backupRaw">,
): PlaytestNormalBaseline {
  return {
    primaryHash: checksumRaw(pair.primaryRaw),
    backupHash: checksumRaw(pair.backupRaw),
  };
}

export async function readPlaytestSession(
  isPresetId: (value: unknown) => value is PlaytestPresetId,
  storage: StorageAdapter = gameStorage,
): Promise<PersistedPlaytestSession | null> {
  const raw = await storage.getItem(PLAYTEST_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedPlaytestSession>;
    if (
      parsed.version !== 1 ||
      !isPresetId(parsed.presetId) ||
      typeof parsed.startedAt !== "number" ||
      !Number.isFinite(parsed.startedAt) ||
      !parsed.normalBaseline ||
      (parsed.normalBaseline.primaryHash !== null &&
        typeof parsed.normalBaseline.primaryHash !== "string") ||
      (parsed.normalBaseline.backupHash !== null &&
        typeof parsed.normalBaseline.backupHash !== "string")
    ) {
      return null;
    }
    return parsed as PersistedPlaytestSession;
  } catch {
    return null;
  }
}

export async function writePlaytestSession(
  session: PersistedPlaytestSession,
  storage: StorageAdapter = gameStorage,
) {
  await storage.setItem(PLAYTEST_SESSION_KEY, JSON.stringify(session));
}

export async function clearPlaytestSession(
  storage: StorageAdapter = gameStorage,
) {
  await storage.removeItem(PLAYTEST_SESSION_KEY);
}

export async function clearPlaytestData(storage: StorageAdapter = gameStorage) {
  await storage.removeItem(PLAYTEST_SAVE_KEYS.primary);
  await storage.removeItem(PLAYTEST_SAVE_KEYS.backup);
}
