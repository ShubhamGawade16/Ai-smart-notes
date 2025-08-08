import {
  users,
  tasks,
  notes,
  type User,
  type InsertUser,
  type UpsertUser,
  type Task,
  type InsertTask,
  type UpdateTask,
  type Note,
  type InsertNote,
  type UpdateNote,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  deleteAllUserTasks(userId: string): Promise<boolean>;
  deleteAllUserNotes(userId: string): Promise<boolean>;

  // Task operations
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(userId: string, insertTask: InsertTask): Promise<Task>;
  updateTask(id: string, userId: string, updates: Partial<UpdateTask>): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;

  // Note operations
  getNotes(userId: string): Promise<Note[]>;
  getNote(id: string, userId: string): Promise<Note | undefined>;
  createNote(userId: string, insertNote: InsertNote): Promise<Note>;
  updateNote(id: string, userId: string, updates: Partial<UpdateNote>): Promise<Note | undefined>;
  deleteNote(id: string, userId: string): Promise<boolean>;

  // Tier management methods (cleaned up)
  resetDailyLimits(userId: string): Promise<void>;
  resetMonthlyLimits(userId: string): Promise<void>;
  incrementDailyAiCalls(userId: string): Promise<void>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const insertData = {
      id: userData.id,
      email: userData.email || 'unknown@example.com',
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
    };
    
    const [user] = await db
      .insert(users)
      .values(insertData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...insertData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllUserTasks(userId: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.userId, userId));
    return (result.rowCount ?? 0) >= 0;
  }

  async deleteAllUserNotes(userId: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.userId, userId));
    return (result.rowCount ?? 0) >= 0;
  }

  // Task operations
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task;
  }

  async createTask(userId: string, taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({ ...taskData, userId }).returning();
    return task;
  }

  async updateTask(id: string, userId: string, updates: Partial<UpdateTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return task;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Note operations
  async getNotes(userId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
  }

  async getNote(id: string, userId: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
    return note;
  }

  async createNote(userId: string, noteData: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values({ ...noteData, userId }).returning();
    return note;
  }

  async updateNote(id: string, userId: string, updates: Partial<UpdateNote>): Promise<Note | undefined> {
    const [note] = await db
      .update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    return note;
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Tier management methods
  async resetDailyLimits(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        dailyAiCalls: 0,
        dailyAiCallsResetAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async resetMonthlyLimits(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        monthlyAiCalls: 0,
        monthlyAiCallsResetAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async incrementDailyAiCalls(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({
          dailyAiCalls: (user.dailyAiCalls || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }
  }
}

// Create storage instance
export const storage = new DatabaseStorage();