import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Mail, 
  Github, 
  MessageSquare, 
  Trello,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Plus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  connected: boolean;
  status: 'active' | 'inactive' | 'error';
  config?: Record<string, any>;
}

const availableIntegrations: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: Calendar,
    description: 'Sync tasks with your calendar events',
    connected: false,
    status: 'inactive'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    description: 'Create tasks from important emails',
    connected: false,
    status: 'inactive'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    description: 'Track issues and pull requests',
    connected: false,
    status: 'inactive'
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: MessageSquare,
    description: 'Get task notifications in Slack',
    connected: false,
    status: 'inactive'
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: Trello,
    description: 'Import boards and sync cards',
    connected: false,
    status: 'inactive'
  }
];

export function IntegrationHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/integrations'],
    retry: false
  });

  const connectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return await apiRequest('POST', `/api/integrations/${integrationId}/connect`, {});
    },
    onSuccess: (data, integrationId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integration Connected",
        description: `Successfully connected ${availableIntegrations.find(i => i.id === integrationId)?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect integration",
        variant: "destructive",
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return await apiRequest('DELETE', `/api/integrations/${integrationId}`, {});
    },
    onSuccess: (data, integrationId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integration Disconnected",
        description: `Successfully disconnected ${availableIntegrations.find(i => i.id === integrationId)?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect integration",
        variant: "destructive",
      });
    }
  });

  const handleConnect = (integrationId: string) => {
    connectMutation.mutate(integrationId);
  };

  const handleDisconnect = (integrationId: string) => {
    disconnectMutation.mutate(integrationId);
  };

  const getIntegrationStatus = (integrationId: string) => {
    const serverIntegration = Array.isArray(integrations) ? 
      integrations.find((i: any) => i.id === integrationId) : null;
    
    if (serverIntegration) {
      return {
        connected: serverIntegration.connected,
        status: serverIntegration.status || 'active'
      };
    }
    
    return { connected: false, status: 'inactive' };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Integration Hub</h2>
        <p className="text-muted-foreground">
          Connect your favorite tools to supercharge your productivity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableIntegrations.map((integration) => {
          const status = getIntegrationStatus(integration.id);
          const Icon = integration.icon;
          const isConnecting = connectMutation.isPending && selectedIntegration === integration.id;
          const isDisconnecting = disconnectMutation.isPending && selectedIntegration === integration.id;

          return (
            <Card key={integration.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {status.connected ? (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-sm mb-4">
                  {integration.description}
                </CardDescription>
                
                <div className="flex justify-between items-center">
                  {status.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIntegration(integration.id);
                        handleDisconnect(integration.id);
                      }}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedIntegration(integration.id);
                        handleConnect(integration.id);
                      }}
                      disabled={isConnecting}
                    >
                      {isConnecting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                      <Plus className="h-3 w-3 mr-2" />
                      Connect
                    </Button>
                  )}
                  
                  {status.connected && (
                    <Button variant="ghost" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar Sync
              </h4>
              <p className="text-sm text-muted-foreground">
                Tasks with due dates automatically appear in your calendar
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Integration
              </h4>
              <p className="text-sm text-muted-foreground">
                Convert important emails into actionable tasks
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Github className="h-4 w-4" />
                Development Workflow
              </h4>
              <p className="text-sm text-muted-foreground">
                Track GitHub issues and pull requests as tasks
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Team Notifications
              </h4>
              <p className="text-sm text-muted-foreground">
                Get task updates and reminders in Slack
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}