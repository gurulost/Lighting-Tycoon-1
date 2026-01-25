import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertGameSaveSchema, updateGameSaveSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/game/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const save = await storage.getGameSave(sessionId);
      
      if (!save) {
        return res.status(404).json({ error: "Game save not found" });
      }
      
      return res.json(save);
    } catch (error) {
      console.error("Error fetching game save:", error);
      return res.status(500).json({ error: "Failed to fetch game save" });
    }
  });

  app.post("/api/game", async (req, res) => {
    try {
      const result = insertGameSaveSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid game save data", details: result.error.issues });
      }
      
      const existingSave = await storage.getGameSave(result.data.sessionId);
      if (existingSave) {
        return res.status(409).json({ error: "Game save already exists", save: existingSave });
      }
      
      const save = await storage.createGameSave(result.data);
      return res.status(201).json(save);
    } catch (error) {
      console.error("Error creating game save:", error);
      return res.status(500).json({ error: "Failed to create game save" });
    }
  });

  app.put("/api/game/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = updateGameSaveSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid update data", details: result.error.issues });
      }
      
      const existingSave = await storage.getGameSave(sessionId);
      if (!existingSave) {
        const newSave = await storage.createGameSave({
          sessionId,
          ...result.data,
        } as any);
        return res.status(201).json(newSave);
      }
      
      const updated = await storage.updateGameSave(sessionId, result.data);
      return res.json(updated);
    } catch (error) {
      console.error("Error updating game save:", error);
      return res.status(500).json({ error: "Failed to update game save" });
    }
  });

  app.delete("/api/game/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const deleted = await storage.deleteGameSave(sessionId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Game save not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting game save:", error);
      return res.status(500).json({ error: "Failed to delete game save" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
