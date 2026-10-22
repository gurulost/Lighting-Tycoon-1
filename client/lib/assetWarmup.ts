/** Serial, cancellable warmup: visible gameplay always gets the first frame. */
export function createAssetWarmup<T>(
  sources: readonly T[],
  load: (source: T) => Promise<unknown>,
  gapMs = 50,
) {
  let cursor = 0;
  let active = false;
  let disposed = false;
  let loading = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (!active || disposed || loading || timer || cursor >= sources.length)
      return;
    timer = setTimeout(() => {
      timer = undefined;
      if (!active || disposed) return;
      loading = true;
      const source = sources[cursor++];
      void Promise.resolve()
        .then(() => load(source))
        .catch(() => undefined)
        .finally(() => {
          loading = false;
          schedule();
        });
    }, gapMs);
  };
  const pause = () => {
    active = false;
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  return {
    resume() {
      if (!disposed) {
        active = true;
        schedule();
      }
    },
    pause,
    dispose() {
      disposed = true;
      pause();
    },
  };
}
