import { getGameplayHudLayout } from "@/lib/gameplayLayout";

it("reflows phone toolbars without forcing wide tablets into a tall column", () => {
  expect(getGameplayHudLayout(390, 844, 1).stackToolbar).toBe(true);
  expect(getGameplayHudLayout(768, 1024, 3.1).stackToolbar).toBe(false);
  expect(getGameplayHudLayout(507, 900, 3.1).stackToolbar).toBe(true);
});

it("starts short maximum-text windows with the optional HUD collapsed", () => {
  expect(getGameplayHudLayout(844, 390, 3.1).collapseByDefault).toBe(true);
  expect(getGameplayHudLayout(320, 568, 3.1).collapseByDefault).toBe(true);
  expect(getGameplayHudLayout(390, 844, 3.1).collapseByDefault).toBe(false);
  expect(getGameplayHudLayout(844, 390, 1).collapseByDefault).toBe(false);
});

it("bounds scrollable details independently of content text height", () => {
  expect(getGameplayHudLayout(320, 390, 3.1).detailsMaxHeight).toBe(100);
  expect(getGameplayHudLayout(1024, 1366, 3.1).detailsMaxHeight).toBe(260);
});
