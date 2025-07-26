import { apiRequest } from "./queryClient";
import { Task, Note, AIInsight, User } from "@shared/schema";

// Task API
export const taskApi = {
  getToday: async (): Promise<Task[]> => {
    try {
      return await apiRequest('/api/tasks/today');
    } catch (error) {
      console.error('Error fetching today tasks:', error);
      return [];
    }
  },

  getAll: async (): Promise<Task[]> => {
    try {
      return await apiRequest('/api/tasks');
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  create: (task: Partial<Task>) => apiRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),

  update: (id: string, updates: Partial<Task>) => apiRequest(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  delete: (id: string) => apiRequest(`/api/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// Notes API
export const noteApi = {
  getRecent: async (): Promise<Note[]> => {
    try {
      return await apiRequest('/api/notes/recent');
    } catch (error) {
      console.error('Error fetching recent notes:', error);
      return [];
    }
  },

  getAll: async (): Promise<Note[]> => {
    try {
      return await apiRequest('/api/notes');
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  create: (note: Partial<Note>) => apiRequest('/api/notes', {
    method: 'POST',
    body: JSON.stringify(note),
  }),

  update: (id: string, updates: Partial<Note>) => apiRequest(`/api/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  delete: (id: string) => apiRequest(`/api/notes/${id}`, {
    method: 'DELETE',
  }),
};

// AI API
export const aiApi = {
  getBottlenecks: async () => {
    try {
      return await apiRequest('/api/ai/bottlenecks');
    } catch (error) {
      console.error('Error fetching AI bottlenecks:', error);
      return [];
    }
  },

  getInsights: async () => {
    try {
      return await apiRequest('/api/ai/insights');
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      return [];
    }
  },

  optimizeDay: (data: any) => apiRequest('/api/ai/optimize-day', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  categorizeTask: (title: string, description?: string) => 
    apiRequest('/api/ai/categorize', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  chat: (message: string) => apiRequest('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
};

// Analytics API
export const analyticsApi = {
  getStats: async () => {
    try {
      return await apiRequest('/api/analytics/stats');
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalNotes: 0,
        completionRate: 0,
        streak: 0,
        totalXp: 0,
        weeklyProgress: [],
        categoryBreakdown: {},
        productivityScore: 0,
      };
    }
  },

  getWeeklyProgress: () => apiRequest('/api/analytics/weekly'),
  
  getCategoryBreakdown: () => apiRequest('/api/analytics/categories'),
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<string[]> => {
    try {
      return await apiRequest('/api/categories');
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['Work', 'Personal', 'Learning', 'Health'];
    }
  },
};