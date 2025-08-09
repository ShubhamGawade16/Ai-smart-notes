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
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "captured", "failed", "refunded"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const taskTypeEnum = pgEnum("task_type", ["creative", "routine", "analytical", "deep_work", "communication", "learning"]);

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
  subscriptionId: varchar("subscription_id"), // Razorpay subscription ID
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  razorpayCustomerId: varchar("razorpay_customer_id"), // Razorpay customer ID for future payments
  dailyAiCalls: integer("daily_ai_calls").default(0),
  dailyAiCallsResetAt: timestamp("daily_ai_calls_reset_at").defaultNow(),
  monthlyAiCalls: integer("monthly_ai_calls").default(0),
  monthlyAiCallsResetAt: timestamp("monthly_ai_calls_reset_at").defaultNow(),
  frozenProCredits: integer("frozen_pro_credits").default(0), // Credits preserved when downgraded
  // Additional fields needed by routes
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  currentStreak: integer("current_streak").default(0),
  primaryGoal: text("primary_goal"),
  // Removed gamification fields - not implemented in current app
  // Keep only essential onboarding fields
  onboardingCompleted: boolean("onboarding_completed").default(false),
  
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

// Removed unused tables: habits, habitCompletions, aiInsights, focusSessions, integrations, usageAnalytics, subscriptionTiers
// These were not implemented in the current app and add unnecessary complexity

// Relations - cleaned up to only include active tables
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  notes: many(notes),
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

// Payments table for Razorpay transactions
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id").unique(),
  razorpayOrderId: varchar("razorpay_order_id").notNull(),
  razorpaySignature: varchar("razorpay_signature"),
  amount: integer("amount").notNull(), // Amount in paisa (INR smallest unit)
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  planType: userTierEnum("plan_type").notNull(), // Which plan they're purchasing
  subscriptionDurationDays: integer("subscription_duration_days").default(30),
  metadata: jsonb("metadata"), // Additional payment metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
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
  monthlyAiCalls: true,
  monthlyAiCallsResetAt: true,
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

// Removed habit schemas - habits table removed

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

// Payment schemas
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePaymentSchema = insertPaymentSchema.partial();

export const updateUserSchema = insertUserSchema.partial().extend({
  id: z.string(),
  tier: z.enum(["free", "basic", "pro"]).optional(),
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

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

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