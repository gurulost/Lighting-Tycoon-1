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
  private static sounds = new Map<SfxId, SoundInstance>();
  private static lastPlayedAt = new Map<SfxId, number>();

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
      })
    );
  }

  static async play(id: SfxId) {
    if (!this.initialized) {
      await this.init();
    }
    if (!this.enabled) return;
    const now = Date.now();
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
    try {
      await instance.sound.setVolumeAsync(instance.volume);
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
