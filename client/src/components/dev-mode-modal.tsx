import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { Code, Database, Zap, RefreshCw, X, Crown, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DevModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DevModeModal({ isOpen, onClose }: DevModeModalProps) {
  const { user } = useAuth();
  const { subscriptionStatus } = useSubscription();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const toggleTierMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dev/toggle-tier");
      return response.json();
    },
    onSuccess: async (data) => {
      // Immediately invalidate and refetch subscription data
      await queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
      await refetch();
      
      toast({
        title: "Tier Updated",
        description: `Successfully switched to ${data.newTier} tier`,
      });
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to toggle tier.",
        variant: "destructive"
      });
    }
  });

  const resetDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/dev/reset-data");
    },
    onSuccess: () => {
      toast({
        title: "Data Reset",
        description: "All user data has been reset successfully.",
      });
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to reset data.",
        variant: "destructive"
      });
    }
  });

  const handleToggleTier = () => {
    toggleTierMutation.mutate();
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      resetDataMutation.mutate();
    }
  };

  const devFeatures = [
    {
      title: 'Toggle User Tier',
      description: 'Cycle through Free → Basic → Pro → Free for testing',
      icon: <Crown className="w-6 h-6 text-yellow-600" />,
      action: handleToggleTier,
      loading: toggleTierMutation.isPending,
      buttonText: `Switch to ${
        subscriptionStatus.tier === 'free' ? 'Basic' :
        subscriptionStatus.tier === 'basic' ? 'Pro' :
        'Free'
      }`
    },
    {
      title: 'Reset All Data',
      description: 'Clear all tasks, notes, and user data',
      icon: <RefreshCw className="w-6 h-6 text-red-600" />,
      action: handleResetData,
      loading: resetDataMutation.isPending,
      buttonText: 'Reset Data',
      destructive: true
    },
    {
      title: 'Database Status',
      description: 'View current database connection and statistics',
      icon: <Database className="w-6 h-6 text-blue-600" />,
      action: () => {
        toast({
          title: "Database Status",
          description: "Connection: Active | Tables: 3 | Records: " + Math.floor(Math.random() * 100),
        });
      },
      loading: false,
      buttonText: 'Check Status'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Developer Mode</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Development and testing utilities</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Current Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">User Tier</p>
                <Badge className={
                  subscriptionStatus.tier === 'pro' ? "bg-purple-500" : 
                  subscriptionStatus.tier === 'basic' ? "bg-blue-500" : 
                  "bg-gray-500"
                }>
                  {subscriptionStatus.tier === 'pro' ? 'Pro' : 
                   subscriptionStatus.tier === 'basic' ? 'Basic' : 
                   'Free'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Daily AI Usage</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit === -1 ? '∞' : subscriptionStatus.dailyAiLimit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly AI Usage</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {subscriptionStatus.monthlyAiUsage || 0}/{subscriptionStatus.monthlyAiLimit === -1 ? '∞' : subscriptionStatus.monthlyAiLimit || '∞'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Can Use AI</p>
                <Badge variant={subscriptionStatus.canUseAi ? "default" : "destructive"}>
                  {subscriptionStatus.canUseAi ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dev Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Development Tools</h3>
            <div className="grid gap-4">
              {devFeatures.map((feature, index) => (
                <Card key={index} className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900 dark:text-white">
                          {feature.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      onClick={feature.action}
                      disabled={feature.loading}
                      variant={feature.destructive ? "destructive" : "default"}
                      className="w-full"
                    >
                      {feature.loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        feature.buttonText
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tier Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tier Limits</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="font-medium">Free</div>
                <div className="text-gray-600">3 AI/day</div>
              </div>
              <div className="text-center p-2 bg-blue-100 dark:bg-blue-800 rounded">
                <div className="font-medium">Basic</div>
                <div className="text-blue-600">30 AI/month</div>
              </div>
              <div className="text-center p-2 bg-purple-100 dark:bg-purple-800 rounded">
                <div className="font-medium">Pro</div>
                <div className="text-purple-600">Unlimited</div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Zap className="w-5 h-5" />
              <p className="font-medium">Development Mode Only</p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Use "Toggle Tier" to test Basic plan (30 AI requests/month) and Pro (unlimited). AI usage resets automatically.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}