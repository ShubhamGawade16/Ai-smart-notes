import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SimpleTaskInput } from "@/components/simple-task-input";
import { ModernTaskList } from "@/components/modern-task-list";
import { ModernAIRefiner } from "@/components/modern-ai-refiner";
import UpgradeModal from "@/components/upgrade-modal-new";
// import AdvancedTaskView from "@/components/advanced-task-view";
import ConfettiBurst from "@/components/confetti-burst";
import { Plus, MessageCircle, Crown, User, Settings, LogOut, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MobileDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscriptionStatus, checkAiUsageLimit, incrementAiUsage } = useSubscription();
  
  const [showSmartInput, setShowSmartInput] = useState(false);
  const [showAIRefiner, setShowAIRefiner] = useState(false);
  const [showUpgradeProModal, setShowUpgradeProModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isAdvancedViewOpen, setIsAdvancedViewOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAiFeatureRequest = async (): Promise<boolean> => {
    if (!checkAiUsageLimit()) {
      setShowUpgradeProModal(true);
      return false;
    }
    
    try {
      await incrementAiUsage();
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
      return true;
    } catch (error) {
      console.error('Failed to increment AI usage:', error);
      setShowUpgradeProModal(true);
      return false;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Clean Modern Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          {/* Header Content */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Planify
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Good {getGreeting()}, {user?.displayName || user?.email?.split('@')[0] || 'there'}!
                </p>
              </div>
            </div>
            
            {/* Subscription Badge */}
            <div className="flex items-center gap-2">
              {subscriptionStatus.isPremium ? (
                <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-3 py-1 text-sm font-medium">
                  <Crown className="w-4 h-4 mr-1" />
                  Pro
                </Badge>
              ) : (
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">AI Usage</div>
                  <Badge variant="outline" className="text-sm font-medium">
                    {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowSmartInput(!showSmartInput)}
              className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white border-0 shadow-md"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (checkAiUsageLimit()) {
                  setShowAIRefiner(!showAIRefiner);
                } else {
                  setShowUpgradeProModal(true);
                }
              }}
              className="border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>

            {!subscriptionStatus.isPremium && (
              <Button
                onClick={() => setShowUpgradeProModal(true)}
                size="sm"
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0 shadow-md"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            )}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 dark:border-gray-600"
                >
                  <User className="w-4 h-4 mr-2" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium">{user?.firstName || "User"}</p>
                  <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => alert('Profile settings coming soon!')} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Task Input */}
          {showSmartInput && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <SimpleTaskInput 
                onTaskCreated={() => setShowSmartInput(false)}
                onUpgradeRequired={() => setShowUpgradeProModal(true)}
                onAiUsageIncrement={handleAiFeatureRequest}
              />
            </div>
          )}

          {/* AI Task Refiner */}
          {showAIRefiner && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Task Refiner</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIRefiner(false)}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
              <ModernAIRefiner 
                onClose={() => setShowAIRefiner(false)}
                onTasksRefined={(tasks) => {
                  console.log('Refined tasks:', tasks);
                  setShowAIRefiner(false);
                }}
                onUpgradeRequired={() => setShowUpgradeProModal(true)}
                onAiUsageIncrement={handleAiFeatureRequest}
              />
            </div>
          )}

          {/* Task List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <ModernTaskList 
              onAdvancedView={(task) => {
                setSelectedTask(task);
                setIsAdvancedViewOpen(true);
              }}
              onTaskCompleted={() => {
                setShowConfetti(true);
              }}
              onAiView={() => {
                if (checkAiUsageLimit()) {
                  setShowAIRefiner(true);
                } else {
                  setShowUpgradeProModal(true);
                }
              }}
            />
          </div>

          {/* Mobile-Only Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">AI Usage</h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Status</h3>
              <div className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                {subscriptionStatus.isPremium ? 'Pro User' : 'Free Plan'}
              </div>
            </div>
          </div>

          {/* Upgrade Card for Free Users */}
          {!subscriptionStatus.isPremium && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg border-2 border-amber-200 dark:border-amber-700 p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Unlock Pro Features
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get unlimited AI requests, advanced analytics, and personalized insights
              </p>
              <Button
                onClick={() => setShowUpgradeProModal(true)}
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0 px-8 py-3 text-lg font-semibold rounded-xl"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Task View Dialog - Temporarily disabled */}
      {isAdvancedViewOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdvancedViewOpen(false);
                  setSelectedTask(null);
                }}
              >
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{selectedTask.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedTask.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{selectedTask.priority}</Badge>
                <Badge variant="outline">{selectedTask.category}</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeProModal} 
        onClose={() => setShowUpgradeProModal(false)} 
      />
      
      {/* Confetti Burst Animation */}
      <ConfettiBurst 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </div>
  );
}