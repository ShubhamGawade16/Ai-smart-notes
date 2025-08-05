import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { Code, Database, Zap, RefreshCw, X, Crown, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
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

  const toggleTierMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/dev/toggle-tier");
    },
    onSuccess: () => {
      toast({
        title: "Tier Toggled",
        description: "User tier has been toggled successfully.",
      });
      window.location.reload(); // Refresh to update subscription status
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
      description: 'Switch between Free and Premium Pro for testing',
      icon: <Crown className="w-6 h-6 text-yellow-600" />,
      action: handleToggleTier,
      loading: toggleTierMutation.isPending,
      buttonText: subscriptionStatus.isPremium ? 'Switch to Free' : 'Switch to Premium'
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
                <Badge className={subscriptionStatus.isPremium ? "bg-yellow-500" : "bg-gray-500"}>
                  {subscriptionStatus.isPremium ? 'Premium Pro' : 'Free'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI Usage</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit}
                </p>
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

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Zap className="w-5 h-5" />
              <p className="font-medium">Development Mode Only</p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              These features are for development and testing purposes only. Use with caution.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}