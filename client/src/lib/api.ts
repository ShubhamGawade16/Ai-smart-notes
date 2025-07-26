import { apiRequest } from "@/lib/queryClient";
import type { Task, Note, InsertTask, InsertNote, UpdateTask, UpdateNote, AIOptimizationResponse } from "@shared/schema";

export const taskApi = {
  getAll: (): Promise<Task[]> => 
    fetch('/api/tasks').then(res => res.json()),
  
  getToday: (): Promise<Task[]> => 
    fetch('/api/tasks/today').then(res => res.json()),
  
  getById: (id: string): Promise<Task> => 
    fetch(`/api/tasks/${id}`).then(res => res.json()),
  
  create: async (task: InsertTask): Promise<Task> => {
    const res = await apiRequest('POST', '/api/tasks', task);
    return res.json();
  },
  
  update: async (id: string, updates: Partial<UpdateTask>): Promise<Task> => {
    const res = await apiRequest('PATCH', `/api/tasks/${id}`, updates);
    return res.json();
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest('DELETE', `/api/tasks/${id}`);
  },
};

export const noteApi = {
  getAll: (): Promise<Note[]> => 
    fetch('/api/notes').then(res => res.json()),
  
  getRecent: (limit = 5): Promise<Note[]> => 
    fetch(`/api/notes/recent?limit=${limit}`).then(res => res.json()),
  
  getById: (id: string): Promise<Note> => 
    fetch(`/api/notes/${id}`).then(res => res.json()),
  
  create: async (note: InsertNote): Promise<Note> => {
    const res = await apiRequest('POST', '/api/notes', note);
    return res.json();
  },
  
  update: async (id: string, updates: Partial<UpdateNote>): Promise<Note> => {
    const res = await apiRequest('PATCH', `/api/notes/${id}`, updates);
    return res.json();
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest('DELETE', `/api/notes/${id}`);
  },
};

export const aiApi = {
  optimizeDay: async (preferences?: any): Promise<AIOptimizationResponse> => {
    const res = await apiRequest('POST', '/api/ai/optimize-day', { preferences });
    return res.json();
  },
  
  getTaskSuggestions: (): Promise<{ suggestions: string[] }> => 
    fetch('/api/ai/task-suggestions').then(res => res.json()),
  
  getBottlenecks: (): Promise<{ bottlenecks: any[] }> => 
    fetch('/api/ai/bottlenecks').then(res => res.json()),
};

export const analyticsApi = {
  getStats: (): Promise<{
    completed: number;
    total: number;
    byCategory: Record<string, { completed: number; total: number }>;
  }> => 
    fetch('/api/analytics/stats').then(res => res.json()),
  
  getCategories: (): Promise<Array<{ name: string; count: number }>> => 
    fetch('/api/categories').then(res => res.json()),
};
