import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioMode,
  type AudioPlayer,
} from "expo-audio";
import { Platform } from "react-native";

import { SFX, SfxId } from "./sounds";

type SoundInstance = {
  player: AudioPlayer;
  volume: number;
  cooldownMs: number;
};

export type SoundPlayOptions = {
  rateScale?: number;
  volumeScale?: number;
};

export function buildSfxAudioMode(platform: string): Partial<AudioMode> {
  return {
    allowsRecording: false,
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    // expo-audio rejects silent-mode-off + ducking on iOS. Preserve Android's
    // existing ducking behavior while letting short iOS/web SFX mix safely.
    interruptionMode: platform === "android" ? "duckOthers" : "mixWithOthers",
    shouldRouteThroughEarpiece: false,
  };
}

class SoundManager {
  private static initialized = false;
  private static enabled = true;
  private static appActive = true;
  private static masterVolume = 0.8;
  private static sounds = new Map<SfxId, SoundInstance>();
  private static lastPlayedAt = new Map<SfxId, number>();
  private static recentPlays: number[] = [];
  private static maxPlaysInWindow = 6;
  private static windowMs = 220;

  static async init() {
    if (this.initialized) return;
    this.initialized = true;
    try {
      await setAudioModeAsync(buildSfxAudioMode(Platform.OS));
      await setIsAudioActiveAsync(this.appActive);
      await this.preload();
    } catch (error) {
      this.initialized = false;
      console.warn("SoundManager init failed", error);
    }
  }

  static setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.sounds.forEach(({ player }) => {
        try {
          player.pause();
          void player.seekTo(0).catch(() => undefined);
        } catch {
          return;
        }
      });
    }
  }

  static setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  static async setAppActive(active: boolean) {
    this.appActive = active;
    if (!this.initialized) return;
    try {
      await setIsAudioActiveAsync(active);
    } catch (error) {
      console.warn("Failed to update audio lifecycle state", error);
    }
  }

  static async preload() {
    const entries = Object.entries(SFX) as [SfxId, (typeof SFX)[SfxId]][];
    entries.forEach(([id, config]) => {
      if (this.sounds.has(id)) return;
      try {
        const player = createAudioPlayer(config.file, {
          keepAudioSessionActive: false,
        });
        player.volume = config.volume;
        this.sounds.set(id, {
          player,
          volume: config.volume,
          cooldownMs: config.cooldownMs ?? 80,
        });
      } catch (error) {
        console.warn(`Failed to load sound ${id}`, error);
      }
    });
  }

  static async play(id: SfxId, options: SoundPlayOptions = {}) {
    if (!this.initialized) {
      await this.init();
    }
    if (!this.enabled || !this.appActive) return;
    const now = Date.now();
    this.recentPlays = this.recentPlays.filter((t) => now - t < this.windowMs);
    if (this.recentPlays.length >= this.maxPlaysInWindow) return;
    this.recentPlays.push(now);
    const lastPlayed = this.lastPlayedAt.get(id) ?? 0;
    const cooldownMs = SFX[id]?.cooldownMs ?? 80;
    if (now - lastPlayed < cooldownMs) return;
    this.lastPlayedAt.set(id, now);

    if (!this.sounds.has(id)) {
      try {
        const player = createAudioPlayer(SFX[id].file, {
          keepAudioSessionActive: false,
        });
        this.sounds.set(id, {
          player,
          volume: SFX[id].volume,
          cooldownMs,
        });
      } catch (error) {
        console.warn(`Failed to load sound ${id}`, error);
        return;
      }
    }

    const instance = this.sounds.get(id);
    if (!instance) return;
    const config = SFX[id];
    try {
      const rateRange = config.rateRange;
      const randomizedRate =
        rateRange && rateRange.length === 2
          ? Math.random() * (rateRange[1] - rateRange[0]) + rateRange[0]
          : 1;
      const rate = Math.max(
        0.1,
        Math.min(2, randomizedRate * (options.rateScale ?? 1)),
      );
      const volume = Math.max(
        0,
        Math.min(
          1,
          instance.volume * this.masterVolume * (options.volumeScale ?? 1),
        ),
      );
      instance.player.shouldCorrectPitch = true;
      instance.player.setPlaybackRate(rate, "medium");
      instance.player.volume = volume;
      await instance.player.seekTo(0);
      instance.player.play();
    } catch (error) {
      console.warn(`Failed to play sound ${id}`, error);
    }
  }

  static async unload() {
    this.sounds.forEach(({ player }) => {
      try {
        player.pause();
        player.remove();
      } catch {
        return;
      }
    });
    this.sounds.clear();
    this.lastPlayedAt.clear();
    this.recentPlays = [];
    this.initialized = false;
  }
}

export default SoundManager;
