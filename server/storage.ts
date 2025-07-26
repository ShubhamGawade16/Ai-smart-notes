import { type Task, type InsertTask, type UpdateTask, type Note, type InsertNote, type UpdateNote } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<UpdateTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getTasksByCategory(category: string): Promise<Task[]>;
  getTodaysTasks(): Promise<Task[]>;
  
  // Note operations
  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<UpdateNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
  getNotesByCategory(category: string): Promise<Note[]>;
  getRecentNotes(limit?: number): Promise<Note[]>;
  
  // Analytics
  getCompletionStats(): Promise<{
    completed: number;
    total: number;
    byCategory: Record<string, { completed: number; total: number }>;
  }>;
}

export class MemStorage implements IStorage {
  private tasks: Map<string, Task>;
  private notes: Map<string, Note>;

  constructor() {
    this.tasks = new Map();
    this.notes = new Map();
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      description: insertTask.description || null,
      completed: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      aiSuggestions: null,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<UpdateTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: new Date(),
      completedAt: updates.completed && !task.completed ? new Date() : 
                   updates.completed === false ? null : task.completedAt,
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.category === category);
  }

  async getTodaysTasks(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.tasks.values()).filter(task => {
      if (task.completed) return true; // Show completed tasks from today
      if (!task.dueDate) return true; // Show tasks without due date
      
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    }).sort((a, b) => {
      // Prioritize incomplete tasks, then by priority, then by creation date
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
    });
  }

  // Note operations
  async getNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).sort((a, b) => 
      new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
    );
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const now = new Date();
    const note: Note = {
      ...insertNote,
      id,
      category: insertNote.category || null,
      tags: insertNote.tags || null,
      createdAt: now,
      updatedAt: now,
      aiSummary: null,
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<UpdateNote>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const updatedNote: Note = {
      ...note,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  async getNotesByCategory(category: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.category === category);
  }

  async getRecentNotes(limit: number = 5): Promise<Note[]> {
    const allNotes = await this.getNotes();
    return allNotes.slice(0, limit);
  }

  // Analytics
  async getCompletionStats(): Promise<{
    completed: number;
    total: number;
    byCategory: Record<string, { completed: number; total: number }>;
  }> {
    const allTasks = Array.from(this.tasks.values());
    const completed = allTasks.filter(task => task.completed).length;
    const total = allTasks.length;

    const byCategory: Record<string, { completed: number; total: number }> = {};
    
    allTasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = { completed: 0, total: 0 };
      }
      byCategory[category].total++;
      if (task.completed) {
        byCategory[category].completed++;
      }
    });

    return { completed, total, byCategory };
  }
}

export const storage = new MemStorage();
