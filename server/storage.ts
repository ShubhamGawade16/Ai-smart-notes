import {
  users,
  tasks,
  notes,
  habits,
  habitCompletions,
  aiInsights,
  focusSessions,
  integrations,
  usageAnalytics,
  subscriptionTiers,
  type User,
  type InsertUser,
  type UpdateUser,
  type Task,
  type InsertTask,
  type UpdateTask,
  type Note,
  type InsertNote,
  type UpdateNote,
  type Habit,
  type InsertHabit,
  type HabitCompletion,
  type AIInsight,
  type FocusSession,
  type Integration,
  type UsageAnalytic,
  type SubscriptionTier,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";
import { hashPassword } from "./auth";

// Interface for storage operations
export interface IStorage {
  // User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySubscriptionId(subscriptionId: string): Promise<User | undefined>;
  createUser(userData: InsertUser & { password: string }): Promise<User>;
  updateUser(id: string, updates: Partial<UpdateUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Task operations
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  getTodaysTasks(userId: string): Promise<Task[]>;
  getTasksByCategory(userId: string, category: string): Promise<Task[]>;
  createTask(userId: string, insertTask: InsertTask): Promise<Task>;
  updateTask(id: string, userId: string, updates: Partial<UpdateTask>): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;
  completeTask(id: string, userId: string): Promise<Task | undefined>;

  // Note operations
  getNotes(userId: string): Promise<Note[]>;
  getNote(id: string, userId: string): Promise<Note | undefined>;
  getRecentNotes(userId: string, limit?: number): Promise<Note[]>;
  createNote(userId: string, insertNote: InsertNote): Promise<Note>;
  updateNote(id: string, userId: string, updates: Partial<UpdateNote>): Promise<Note | undefined>;
  deleteNote(id: string, userId: string): Promise<boolean>;

  // Habit operations
  getHabits(userId: string): Promise<Habit[]>;
  getHabit(id: string, userId: string): Promise<Habit | undefined>;
  createHabit(userId: string, insertHabit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, userId: string, updates: Partial<Habit>): Promise<Habit | undefined>;
  deleteHabit(id: string, userId: string): Promise<boolean>;
  completeHabit(habitId: string, userId: string): Promise<HabitCompletion>;

  // AI Insights operations
  getAIInsights(userId: string): Promise<AIInsight[]>;
  createAIInsight(userId: string, insight: Omit<AIInsight, 'id' | 'userId' | 'createdAt'>): Promise<AIInsight>;
  markInsightAsRead(id: string, userId: string): Promise<boolean>;

  // Focus Session operations
  getFocusSessions(userId: string, limit?: number): Promise<FocusSession[]>;
  createFocusSession(userId: string, session: Omit<FocusSession, 'id' | 'userId' | 'createdAt'>): Promise<FocusSession>;
  updateFocusSession(id: string, userId: string, updates: Partial<FocusSession>): Promise<FocusSession | undefined>;

  // Integration operations
  getIntegrations(userId: string): Promise<Integration[]>;
  getIntegration(userId: string, type: string): Promise<Integration | undefined>;
  upsertIntegration(userId: string, integration: Omit<Integration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Integration>;

  // Analytics operations
  getAnalytics(userId: string): Promise<any>;
  getCategories(userId: string): Promise<string[]>;
  logUsageEvent(userId: string, eventType: string, eventData?: any): Promise<void>;

  // Subscription operations
  getSubscriptionTiers(): Promise<SubscriptionTier[]>;
  upsertSubscriptionTier(tier: SubscriptionTier): Promise<SubscriptionTier>;
}

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

  async getUserBySubscriptionId(subscriptionId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.subscriptionId, subscriptionId));
    return user;
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const passwordHash = await hashPassword(userData.password);
    const { password, ...userDataWithoutPassword } = userData;
    
    const [user] = await db
      .insert(users)
      .values({
        ...userDataWithoutPassword,
        passwordHash,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpdateUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Task operations
  async getTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task;
  }

  async getTodaysTasks(userId: string): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.createdAt, today),
          lte(tasks.createdAt, tomorrow)
        )
      )
      .orderBy(desc(tasks.priority), tasks.createdAt);
  }

  async getTasksByCategory(userId: string, category: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.category, category)))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(userId: string, insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values({ ...insertTask, userId })
      .returning();
    
    // Update user's monthly task count for free tier
    await this.incrementMonthlyTaskCount(userId);
    
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
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return result.rowCount > 0;
  }

  async completeTask(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ 
        completed: true, 
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    
    if (task) {
      // Award XP and update user streak
      await this.updateUserProgress(userId, task);
    }
    
    return task;
  }

  // Note operations
  async getNotes(userId: string): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt));
  }

  async getNote(id: string, userId: string): Promise<Note | undefined> {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
    return note;
  }

  async getRecentNotes(userId: string, limit = 5): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt))
      .limit(limit);
  }

  async createNote(userId: string, insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values({ ...insertNote, userId })
      .returning();
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
    const result = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
    return result.rowCount > 0;
  }

  // Habit operations
  async getHabits(userId: string): Promise<Habit[]> {
    return await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
      .orderBy(desc(habits.createdAt));
  }

  async getHabit(id: string, userId: string): Promise<Habit | undefined> {
    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)));
    return habit;
  }

  async createHabit(userId: string, insertHabit: InsertHabit): Promise<Habit> {
    const [habit] = await db
      .insert(habits)
      .values({ ...insertHabit, userId })
      .returning();
    return habit;
  }

  async updateHabit(id: string, userId: string, updates: Partial<Habit>): Promise<Habit | undefined> {
    const [habit] = await db
      .update(habits)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning();
    return habit;
  }

  async deleteHabit(id: string, userId: string): Promise<boolean> {
    const [habit] = await db
      .update(habits)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning();
    return !!habit;
  }

  async completeHabit(habitId: string, userId: string): Promise<HabitCompletion> {
    const [completion] = await db
      .insert(habitCompletions)
      .values({ habitId, userId })
      .returning();

    // Update habit statistics
    await db
      .update(habits)
      .set({
        totalCompletions: sql`${habits.totalCompletions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(habits.id, habitId));

    return completion;
  }

  // AI Insights operations
  async getAIInsights(userId: string): Promise<AIInsight[]> {
    return await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.userId, userId))
      .orderBy(desc(aiInsights.createdAt));
  }

  async createAIInsight(userId: string, insight: Omit<AIInsight, 'id' | 'userId' | 'createdAt'>): Promise<AIInsight> {
    const [aiInsight] = await db
      .insert(aiInsights)
      .values({ ...insight, userId })
      .returning();
    return aiInsight;
  }

  async markInsightAsRead(id: string, userId: string): Promise<boolean> {
    const [insight] = await db
      .update(aiInsights)
      .set({ isRead: true })
      .where(and(eq(aiInsights.id, id), eq(aiInsights.userId, userId)))
      .returning();
    return !!insight;
  }

  // Focus Session operations
  async getFocusSessions(userId: string, limit = 10): Promise<FocusSession[]> {
    return await db
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.createdAt))
      .limit(limit);
  }

  async createFocusSession(userId: string, session: Omit<FocusSession, 'id' | 'userId' | 'createdAt'>): Promise<FocusSession> {
    const [focusSession] = await db
      .insert(focusSessions)
      .values({ ...session, userId })
      .returning();
    return focusSession;
  }

  async updateFocusSession(id: string, userId: string, updates: Partial<FocusSession>): Promise<FocusSession | undefined> {
    const [session] = await db
      .update(focusSessions)
      .set(updates)
      .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)))
      .returning();
    return session;
  }

  // Integration operations
  async getIntegrations(userId: string): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.userId, userId))
      .orderBy(integrations.type);
  }

  async getIntegration(userId: string, type: string): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.type, type as any)));
    return integration;
  }

  async upsertIntegration(userId: string, integration: Omit<Integration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Integration> {
    const existing = await this.getIntegration(userId, integration.type);
    
    if (existing) {
      const [updated] = await db
        .update(integrations)
        .set({ ...integration, updatedAt: new Date() })
        .where(eq(integrations.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(integrations)
        .values({ ...integration, userId })
        .returning();
      return created;
    }
  }

  // Analytics operations
  async getAnalytics(userId: string): Promise<any> {
    const [stats] = await db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where completed = true)`,
      })
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const categoryStats = await db
      .select({
        category: tasks.category,
        total: count(),
        completed: sql<number>`count(*) filter (where completed = true)`,
      })
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .groupBy(tasks.category);

    return {
      total: stats.total || 0,
      completed: stats.completed || 0,
      byCategory: categoryStats.reduce((acc, stat) => {
        const category = stat.category || 'uncategorized';
        acc[category] = {
          total: stat.total,
          completed: stat.completed
        };
        return acc;
      }, {} as Record<string, { total: number; completed: number }>)
    };
  }

  async getCategories(userId: string): Promise<string[]> {
    const categories = await db
      .selectDistinct({ category: tasks.category })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), sql`${tasks.category} IS NOT NULL`));
    
    return categories.map(c => c.category).filter(Boolean);
  }

  async logUsageEvent(userId: string, eventType: string, eventData?: any): Promise<void> {
    await db
      .insert(usageAnalytics)
      .values({
        userId,
        eventType,
        eventData: eventData || {},
        sessionId: 'web-session', // TODO: Implement proper session tracking
      });
  }

  // Subscription operations
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.isActive, true))
      .orderBy(subscriptionTiers.sortOrder);
  }

  async upsertSubscriptionTier(tier: SubscriptionTier): Promise<SubscriptionTier> {
    const [upserted] = await db
      .insert(subscriptionTiers)
      .values(tier)
      .onConflictDoUpdate({
        target: subscriptionTiers.id,
        set: tier
      })
      .returning();
    return upserted;
  }

  // Helper methods
  private async incrementMonthlyTaskCount(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || user.tier !== 'free') return;

    // Reset count if it's a new month
    const now = new Date();
    const resetTime = new Date(user.monthlyTaskCountResetAt);
    
    if (now > resetTime) {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);

      await this.updateUser(userId, {
        monthlyTaskCount: 1,
        monthlyTaskCountResetAt: nextMonth
      });
    } else {
      await this.updateUser(userId, {
        monthlyTaskCount: (user.monthlyTaskCount || 0) + 1
      });
    }
  }

  private async updateUserProgress(userId: string, completedTask: Task): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    // Calculate XP based on task properties
    let xpReward = 10; // Base XP
    
    // Priority multiplier
    const priorityMultipliers = { low: 1, medium: 1.2, high: 1.5, urgent: 2 };
    xpReward *= priorityMultipliers[completedTask.priority] || 1;

    // Time estimation accuracy bonus
    if (completedTask.estimatedTime && completedTask.actualTime) {
      const accuracy = Math.abs(completedTask.estimatedTime - completedTask.actualTime) / completedTask.estimatedTime;
      if (accuracy < 0.2) xpReward *= 1.2; // 20% accuracy bonus
    }

    // Update streak and XP
    const lastActivity = user.lastActivityAt ? new Date(user.lastActivityAt) : new Date(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = user.currentStreak;
    if (lastActivity < yesterday) {
      newStreak = 1; // Reset streak
    } else if (lastActivity < today) {
      newStreak += 1; // Continue streak
    }
    // If already active today, streak stays the same

    await this.updateUser(userId, {
      totalXp: user.totalXp + Math.round(xpReward),
      currentStreak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      lastActivityAt: new Date()
    });

    // Log the completion for analytics
    await this.logUsageEvent(userId, 'task_completed', {
      taskId: completedTask.id,
      category: completedTask.category,
      priority: completedTask.priority,
      xpEarned: Math.round(xpReward)
    });
  }
}

export const storage = new DatabaseStorage();