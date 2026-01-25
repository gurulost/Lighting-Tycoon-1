import { type User, type InsertUser, type GameSave, type InsertGameSave, type UpdateGameSave, users, gameSaves } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getGameSave(sessionId: string): Promise<GameSave | undefined>;
  createGameSave(save: InsertGameSave): Promise<GameSave>;
  updateGameSave(sessionId: string, save: UpdateGameSave): Promise<GameSave | undefined>;
  deleteGameSave(sessionId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getGameSave(sessionId: string): Promise<GameSave | undefined> {
    const [save] = await db.select().from(gameSaves).where(eq(gameSaves.sessionId, sessionId));
    return save || undefined;
  }

  async createGameSave(save: InsertGameSave): Promise<GameSave> {
    const [gameSave] = await db
      .insert(gameSaves)
      .values(save)
      .returning();
    return gameSave;
  }

  async updateGameSave(sessionId: string, save: UpdateGameSave): Promise<GameSave | undefined> {
    const [updated] = await db
      .update(gameSaves)
      .set({ ...save, updatedAt: new Date() })
      .where(eq(gameSaves.sessionId, sessionId))
      .returning();
    return updated || undefined;
  }

  async deleteGameSave(sessionId: string): Promise<boolean> {
    const result = await db
      .delete(gameSaves)
      .where(eq(gameSaves.sessionId, sessionId))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
