import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain, Target, Clock, MessageCircle, Lightbulb, X } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';

interface AIFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: string) => void;
  onUpgradeRequired: () => void;
}

export default function AIFeaturesModal({ isOpen, onClose, onFeatureSelect, onUpgradeRequired }: AIFeaturesModalProps) {
  const { subscriptionStatus, checkAiUsageLimit } = useSubscription();

  const aiFeatures = [
    {
      id: 'task-refiner',
      title: 'AI Task Refiner',
      description: 'Get AI suggestions to improve and break down your tasks',
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      available: true
    },
    {
      id: 'smart-categorizer', 
      title: 'Smart Categorizer',
      description: 'Automatically categorize and tag your tasks with AI',
      icon: <Target className="w-6 h-6 text-blue-600" />,
      available: true
    },
    {
      id: 'timing-optimizer',
      title: 'Timing Optimizer', 
      description: 'AI-powered optimal timing recommendations for tasks',
      icon: <Clock className="w-6 h-6 text-green-600" />,
      available: true
    },
    {
      id: 'productivity-insights',
      title: 'Productivity Insights',
      description: 'Get AI analysis of your productivity patterns',
      icon: <Lightbulb className="w-6 h-6 text-amber-600" />,
      available: true
    },
    {
      id: 'ai-assistant',
      title: 'AI Chat Assistant',
      description: 'Chat with AI to plan and organize your tasks',
      icon: <MessageCircle className="w-6 h-6 text-teal-600" />,
      available: true
    }
  ];

  const handleFeatureClick = (featureId: string) => {
    if (!checkAiUsageLimit()) {
      onUpgradeRequired();
      return;
    }
    onFeatureSelect(featureId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">AI Features</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose an AI feature to boost your productivity</p>
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

        <div className="space-y-4">
          {/* Usage Status */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">AI Usage Today</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subscriptionStatus.dailyAiUsage} of {subscriptionStatus.dailyAiLimit} requests used
                </p>
              </div>
              <div className="text-right">
                {subscriptionStatus.canUseAi ? (
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Available</span>
                ) : (
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Limit Reached</span>
                )}
              </div>
            </div>
          </div>

          {/* AI Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiFeatures.map((feature) => (
              <Card 
                key={feature.id}
                className={`cursor-pointer transition-all hover:shadow-lg border ${
                  subscriptionStatus.canUseAi 
                    ? 'hover:border-purple-300 dark:hover:border-purple-600' 
                    : 'opacity-75'
                }`}
                onClick={() => handleFeatureClick(feature.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                  <div className="mt-3">
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                      disabled={!subscriptionStatus.canUseAi}
                    >
                      {subscriptionStatus.canUseAi ? 'Use Feature' : 'Upgrade Required'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!subscriptionStatus.canUseAi && (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You've reached your daily AI limit. Upgrade for unlimited access!
              </p>
              <Button 
                onClick={onUpgradeRequired}
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}