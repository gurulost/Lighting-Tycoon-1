import { Audio } from "expo-av";

import { SFX, SfxId } from "./sounds";

type SoundInstance = {
  sound: Audio.Sound;
  volume: number;
  cooldownMs: number;
};

class SoundManager {
  private static initialized = false;
  private static enabled = true;
  private static masterVolume = 1;
  private static sounds = new Map<SfxId, SoundInstance>();
  private static lastPlayedAt = new Map<SfxId, number>();
  private static recentPlays: number[] = [];
  private static maxPlaysInWindow = 6;
  private static windowMs = 220;

  static async init() {
    if (this.initialized) return;
    this.initialized = true;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      await this.preload();
    } catch (error) {
      console.warn("SoundManager init failed", error);
    }
  }

  static setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.sounds.forEach(async ({ sound }) => {
        try {
          await sound.stopAsync();
        } catch {
          return;
        }
      });
    }
  }

  static setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  static async preload() {
    const entries = Object.entries(SFX) as [SfxId, (typeof SFX)[SfxId]][];
    await Promise.all(
      entries.map(async ([id, config]) => {
        if (this.sounds.has(id)) return;
        try {
          const { sound } = await Audio.Sound.createAsync(config.file, {
            shouldPlay: false,
            volume: config.volume,
          });
          this.sounds.set(id, {
            sound,
            volume: config.volume,
            cooldownMs: config.cooldownMs ?? 80,
          });
        } catch (error) {
          console.warn(`Failed to load sound ${id}`, error);
        }
      }),
    );
  }

  static async play(id: SfxId) {
    if (!this.initialized) {
      await this.init();
    }
    if (!this.enabled) return;
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
        const { sound } = await Audio.Sound.createAsync(SFX[id].file, {
          shouldPlay: false,
          volume: SFX[id].volume,
        });
        this.sounds.set(id, {
          sound,
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
      const rate =
        rateRange && rateRange.length === 2
          ? Math.random() * (rateRange[1] - rateRange[0]) + rateRange[0]
          : 1;
      const volume = instance.volume * this.masterVolume;
      await instance.sound.setRateAsync(rate, true);
      await instance.sound.setVolumeAsync(volume);
      await instance.sound.replayAsync();
    } catch (error) {
      console.warn(`Failed to play sound ${id}`, error);
    }
  }

  static async unload() {
    const unloads = Array.from(this.sounds.values()).map(async ({ sound }) => {
      try {
        await sound.unloadAsync();
      } catch {
        return;
      }
    });
    await Promise.all(unloads);
    this.sounds.clear();
    this.lastPlayedAt.clear();
    this.initialized = false;
  }
}

export default SoundManager;
