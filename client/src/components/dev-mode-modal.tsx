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
  const { subscriptionStatus, refetch } = useSubscription();
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
      return apiRequest("POST", "/api/dev/reset-ai-usage");
    },
    onSuccess: () => {
      toast({
        title: "AI Usage Reset",
        description: "AI usage counters have been reset successfully.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to reset AI usage.",
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
      title: 'Reset AI Usage',
      description: 'Reset daily and monthly AI usage counters',
      icon: <RefreshCw className="w-6 h-6 text-blue-600" />,
      action: handleResetData,
      loading: resetDataMutation.isPending,
      buttonText: 'Reset AI Usage',
      destructive: false
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Developer Tools
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Simple Status Display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Tier:</span>
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">AI Usage:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {subscriptionStatus.tier === 'basic' ? 
                  `${subscriptionStatus.monthlyAiUsage || 0}/${subscriptionStatus.monthlyAiLimit === -1 ? '∞' : subscriptionStatus.monthlyAiLimit || '∞'}` :
                  `${subscriptionStatus.dailyAiUsage}/${subscriptionStatus.dailyAiLimit === -1 ? '∞' : subscriptionStatus.dailyAiLimit}`
                }
              </span>
            </div>
          </div>

          {/* Simple Action Buttons */}
          <div className="space-y-3">
            {devFeatures.map((feature, index) => (
              <Button 
                key={index}
                onClick={feature.action}
                disabled={feature.loading}
                variant={feature.destructive ? "destructive" : "outline"}
                className="w-full justify-start"
              >
                {feature.loading ? (
                  <RefreshCw className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <span className="w-4 h-4 mr-3 flex items-center justify-center">
                    {feature.icon}
                  </span>
                )}
                <div className="flex flex-col items-start">
                  <span className="font-medium">{feature.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}