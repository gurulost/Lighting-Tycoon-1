/** Layout policy only; never changes gameplay or persisted preferences. */
export function getGameplayHudLayout(
  width: number,
  height: number,
  fontScale: number,
) {
  const largeText = fontScale >= 1.5;
  return {
    largeText,
    stackToolbar: width < (largeText ? 720 : 520),
    collapseByDefault: largeText && height < 600,
    detailsMaxHeight: Math.max(100, Math.min(260, height * 0.24)),
  };
}
