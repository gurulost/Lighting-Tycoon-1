import type { Express, Response } from "express";
import {
  disabledGameSaveHandler,
  GAME_SAVE_DISABLED_PATH,
  GAME_SAVE_DISABLED_RESPONSE,
  healthHandler,
  isDisabledGameSavePath,
  registerRoutes,
  shouldHandleGenericPreflight,
} from "../../server/routes";

function responseMock() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

describe("server route contracts", () => {
  it("returns a stable 410 for disabled cloud saves", () => {
    const response = responseMock();
    disabledGameSaveHandler(
      {} as never,
      response as unknown as Response,
      jest.fn(),
    );
    expect(response.status).toHaveBeenCalledWith(410);
    expect(response.json).toHaveBeenCalledWith(GAME_SAVE_DISABLED_RESPONSE);
  });

  it("returns health without importing database configuration", () => {
    const response = responseMock();
    healthHandler({} as never, response as unknown as Response, jest.fn());
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ status: "ok" });
  });

  it.each(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "returns the stable 410 response for %s",
    (method) => {
      const response = responseMock();
      disabledGameSaveHandler(
        { method } as never,
        response as unknown as Response,
        jest.fn(),
      );
      expect(response.status).toHaveBeenCalledWith(410);
      expect(response.json).toHaveBeenCalledWith(GAME_SAVE_DISABLED_RESPONSE);
    },
  );

  it.each([
    "/api/game",
    "/api/game/session-1",
    "/api/game/session-1/history/latest",
  ])("matches the disabled cloud-save prefix at %s", (path) => {
    expect(isDisabledGameSavePath(path)).toBe(true);
  });

  it.each(["/api/games", "/api/gameish", "/api/other"])(
    "does not intercept unrelated path %s",
    (path) => {
      expect(isDisabledGameSavePath(path)).toBe(false);
    },
  );

  it("sends unrelated preflights through the generic response but preserves API 410s", () => {
    expect(shouldHandleGenericPreflight("OPTIONS", "/api/other")).toBe(true);
    expect(shouldHandleGenericPreflight("OPTIONS", "/api/game")).toBe(false);
    expect(
      shouldHandleGenericPreflight(
        "OPTIONS",
        "/api/game/session-1/history/latest",
      ),
    ).toBe(false);
    expect(shouldHandleGenericPreflight("GET", "/api/other")).toBe(false);
  });

  it("registers one anchored save route for every method and descendant", async () => {
    const app = {
      get: jest.fn(),
      all: jest.fn(),
    } as unknown as Express;
    await registerRoutes(app);
    expect(app.get).toHaveBeenCalledWith("/healthz", healthHandler);
    expect(app.all).toHaveBeenCalledWith(
      GAME_SAVE_DISABLED_PATH,
      disabledGameSaveHandler,
    );
  });
});
