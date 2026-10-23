import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "node:http";

export const GAME_SAVE_DISABLED_RESPONSE = {
  error: "Cloud saves are disabled; progress is stored locally.",
} as const;

export const GAME_SAVE_DISABLED_PATH = /^\/api\/game(?:\/.*)?$/;

export function isDisabledGameSavePath(path: string) {
  return GAME_SAVE_DISABLED_PATH.test(path);
}

export function shouldHandleGenericPreflight(method: string, path: string) {
  return method === "OPTIONS" && !isDisabledGameSavePath(path);
}

export const disabledGameSaveHandler: RequestHandler = (_req, res) => {
  return res.status(410).json(GAME_SAVE_DISABLED_RESPONSE);
};

export const healthHandler: RequestHandler = (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ status: "ok" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Keep the original route, but use the API path for hosted probes: the
  // current Replit edge intercepts bare /healthz before it reaches Express.
  app.get("/api/healthz", healthHandler);
  app.get("/healthz", healthHandler);
  app.all(GAME_SAVE_DISABLED_PATH, disabledGameSaveHandler);

  return createServer(app);
}
