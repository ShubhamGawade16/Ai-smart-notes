import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  boolean, 
  integer, 
  timestamp, 
  jsonb, 
  decimal,
  pgEnum,
  index 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userTierEnum = pgEnum("user_tier", ["free", "basic", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "incomplete"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const taskTypeEnum = pgEnum("task_type", ["creative", "routine", "analytical", "deep_work", "communication", "learning"]);
export const integrationTypeEnum = pgEnum("integration_type", ["google_calendar", "gmail", "outlook", "zoom", "meet", "slack", "teams", "webhook"]);

// Session storage table (required for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with tier management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url"),
  timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
  tier: userTierEnum("tier").default("free").notNull(),
  subscriptionId: varchar("subscription_id"), // Payment processor subscription ID
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  trialEndsAt: timestamp("trial_ends_at"),
  isTrialUsed: boolean("is_trial_used").default(false),
  dailyAiCalls: integer("daily_ai_calls").default(0),
  dailyAiCallsResetAt: timestamp("daily_ai_calls_reset_at").defaultNow(),
  monthlySubscriptionAmount: decimal("monthly_subscription_amount", { precision: 10, scale: 2 }),
  monthlyTaskCount: integer("monthly_task_count").default(0),
  monthlyTaskCountResetAt: timestamp("monthly_task_count_reset_at").defaultNow(),
  totalXp: integer("total_xp").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityAt: timestamp("last_activity_at"),
  // Onboarding data
  primaryGoal: varchar("primary_goal", { length: 50 }),
  customGoals: text("custom_goals"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  
  // Enhanced user preferences for comprehensive functionality
  preferences: jsonb("preferences").$default(() => ({
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      reminders: true
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      reduceMotion: false
    },
    workingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    }
  })),
  
  // Custom tags for enhanced task organization
  customTags: text("custom_tags").array().$default(() => []),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table with AI features
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  priority: taskPriorityEnum("priority").default("medium"),
  taskType: taskTypeEnum("task_type").default("routine"),
  category: text("category"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  estimatedTime: integer("estimated_time"), // in minutes
  actualTime: integer("actual_time"), // tracked time in minutes
  dueDate: timestamp("due_date"),
  scheduledAt: timestamp("scheduled_at"), // AI auto-schedule
  completedAt: timestamp("completed_at"),
  aiSuggestions: jsonb("ai_suggestions"), // AI-generated improvements
  parentTaskId: varchar("parent_task_id").references((): any => tasks.id),
  contextSwitchCost: integer("context_switch_cost"), // AI-calculated switching penalty
  readinessScore: integer("readiness_score"), // Smart timing readiness score (0-100)
  optimalTimeSlot: jsonb("optimal_time_slot"), // AI-suggested optimal timing
  xpReward: integer("xp_reward").default(10),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notes table with AI summaries
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  aiSummary: text("ai_summary"), // AI-generated summary
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Habits table (Pro feature)
export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // daily, weekly, etc.
  targetDays: integer("target_days").array().default(sql`ARRAY[]::integer[]`), // [1,2,3,4,5] for weekdays
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalCompletions: integer("total_completions").default(0),
  xpPerCompletion: integer("xp_per_completion").default(5),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Habit completions tracking
export const habitCompletions = pgTable("habit_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  habitId: varchar("habit_id").references(() => habits.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// AI insights and suggestions
export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // productivity_tip, bottleneck_analysis, time_optimization
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // confidence scores, data sources, etc.
  isRead: boolean("is_read").default(false),
  validUntil: timestamp("valid_until"), // Some insights expire
  createdAt: timestamp("created_at").defaultNow(),
});

// Focus sessions and time tracking
export const focusSessions = pgTable("focus_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "set null" }),
  duration: integer("duration").notNull(), // in seconds
  plannedDuration: integer("planned_duration"), // intended duration
  interruptions: integer("interruptions").default(0),
  focusScore: decimal("focus_score", { precision: 3, scale: 2 }), // 0.00 to 1.00
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Third-party integrations
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: integrationTypeEnum("type").notNull(),
  isActive: boolean("is_active").default(true),
  credentials: jsonb("credentials"), // encrypted tokens, refresh tokens
  settings: jsonb("settings"), // sync preferences, filters
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage analytics for insights
export const usageAnalytics = pgTable("usage_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  eventType: varchar("event_type").notNull(), // task_created, ai_suggestion_accepted, etc.
  eventData: jsonb("event_data"),
  sessionId: varchar("session_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Subscription tiers configuration
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  priceMonthly: integer("price_monthly"), // in paise (₹199 = 19900)
  stripePriceId: varchar("stripe_price_id"),
  features: jsonb("features").notNull(),
  limits: jsonb("limits").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  notes: many(notes),
  habits: many(habits),
  aiInsights: many(aiInsights),
  focusSessions: many(focusSessions),
  integrations: many(integrations),
  usageAnalytics: many(usageAnalytics),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
  }),
  subtasks: many(tasks),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  completions: many(habitCompletions),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [habitCompletions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  dailyAiCalls: true,
  dailyAiCallsResetAt: true,
  monthlyTaskCount: true,
  monthlyTaskCountResetAt: true,
  totalXp: true,
  currentStreak: true,
  longestStreak: true,
  lastActivityAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks, {
  estimatedTime: z.number().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  aiSuggestions: true,
  actualTime: true,
  contextSwitchCost: true,
  xpReward: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  aiSummary: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  currentStreak: true,
  longestStreak: true,
  totalCompletions: true,
});

// Update schemas
export const updateTaskSchema = insertTaskSchema.partial().extend({
  completed: z.boolean().optional(),
  completedAt: z.date().optional(),
  actualTime: z.number().optional(),
  aiSuggestions: z.any().optional(),
});

export const updateNoteSchema = insertNoteSchema.partial().extend({
  aiSummary: z.string().optional(),
});

export const updateUserSchema = insertUserSchema.partial().extend({
  id: z.string(),
  tier: z.enum(["free", "basic_pro", "advanced_pro", "premium_pro"]).optional(),
  totalXp: z.number().optional(),
  currentStreak: z.number().optional(),
  longestStreak: z.number().optional(),
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type AIInsight = typeof aiInsights.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type UsageAnalytic = typeof usageAnalytics.$inferSelect;
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

// Supabase upsert type for user sync
export type UpsertUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
};