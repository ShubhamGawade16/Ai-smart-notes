import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarCheck2, Users, Loader2, AlertCircle, CheckCircle, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  taskId?: string;
  provider: 'google' | 'teams' | 'local';
}

export function CalendarIntegration() {
  const [selectedCalendar, setSelectedCalendar] = useState<'google' | 'teams' | 'both'>('both');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isTeamsConnected, setIsTeamsConnected] = useState(false);
  const { toast } = useToast();

  // Check calendar connection status
  useEffect(() => {
    const checkConnections = async () => {
      try {
        const googleStatus = localStorage.getItem('google_calendar_connected') === 'true';
        const teamsStatus = localStorage.getItem('teams_calendar_connected') === 'true';
        setIsGoogleConnected(googleStatus);
        setIsTeamsConnected(teamsStatus);
      } catch (error) {
        console.error('Error checking calendar connections:', error);
      }
    };
    checkConnections();
  }, []);

  // Connect Google Calendar
  const connectGoogleCalendar = () => {
    // In production, this would initiate OAuth flow
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id'}&` +
      `redirect_uri=${window.location.origin}/auth/google-calendar&` +
      `response_type=token&` +
      `scope=https://www.googleapis.com/auth/calendar`;
    
    // For demo purposes, simulate connection
    setTimeout(() => {
      setIsGoogleConnected(true);
      localStorage.setItem('google_calendar_connected', 'true');
      toast({
        title: "Google Calendar Connected",
        description: "Your tasks will now sync with Google Calendar automatically.",
      });
    }, 1500);
  };

  // Connect Microsoft Teams Calendar
  const connectTeamsCalendar = () => {
    // In production, this would initiate Microsoft OAuth flow
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${import.meta.env.VITE_TEAMS_CLIENT_ID || 'demo-client-id'}&` +
      `redirect_uri=${window.location.origin}/auth/teams-calendar&` +
      `response_type=token&` +
      `scope=https://graph.microsoft.com/calendars.readwrite`;
    
    // For demo purposes, simulate connection
    setTimeout(() => {
      setIsTeamsConnected(true);
      localStorage.setItem('teams_calendar_connected', 'true');
      toast({
        title: "Microsoft Teams Connected",
        description: "Your tasks will now sync with Teams Calendar automatically.",
      });
    }, 1500);
  };

  // Sync tasks to calendars
  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({
          calendars: selectedCalendar === 'both' ? ['google', 'teams'] : [selectedCalendar],
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Calendar Sync Complete",
        description: "All tasks have been synced to your selected calendars.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: "Unable to sync tasks to calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get calendar events
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/calendar/events'],
    queryFn: async () => {
      // Mock calendar events for demo
      return [
        {
          id: '1',
          title: 'Review quarterly reports',
          start: new Date(Date.now() + 2 * 60 * 60 * 1000),
          end: new Date(Date.now() + 3 * 60 * 60 * 1000),
          provider: 'google' as const,
          taskId: 'task-1',
        },
        {
          id: '2',
          title: 'Team standup',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 24.5 * 60 * 60 * 1000),
          provider: 'teams' as const,
          taskId: 'task-2',
        },
      ] as CalendarEvent[];
    },
    enabled: isGoogleConnected || isTeamsConnected,
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">G</div>;
      case 'teams':
        return <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">T</div>;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Integration
          <Badge variant="secondary">Pro Feature</Badge>
        </CardTitle>
        <CardDescription>
          Sync your tasks with Google Calendar and Microsoft Teams for seamless scheduling
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">G</span>
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    {isGoogleConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {isGoogleConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={connectGoogleCalendar}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              )}
            </div>
            {isGoogleConnected && (
              <div className="text-xs text-muted-foreground">
                Last synced: {new Date().toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Microsoft Teams</p>
                  <p className="text-sm text-muted-foreground">
                    {isTeamsConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {isTeamsConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={connectTeamsCalendar}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              )}
            </div>
            {isTeamsConnected && (
              <div className="text-xs text-muted-foreground">
                Last synced: {new Date().toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Sync Controls */}
        {(isGoogleConnected || isTeamsConnected) && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Select value={selectedCalendar} onValueChange={(value: any) => setSelectedCalendar(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isGoogleConnected && isTeamsConnected && (
                      <SelectItem value="both">Both Calendars</SelectItem>
                    )}
                    {isGoogleConnected && (
                      <SelectItem value="google">Google Calendar</SelectItem>
                    )}
                    {isTeamsConnected && (
                      <SelectItem value="teams">Teams Calendar</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <CalendarCheck2 className="h-4 w-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  Auto-sync is enabled. Tasks will automatically appear in your calendars when created or updated.
                </p>
              </div>
            </div>

            {/* Recent Calendar Events */}
            {events && events.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Recent Calendar Events</h4>
                <div className="space-y-2">
                  {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      {getProviderIcon(event.provider)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.start.toLocaleString()} - {event.end.toLocaleTimeString()}
                        </p>
                      </div>
                      {event.taskId && (
                        <Badge variant="outline" className="text-xs">
                          Synced Task
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Not Connected State */}
        {!isGoogleConnected && !isTeamsConnected && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Connect your calendars to automatically sync tasks and never miss a deadline
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={connectGoogleCalendar}>
                Connect Google Calendar
              </Button>
              <Button variant="outline" onClick={connectTeamsCalendar}>
                Connect Teams Calendar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}