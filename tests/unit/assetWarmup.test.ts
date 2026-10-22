import { createAssetWarmup } from "@/lib/assetWarmup";

describe("asset warmup scheduling", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it("loads serially, pauses in background, and resumes from its cursor", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    const warmup = createAssetWarmup([1, 2, 3], load);
    warmup.resume();
    await jest.advanceTimersByTimeAsync(50);
    expect(load.mock.calls).toEqual([[1]]);
    warmup.pause();
    await jest.advanceTimersByTimeAsync(1000);
    expect(load).toHaveBeenCalledTimes(1);
    warmup.resume();
    await jest.advanceTimersByTimeAsync(100);
    expect(load.mock.calls).toEqual([[1], [2], [3]]);
    expect(jest.getTimerCount()).toBe(0);
  });
  it("does not continue after unmount, including after an in-flight load", async () => {
    let resolve!: () => void;
    const load = jest.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const warmup = createAssetWarmup([1, 2], load);
    warmup.resume();
    await jest.advanceTimersByTimeAsync(50);
    warmup.dispose();
    resolve();
    await jest.advanceTimersByTimeAsync(1000);
    warmup.resume();
    await jest.advanceTimersByTimeAsync(1000);
    expect(load).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
  it("continues after a failed optional asset without an unhandled rejection", async () => {
    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error("missing"))
      .mockResolvedValue(undefined);
    const warmup = createAssetWarmup([1, 2], load);
    warmup.resume();
    await jest.advanceTimersByTimeAsync(100);
    expect(load.mock.calls).toEqual([[1], [2]]);
  });
});
