import React, { useState } from 'react';
import { Link2, Calendar, Mail, Github, Slack, Trello, CheckCircle, AlertCircle, Settings, Plus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUpgrade } from '@/hooks/useUpgrade';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'connected' | 'disconnected' | 'error';
  category: 'productivity' | 'communication' | 'calendar' | 'development';
  tier: 'free' | 'pro' | 'advanced' | 'premium';
  lastSync?: Date;
  settings?: Record<string, any>;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: Date;
}

export const IntegrationHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWebhooks, setShowWebhooks] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '' });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseFeature, showUpgradeModal, limits } = useUpgrade();

  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ['/api/integrations'],
    enabled: canUseFeature('integrations'),
  });

  const { data: webhooksData } = useQuery({
    queryKey: ['/api/integrations/webhooks'],
    enabled: canUseFeature('webhooks') && showWebhooks,
  });

  const connectIntegrationMutation = useMutation({
    mutationFn: async ({ integrationId, config }: { integrationId: string; config?: any }) => {
      const response = await apiRequest('POST', `/api/integrations/${integrationId}/connect`, config);
      return response;
    },
    onSuccess: (_, { integrationId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integration Connected",
        description: "Successfully connected to the service.",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect integration. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (webhookData: any) => {
      const response = await apiRequest('POST', '/api/integrations/webhooks', webhookData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/webhooks'] });
      setNewWebhook({ name: '', url: '' });
      toast({
        title: "Webhook Created",
        description: "Webhook endpoint has been configured successfully.",
      });
    },
  });

  const availableIntegrations: Integration[] = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync tasks with your Google Calendar events',
      icon: Calendar,
      status: 'disconnected',
      category: 'calendar',
      tier: 'pro',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Create tasks from emails and send updates',
      icon: Mail,
      status: 'disconnected',
      category: 'communication',
      tier: 'pro',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Sync with GitHub issues and pull requests',
      icon: Github,
      status: 'connected',
      category: 'development',
      tier: 'advanced',
      lastSync: new Date(),
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send task notifications to Slack channels',
      icon: Slack,
      status: 'disconnected',
      category: 'communication',
      tier: 'advanced',
    },
    {
      id: 'trello',
      name: 'Trello',
      description: 'Import and sync Trello boards and cards',
      icon: Trello,
      status: 'error',
      category: 'productivity',
      tier: 'pro',
    },
  ];

  const mockWebhooks: WebhookEndpoint[] = [
    {
      id: '1',
      name: 'Task Completion Webhook',
      url: 'https://api.example.com/task-completed',
      events: ['task.completed', 'task.updated'],
      active: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Daily Summary',
      url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef',
      events: ['daily.summary'],
      active: false,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  if (!canUseFeature('integrations')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            Integration Hub
            <Badge variant="outline">Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Connect Your Workflow</h3>
            <p className="text-gray-600 mb-4">
              Integrate with Google Calendar, Gmail, Slack, GitHub, and more to streamline your productivity across platforms.
            </p>
            <Button 
              onClick={() => showUpgradeModal('integrations', 'Integrations require Pro subscription to connect external services.')}
            >
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTierRequirement = (tier: Integration['tier']) => {
    const tierMap = {
      free: 'Free',
      pro: 'Pro',
      advanced: 'Advanced Pro',
      premium: 'Premium Pro',
    };
    return tierMap[tier];
  };

  const canUseIntegration = (tier: Integration['tier']) => {
    const currentTier = limits?.tier || 'free';
    const tierLevels = { free: 0, basic_pro: 1, advanced_pro: 2, premium_pro: 3 };
    const requiredLevels = { free: 0, pro: 1, advanced: 2, premium: 3 };
    
    return tierLevels[currentTier as keyof typeof tierLevels] >= requiredLevels[tier];
  };

  const categories = [
    { id: 'all', name: 'All', count: availableIntegrations.length },
    { id: 'productivity', name: 'Productivity', count: availableIntegrations.filter(i => i.category === 'productivity').length },
    { id: 'communication', name: 'Communication', count: availableIntegrations.filter(i => i.category === 'communication').length },
    { id: 'calendar', name: 'Calendar', count: availableIntegrations.filter(i => i.category === 'calendar').length },
    { id: 'development', name: 'Development', count: availableIntegrations.filter(i => i.category === 'development').length },
  ];

  const filteredIntegrations = selectedCategory === 'all' 
    ? availableIntegrations 
    : availableIntegrations.filter(i => i.category === selectedCategory);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            Integration Hub
            <Badge variant="outline">
              {availableIntegrations.filter(i => i.status === 'connected').length} connected
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWebhooks(!showWebhooks)}
            >
              <Settings className="w-4 h-4 mr-1" />
              Webhooks
            </Button>
          </div>
        </CardTitle>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map(category => (
            <Button
              key={category.id}
              size="sm"
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className="text-xs"
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Webhooks Section */}
        {showWebhooks && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Webhook Endpoints</h4>
              {!canUseFeature('webhooks') && (
                <Badge variant="outline">Advanced Pro</Badge>
              )}
            </div>
            
            {canUseFeature('webhooks') ? (
              <>
                {/* Add New Webhook */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Webhook name"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="https://api.example.com/webhook"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    onClick={() => createWebhookMutation.mutate(newWebhook)}
                    disabled={!newWebhook.name || !newWebhook.url || createWebhookMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {/* Existing Webhooks */}
                <div className="space-y-2">
                  {mockWebhooks.map(webhook => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{webhook.name}</div>
                        <div className="text-xs text-gray-500 truncate">{webhook.url}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Events: {webhook.events.join(', ')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch checked={webhook.active} />
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-3">
                  Webhook endpoints require Advanced Pro subscription
                </p>
                <Button 
                  size="sm"
                  onClick={() => showUpgradeModal('webhooks', 'Webhooks require Advanced Pro subscription for external API integration.')}
                >
                  Upgrade to Advanced Pro
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIntegrations.map(integration => {
            const IconComponent = integration.icon;
            const canUse = canUseIntegration(integration.tier);
            
            return (
              <div key={integration.id} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 border rounded-lg">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{integration.name}</h4>
                      <Badge className={getStatusColor(integration.status)}>
                        {getStatusIcon(integration.status)}
                        {integration.status}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      {integration.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getTierRequirement(integration.tier)}
                      </Badge>
                      
                      {canUse ? (
                        <div className="flex gap-1">
                          {integration.status === 'connected' && (
                            <Button size="sm" variant="outline">
                              <Settings className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            onClick={() => connectIntegrationMutation.mutate({ integrationId: integration.id })}
                            disabled={connectIntegrationMutation.isPending}
                          >
                            {integration.status === 'connected' ? 'Reconnect' : 'Connect'}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => showUpgradeModal(
                            'integrations_advanced', 
                            `${integration.name} integration requires ${getTierRequirement(integration.tier)} subscription.`
                          )}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>
                    
                    {integration.lastSync && (
                      <div className="text-xs text-gray-400 mt-2">
                        Last sync: {integration.lastSync.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integration Stats */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
              Integration Overview
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {availableIntegrations.filter(i => i.status === 'connected').length}
              </div>
              <div className="text-xs text-gray-600">Connected</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {availableIntegrations.filter(i => canUseIntegration(i.tier)).length}
              </div>
              <div className="text-xs text-gray-600">Available</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-red-600">
                {availableIntegrations.filter(i => i.status === 'error').length}
              </div>
              <div className="text-xs text-gray-600">Issues</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};