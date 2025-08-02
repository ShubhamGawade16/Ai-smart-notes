import { apiRequest } from "./queryClient";
import { Task, Note, AIInsight, User } from "@shared/schema";

// Task API
export const taskApi = {
  getToday: async (): Promise<Task[]> => {
    try {
      const response = await apiRequest('GET', '/api/tasks/today');
      return await response.json();
    } catch (error) {
      console.error('Error fetching today tasks:', error);
      return [];
    }
  },

  getAll: async (): Promise<Task[]> => {
    try {
      const response = await apiRequest('GET', '/api/tasks');
      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  create: async (task: Partial<Task>) => {
    const response = await apiRequest('POST', '/api/tasks', task);
    return await response.json();
  },

  update: async (id: string, updates: Partial<Task>) => {
    const response = await apiRequest('PATCH', `/api/tasks/${id}`, updates);
    return await response.json();
  },

  delete: async (id: string) => {
    const response = await apiRequest('DELETE', `/api/tasks/${id}`);
    return await response.json();
  },
};

// Notes API
export const noteApi = {
  getRecent: async (): Promise<Note[]> => {
    try {
      const response = await apiRequest('GET', '/api/notes/recent');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent notes:', error);
      return [];
    }
  },

  getAll: async (): Promise<Note[]> => {
    try {
      const response = await apiRequest('GET', '/api/notes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  create: async (note: Partial<Note>) => {
    const response = await apiRequest('POST', '/api/notes', note);
    return await response.json();
  },

  update: async (id: string, updates: Partial<Note>) => {
    const response = await apiRequest('PATCH', `/api/notes/${id}`, updates);
    return await response.json();
  },

  delete: async (id: string) => {
    const response = await apiRequest('DELETE', `/api/notes/${id}`);
    return await response.json();
  },
};

// AI API
export const aiApi = {
  getBottlenecks: async () => {
    try {
      const response = await apiRequest('GET', '/api/ai/bottlenecks');
      return await response.json();
    } catch (error) {
      console.error('Error fetching AI bottlenecks:', error);
      return [];
    }
  },

  getInsights: async () => {
    try {
      const response = await apiRequest('GET', '/api/ai/insights');
      return await response.json();
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      return [];
    }
  },

  optimizeDay: async (data: any) => {
    const response = await apiRequest('POST', '/api/ai/optimize-day', data);
    return await response.json();
  },

  categorizeTask: async (title: string, description?: string) => {
    const response = await apiRequest('POST', '/api/ai/categorize', { title, description });
    return await response.json();
  },

  chat: async (message: string) => {
    const response = await apiRequest('POST', '/api/ai/chat', { message });
    return await response.json();
  },
};

// Analytics API
export const analyticsApi = {
  getStats: async () => {
    try {
      const response = await apiRequest('GET', '/api/analytics/stats');
      return await response.json();
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

  getWeeklyProgress: async () => {
    const response = await apiRequest('GET', '/api/analytics/weekly');
    return await response.json();
  },
  
  getCategoryBreakdown: async () => {
    const response = await apiRequest('GET', '/api/analytics/categories');
    return await response.json();
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<string[]> => {
    try {
      const response = await apiRequest('GET', '/api/categories');
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['Work', 'Personal', 'Learning', 'Health'];
    }
  },
};