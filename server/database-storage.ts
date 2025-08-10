import {
  users,
  tasks,
  notes,
  payments,
  type User,
  type InsertUser,
  type UpsertUser,
  type Task,
  type InsertTask,
  type UpdateTask,
  type Note,
  type InsertNote,
  type UpdateNote,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error(`Error getting user ${id}:`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error(`Error getting user by email ${email}:`, error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async upsertUser(upsertData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          id: upsertData.id,
          email: upsertData.email || '',
          firstName: upsertData.firstName,
          lastName: upsertData.lastName,
          profileImageUrl: upsertData.profileImageUrl,
          tier: 'free',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: upsertData.email || sql`${users.email}`,
            firstName: upsertData.firstName || sql`${users.firstName}`,
            lastName: upsertData.lastName || sql`${users.lastName}`,
            profileImageUrl: upsertData.profileImageUrl || sql`${users.profileImageUrl}`,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw new Error('Failed to upsert user');
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return false;
    }
  }

  async deleteAllUserTasks(userId: string): Promise<boolean> {
    try {
      await db.delete(tasks).where(eq(tasks.userId, userId));
      return true;
    } catch (error) {
      console.error(`Error deleting all tasks for user ${userId}:`, error);
      return false;
    }
  }

  async deleteAllUserNotes(userId: string): Promise<boolean> {
    try {
      await db.delete(notes).where(eq(notes.userId, userId));
      return true;
    } catch (error) {
      console.error(`Error deleting all notes for user ${userId}:`, error);
      return false;
    }
  }

  // Task operations
  async getTasks(userId: string): Promise<Task[]> {
    try {
      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(desc(tasks.createdAt));
    } catch (error) {
      console.error(`Error getting tasks for user ${userId}:`, error);
      return [];
    }
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    try {
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
      return task || undefined;
    } catch (error) {
      console.error(`Error getting task ${id} for user ${userId}:`, error);
      return undefined;
    }
  }

  async createTask(userId: string, insertTask: InsertTask): Promise<Task> {
    try {
      const [task] = await db
        .insert(tasks)
        .values({
          ...insertTask,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return task;
    } catch (error) {
      console.error(`Error creating task for user ${userId}:`, error);
      throw new Error('Failed to create task');
    }
  }

  async updateTask(id: string, userId: string, updates: Partial<UpdateTask>): Promise<Task | undefined> {
    try {
      const [task] = await db
        .update(tasks)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning();
      return task || undefined;
    } catch (error) {
      console.error(`Error updating task ${id} for user ${userId}:`, error);
      return undefined;
    }
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error(`Error deleting task ${id} for user ${userId}:`, error);
      return false;
    }
  }

  // Note operations
  async getNotes(userId: string): Promise<Note[]> {
    try {
      return await db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.createdAt));
    } catch (error) {
      console.error(`Error getting notes for user ${userId}:`, error);
      return [];
    }
  }

  async getNote(id: string, userId: string): Promise<Note | undefined> {
    try {
      const [note] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, id), eq(notes.userId, userId)));
      return note || undefined;
    } catch (error) {
      console.error(`Error getting note ${id} for user ${userId}:`, error);
      return undefined;
    }
  }

  async createNote(userId: string, insertNote: InsertNote): Promise<Note> {
    try {
      const [note] = await db
        .insert(notes)
        .values({
          ...insertNote,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return note;
    } catch (error) {
      console.error(`Error creating note for user ${userId}:`, error);
      throw new Error('Failed to create note');
    }
  }

  async updateNote(id: string, userId: string, updates: Partial<UpdateNote>): Promise<Note | undefined> {
    try {
      const [note] = await db
        .update(notes)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(eq(notes.id, id), eq(notes.userId, userId)))
        .returning();
      return note || undefined;
    } catch (error) {
      console.error(`Error updating note ${id} for user ${userId}:`, error);
      return undefined;
    }
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(notes)
        .where(and(eq(notes.id, id), eq(notes.userId, userId)));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error(`Error deleting note ${id} for user ${userId}:`, error);
      return false;
    }
  }

  // Tier management methods
  async resetDailyLimits(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          dailyAiCalls: 0,
          dailyAiCallsResetAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error(`Error resetting daily limits for user ${userId}:`, error);
    }
  }

  async resetMonthlyLimits(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          monthlyAiCalls: 0,
          monthlyAiCallsResetAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error(`Error resetting monthly limits for user ${userId}:`, error);
    }
  }

  async incrementDailyAiCalls(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          dailyAiCalls: sql`${users.dailyAiCalls} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error(`Error incrementing daily AI calls for user ${userId}:`, error);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const [newPayment] = await db
        .insert(payments)
        .values({
          ...payment,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return newPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment');
    }
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, id));
      return payment || undefined;
    } catch (error) {
      console.error(`Error getting payment ${id}:`, error);
      return undefined;
    }
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpayOrderId, orderId));
      return payment || undefined;
    } catch (error) {
      console.error(`Error getting payment by order ${orderId}:`, error);
      return undefined;
    }
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    try {
      const [payment] = await db
        .update(payments)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, id))
        .returning();
      return payment || undefined;
    } catch (error) {
      console.error(`Error updating payment ${id}:`, error);
      return undefined;
    }
  }
}