const mockPlayers: {
  volume: number;
  playbackRate: number;
  shouldCorrectPitch: boolean;
  play: jest.Mock;
  pause: jest.Mock;
  seekTo: jest.Mock;
  setPlaybackRate: jest.Mock;
  remove: jest.Mock;
}[] = [];

const mockCreateAudioPlayer = jest.fn(() => {
  const player = {
    volume: 1,
    playbackRate: 1,
    shouldCorrectPitch: false,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    setPlaybackRate: jest.fn(),
    remove: jest.fn(),
  };
  mockPlayers.push(player);
  return player;
});
const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined);
const mockSetIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);

jest.doMock("expo-audio", () => ({
  createAudioPlayer: mockCreateAudioPlayer,
  setAudioModeAsync: mockSetAudioModeAsync,
  setIsAudioActiveAsync: mockSetIsAudioActiveAsync,
}));

const SoundManager = require("@/audio/SoundManager")
  .default as typeof import("@/audio/SoundManager").default;
const { buildSfxAudioMode } =
  require("@/audio/SoundManager") as typeof import("@/audio/SoundManager");
const { SFX } = require("@/audio/sounds") as typeof import("@/audio/sounds");

describe("SoundManager", () => {
  beforeEach(async () => {
    await SoundManager.unload();
    SoundManager.setEnabled(true);
    SoundManager.setMasterVolume(1);
    await SoundManager.setAppActive(true);
    mockPlayers.length = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("configures foreground SFX audio and preloads one player per effect", async () => {
    await SoundManager.init();

    expect(mockSetAudioModeAsync).toHaveBeenCalledWith(
      buildSfxAudioMode("ios"),
    );
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(true);
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(
      Object.keys(SFX).length,
    );
    expect(mockCreateAudioPlayer).toHaveBeenCalledWith(expect.anything(), {
      keepAudioSessionActive: false,
    });
  });

  test("uses a valid iOS mix mode while preserving Android ducking", () => {
    expect(buildSfxAudioMode("ios").interruptionMode).toBe("mixWithOthers");
    expect(buildSfxAudioMode("web").interruptionMode).toBe("mixWithOthers");
    expect(buildSfxAudioMode("android").interruptionMode).toBe("duckOthers");
  });

  test("seeks before replay and applies master and per-play scaling", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    SoundManager.setMasterVolume(0.8);

    await SoundManager.play("spawn", {
      rateScale: 1.2,
      volumeScale: 0.5,
    });

    const player = mockPlayers[0];
    expect(player.shouldCorrectPitch).toBe(true);
    expect(player.setPlaybackRate).toHaveBeenCalledWith(1.2, "medium");
    expect(player.volume).toBeCloseTo(0.14);
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.seekTo.mock.invocationCallOrder[0]).toBeLessThan(
      player.play.mock.invocationCallOrder[0],
    );
  });

  test("retains per-effect cooldown throttling", async () => {
    jest.spyOn(Date, "now").mockReturnValue(2_000);

    await SoundManager.play("error");
    await SoundManager.play("error");

    const errorPlayer = mockPlayers[Object.keys(SFX).indexOf("error")];
    expect(errorPlayer.play).toHaveBeenCalledTimes(1);
  });

  test("pauses players while disabled and suppresses playback", async () => {
    jest.spyOn(Date, "now").mockReturnValue(3_000);
    await SoundManager.init();
    SoundManager.setEnabled(false);

    await SoundManager.play("spawn");

    expect(
      mockPlayers.every((player) => player.pause.mock.calls.length === 1),
    ).toBe(true);
    expect(mockPlayers[0].play).not.toHaveBeenCalled();
  });

  test("tracks app lifecycle and explicitly releases every player", async () => {
    await SoundManager.init();
    await SoundManager.setAppActive(false);
    await SoundManager.play("spawn");

    expect(mockSetIsAudioActiveAsync).toHaveBeenLastCalledWith(false);
    expect(mockPlayers[0].play).not.toHaveBeenCalled();

    await SoundManager.unload();
    expect(
      mockPlayers.every((player) => player.pause.mock.calls.length === 1),
    ).toBe(true);
    expect(
      mockPlayers.every((player) => player.remove.mock.calls.length === 1),
    ).toBe(true);
  });
});
