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

  // Tier management methods
  resetDailyLimits(userId: string): Promise<void>;
  resetMonthlyLimits(userId: string): Promise<void>;
  incrementDailyAiCalls(userId: string): Promise<void>;
  incrementMonthlyTaskCount(userId: string): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private tasks: Task[] = [];
  private notes: Note[] = [];

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    let user = this.users.find(user => user.id === id);
    if (!user) {
      // Create test user with Premium Pro tier for testing all features
      user = {
        id,
        email: 'test@example.com',
        passwordHash: null,
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: null,
        tier: 'premium_pro', // Enable all Pro features for testing
        subscriptionId: 'test-sub-' + id,
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialEndsAt: null,
        isTrialUsed: false,
        dailyAiCalls: 0,
        dailyAiCallsResetAt: new Date(),
        monthlyTaskCount: 0,
        monthlyTaskCountResetAt: new Date(),
        totalXp: 1250,
        lastActivityAt: null,
        currentStreak: 7,
        longestStreak: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(user);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      email: insertUser.email,
      passwordHash: insertUser.passwordHash || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      tier: insertUser.tier || 'free',
      subscriptionId: insertUser.subscriptionId || null,
      subscriptionStatus: insertUser.subscriptionStatus || null,
      subscriptionCurrentPeriodEnd: insertUser.subscriptionCurrentPeriodEnd || null,
      trialEndsAt: insertUser.trialEndsAt || null,
      isTrialUsed: insertUser.isTrialUsed || false,
      dailyAiCalls: 0,
      dailyAiCallsResetAt: new Date(),
      monthlyTaskCount: 0,
      monthlyTaskCountResetAt: new Date(),
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async upsertUser(upsertData: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(upsertData.id);
    
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        email: upsertData.email || existingUser.email,
        firstName: upsertData.firstName || existingUser.firstName,
        lastName: upsertData.lastName || existingUser.lastName,
        profileImageUrl: upsertData.profileImageUrl || existingUser.profileImageUrl,
        updatedAt: new Date(),
      };
      
      const userIndex = this.users.findIndex(u => u.id === upsertData.id);
      this.users[userIndex] = updatedUser;
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: upsertData.id,
        email: upsertData.email || 'unknown@example.com',
        passwordHash: null,
        firstName: upsertData.firstName || null,
        lastName: upsertData.lastName || null,
        profileImageUrl: upsertData.profileImageUrl || null,
        tier: 'free',
        subscriptionId: null,
        subscriptionStatus: null,
        subscriptionCurrentPeriodEnd: null,
        trialEndsAt: null,
        isTrialUsed: false,
        dailyAiCalls: 0,
        dailyAiCallsResetAt: new Date(),
        monthlyTaskCount: 0,
        monthlyTaskCountResetAt: new Date(),
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(newUser);
      return newUser;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    return this.users[userIndex];
  }

  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    return this.tasks.filter(task => task.userId === userId);
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    return this.tasks.find(task => task.id === id && task.userId === userId);
  }

  async createTask(userId: string, insertTask: InsertTask): Promise<Task> {
    const task: Task = {
      id: crypto.randomUUID(),
      userId,
      title: insertTask.title,
      description: insertTask.description || null,
      completed: insertTask.completed || false,
      priority: insertTask.priority || 'medium',
      category: insertTask.category || null,
      tags: insertTask.tags || [],
      estimatedTime: insertTask.estimatedTime || null,
      actualTime: null,
      dueDate: insertTask.dueDate || null,
      scheduledAt: insertTask.scheduledAt || null,
      completedAt: null,
      aiSuggestions: null,
      parentTaskId: insertTask.parentTaskId || null,
      contextSwitchCost: (insertTask as any).contextSwitchCost || null,
      xpReward: (insertTask as any).xpReward || 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(task);
    return task;
  }

  async updateTask(id: string, userId: string, updates: Partial<UpdateTask>): Promise<Task | undefined> {
    const taskIndex = this.tasks.findIndex(task => task.id === id && task.userId === userId);
    if (taskIndex === -1) {
      return undefined;
    }
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    return this.tasks[taskIndex];
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const taskIndex = this.tasks.findIndex(task => task.id === id && task.userId === userId);
    if (taskIndex === -1) {
      return false;
    }
    
    this.tasks.splice(taskIndex, 1);
    return true;
  }

  // Note methods
  async getNotes(userId: string): Promise<Note[]> {
    return this.notes.filter(note => note.userId === userId);
  }

  async getNote(id: string, userId: string): Promise<Note | undefined> {
    return this.notes.find(note => note.id === id && note.userId === userId);
  }

  async createNote(userId: string, insertNote: InsertNote): Promise<Note> {
    const note: Note = {
      id: crypto.randomUUID(),
      userId,
      title: insertNote.title,
      content: insertNote.content,
      category: insertNote.category || null,
      tags: insertNote.tags || [],
      aiSummary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.push(note);
    return note;
  }

  async updateNote(id: string, userId: string, updates: Partial<UpdateNote>): Promise<Note | undefined> {
    const noteIndex = this.notes.findIndex(note => note.id === id && note.userId === userId);
    if (noteIndex === -1) {
      return undefined;
    }
    
    this.notes[noteIndex] = {
      ...this.notes[noteIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    return this.notes[noteIndex];
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    const noteIndex = this.notes.findIndex(note => note.id === id && note.userId === userId);
    if (noteIndex === -1) {
      return false;
    }
    
    this.notes.splice(noteIndex, 1);
    return true;
  }

  // Tier management methods
  async resetDailyLimits(userId: string): Promise<void> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        dailyAiCalls: 0,
        dailyAiCallsResetAt: new Date()
      };
    }
  }

  async resetMonthlyLimits(userId: string): Promise<void> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        monthlyTaskCount: 0,
        monthlyTaskCountResetAt: new Date()
      };
    }
  }

  async incrementDailyAiCalls(userId: string): Promise<void> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        dailyAiCalls: (this.users[userIndex].dailyAiCalls || 0) + 1,
        updatedAt: new Date()
      };
    }
  }

  async incrementMonthlyTaskCount(userId: string): Promise<void> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        monthlyTaskCount: (this.users[userIndex].monthlyTaskCount || 0) + 1,
        updatedAt: new Date()
      };
    }
  }
}

import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage for production-ready persistent storage
// Fallback to MemStorage for development if database is unavailable
let storageInstance: IStorage;

try {
  // Try to initialize database storage
  storageInstance = new DatabaseStorage();
  console.log("✅ Using DatabaseStorage - all user data will be persisted");
} catch (error) {
  console.warn("⚠️  Database unavailable, falling back to MemStorage:", error);
  storageInstance = new MemStorage();
}

export const storage = storageInstance;