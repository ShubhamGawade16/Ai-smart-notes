import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  priority: varchar("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  category: text("category"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  estimatedTime: integer("estimated_time"), // in minutes
  aiSuggestions: jsonb("ai_suggestions"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  aiSuggestions: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  aiSummary: true,
});

export const updateTaskSchema = insertTaskSchema.partial().extend({
  id: z.string(),
});

export const updateNoteSchema = insertNoteSchema.partial().extend({
  id: z.string(),
  aiSummary: z.string().optional(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;

export type AIOptimizationRequest = {
  tasks: Task[];
  currentTime?: string;
  preferences?: {
    workHours?: { start: string; end: string };
    breakDuration?: number;
    maxFocusTime?: number;
  };
};

export type AIOptimizationResponse = {
  optimizedTasks: Array<Task & { 
    suggestedTime?: string;
    reasoning?: string;
  }>;
  insights: Array<{
    type: "productivity" | "bottleneck" | "suggestion";
    message: string;
    priority: "high" | "medium" | "low";
  }>;
  estimatedCompletionTime?: string;
};
