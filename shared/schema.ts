import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameSaves = pgTable("game_saves", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  cash: integer("cash").notNull().default(50),
  reputation: integer("reputation").notNull().default(0),
  research: integer("research").notNull().default(0),
  dependency: integer("dependency").notNull().default(0),
  boardState: jsonb("board_state").notNull().default([]),
  unlockedSlots: jsonb("unlocked_slots").notNull().default([]),
  upgrades: jsonb("upgrades").notNull().default({}),
  rdNodes: jsonb("rd_nodes").notNull().default({}),
  freedomControllerCount: integer("freedom_controller_count")
    .notNull()
    .default(0),
  maxOrders: integer("max_orders").notNull().default(2),
  tutorialComplete: boolean("tutorial_complete").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameSaveSchema = createInsertSchema(gameSaves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGameSaveSchema = insertGameSaveSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameSave = z.infer<typeof insertGameSaveSchema>;
export type UpdateGameSave = z.infer<typeof updateGameSaveSchema>;
export type GameSave = typeof gameSaves.$inferSelect;
