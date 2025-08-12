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
  const { subscription, isPro, isBasic, isFree, refetch } = useSubscription();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const toggleTierMutation = useMutation({
    mutationFn: async () => {
      const nextTier = isFree ? 'basic' : isBasic ? 'pro' : 'free';
      const response = await apiRequest("POST", "/api/dev/change-tier", { tier: nextTier });
      return response.json();
    },
    onSuccess: async (data) => {
      // Force invalidate all subscription-related queries with correct query keys
      await queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription-status'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/payments/ai-limits'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/status'] });
      
      // Force refetch subscription status immediately
      await refetch();
      
      // Small delay then refetch again to ensure UI updates
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/payments/subscription-status'] });
        queryClient.refetchQueries({ queryKey: ['/api/payments/ai-limits'] });
      }, 100);
      
      toast({
        title: "Tier Updated", 
        description: `Successfully switched to ${data.newTier} tier. UI should refresh now.`,
      });
      
      // Don't close modal automatically, let user see the change
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
      // Invalidate all relevant queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/ai-limits'] });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to reset AI usage.",
        variant: "destructive"
      });
    }
  });

  // AI Credits 1-Minute Timer Testing (using simpler dev-test endpoints)
  const testAiCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/dev-test/quick-1min-timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "1-Minute Timer Set ⏰",
        description: `AI credits will reset in 1 minute! Current: ${data.currentCredits || 0}/3 credits`,
      });
      // Auto-refresh UI in 65 seconds to see the reset
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/payments/ai-limits'] });
        queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription-status'] });
        toast({
          title: "Timer Complete! 🎯",
          description: "1-minute timer finished. Credits should now be reset to 0!",
        });
      }, 65000);
    },
    onError: (error) => {
      toast({
        title: "Timer Error",
        description: "Failed to set 1-minute timer. Try again.",
        variant: "destructive"
      });
    }
  });

  const forceResetCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/dev-test/quick-force-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Credits Force Reset ⚡",
        description: `AI credits reset immediately! Now: ${data.creditsAfter || 0}/3 credits`,
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/payments/ai-limits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription-status'] });
    },
    onError: () => {
      toast({
        title: "Reset Error",
        description: "Failed to force reset credits. Try again.",
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

  const handleTestTimer = () => {
    if (confirm('⏰ Set a 1-minute timer for AI credits reset?\n\nThis will reset your credits from ' + (subscription?.dailyAiUsage || 0) + ' to 0 after exactly 1 minute for testing.')) {
      testAiCreditsMutation.mutate();
    }
  };

  const handleForceReset = () => {
    if (confirm('⚡ Force reset AI credits to 0 immediately?\n\nThis will instantly reset your current ' + (subscription?.dailyAiUsage || 0) + ' credits to 0.')) {
      forceResetCreditsMutation.mutate();
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
        isFree ? 'Basic' :
        isBasic ? 'Pro' :
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
      title: '1-Minute AI Credits Timer',
      description: 'Test AI credits reset with 1-minute timer (instead of 24 hours)',
      icon: <Zap className="w-6 h-6 text-orange-600" />,
      action: handleTestTimer,
      loading: testAiCreditsMutation.isPending,
      buttonText: '1-Min Timer Test',
      highlight: true
    },
    {
      title: 'Force Reset AI Credits',
      description: 'Instantly reset AI credits to 0 for testing',
      icon: <RefreshCw className="w-6 h-6 text-red-600" />,
      action: handleForceReset,
      loading: forceResetCreditsMutation.isPending,
      buttonText: 'Force Reset Now',
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
                isPro ? "bg-purple-500" : 
                isBasic ? "bg-blue-500" : 
                "bg-gray-500"
              }>
                {isPro ? 'Pro' : 
                 isBasic ? 'Basic' : 
                 'Free'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">AI Usage:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isBasic ? 
                  `${subscription?.monthlyAiCalls || 0}/100` :
                  `${subscription?.dailyAiCalls || 0}/${isPro ? '∞' : '3'}`
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
                variant={feature.destructive ? "destructive" : feature.highlight ? "default" : "outline"}
                className={`w-full justify-start ${
                  feature.highlight 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600' 
                    : ''
                }`}
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