import type { Task } from '../../shared/schema';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  taskId?: string;
  provider: 'google' | 'teams' | 'local';
}

class CalendarService {
  // Mock Google Calendar integration
  async syncToGoogleCalendar(tasks: Task[]): Promise<CalendarEvent[]> {
    // In production, this would use Google Calendar API
    const events: CalendarEvent[] = [];
    
    for (const task of tasks) {
      if (task.dueDate) {
        const startTime = new Date(task.dueDate);
        const endTime = new Date(startTime.getTime() + (task.estimatedTime || 30) * 60000);
        
        events.push({
          id: `google-${task.id}`,
          title: task.title,
          description: task.description || undefined,
          startTime,
          endTime,
          taskId: task.id,
          provider: 'google',
        });
      }
    }
    
    return events;
  }

  // Mock Microsoft Teams Calendar integration
  async syncToTeamsCalendar(tasks: Task[]): Promise<CalendarEvent[]> {
    // In production, this would use Microsoft Graph API
    const events: CalendarEvent[] = [];
    
    for (const task of tasks) {
      if (task.dueDate) {
        const startTime = new Date(task.dueDate);
        const endTime = new Date(startTime.getTime() + (task.estimatedTime || 30) * 60000);
        
        events.push({
          id: `teams-${task.id}`,
          title: `[Task] ${task.title}`,
          description: `Priority: ${task.priority || 'medium'}\n${task.description || ''}`,
          startTime,
          endTime,
          taskId: task.id,
          provider: 'teams',
        });
      }
    }
    
    return events;
  }

  // Sync tasks to specified calendars
  async syncTasks(tasks: Task[], calendars: ('google' | 'teams')[]): Promise<{
    synced: number;
    events: CalendarEvent[];
    errors: string[];
  }> {
    const allEvents: CalendarEvent[] = [];
    const errors: string[] = [];
    
    try {
      if (calendars.includes('google')) {
        const googleEvents = await this.syncToGoogleCalendar(tasks);
        allEvents.push(...googleEvents);
      }
      
      if (calendars.includes('teams')) {
        const teamsEvents = await this.syncToTeamsCalendar(tasks);
        allEvents.push(...teamsEvents);
      }
    } catch (error) {
      errors.push(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      synced: allEvents.length,
      events: allEvents,
      errors,
    };
  }

  // Get calendar events
  async getCalendarEvents(providers: ('google' | 'teams')[]): Promise<CalendarEvent[]> {
    // Mock implementation - in production would fetch from actual calendars
    const mockEvents: CalendarEvent[] = [
      {
        id: 'google-event-1',
        title: 'Team Standup',
        description: 'Daily team sync',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24.5 * 60 * 60 * 1000),
        provider: 'google',
      },
      {
        id: 'teams-event-1',
        title: 'Sprint Planning',
        description: 'Q4 Sprint planning session',
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 50 * 60 * 60 * 1000),
        provider: 'teams',
      },
    ];
    
    return mockEvents.filter(event => providers.includes(event.provider as 'google' | 'teams'));
  }
}

export const calendarService = new CalendarService();