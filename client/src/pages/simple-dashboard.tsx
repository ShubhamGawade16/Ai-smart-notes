import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernTaskList } from "@/components/modern-task-list";
import { AdvancedTaskView } from "@/components/advanced-task-view";
import { SimpleTaskInput } from "@/components/simple-task-input";
import { ModernAIRefiner } from "@/components/modern-ai-refiner";
import { UserProfile } from "@/components/user-profile";
import UpgradeModal from "@/components/UpgradeModal";
import UpgradeProModal from "@/components/upgrade-pro-modal";
import DailyMotivationQuote from "@/components/daily-motivation-quote";
import TaskProgressRadar from "@/components/task-progress-radar";
import ConfettiBurst from "@/components/confetti-burst";
import { CircularProgressChart } from "@/components/circular-progress-chart";
import { TestimonialsSection } from "@/components/testimonials-section";
import { UnlockProUI } from "@/components/unlock-pro-ui";
import { useAccessibilityEnhancements } from "@/components/accessibility-improvements";
import { 
  Brain, 
  MessageCircle, 
  Plus, 
  Sparkles,
  TrendingUp,
  Eye,
  User,
  LogOut,
  Trash2,
  Settings,
  Crown
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useTimezone } from "@/hooks/use-timezone";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Task } from "@shared/schema";

export default function SimpleDashboard() {
  const [showSmartInput, setShowSmartInput] = useState(false);
  const [showAIRefiner, setShowAIRefiner] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAdvancedViewOpen, setIsAdvancedViewOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showUpgradeProModal, setShowUpgradeProModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Initialize accessibility enhancements
  useAccessibilityEnhancements();
  
  const { user, signOut } = useAuth();
  const { subscriptionStatus, incrementAiUsage, checkAiUsageLimit, refreshStatus, resetAiUsage } = useSubscription();
  const { toast } = useToast();
  
  // Initialize timezone auto-detection
  useTimezone();

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/auth/delete-account');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      signOut();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAiFeatureRequest = async () => {
    if (!checkAiUsageLimit()) {
      setShowUpgradeModal(true);
      return false;
    }
    
    const canProceed = await incrementAiUsage();
    if (!canProceed) {
      setShowUpgradeModal(true);
      return false;
    }
    
    return true;
  };

  // Get greeting based on time of day
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">AI Task Refiner</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIRefiner(false)}
                    className="text-xs px-2 py-1"
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
            <ModernTaskList 
              onAdvancedView={(task) => {
                setSelectedTask(task);
                setIsAdvancedViewOpen(true);
              }}
              onTaskCompleted={() => {
                setShowConfetti(true);
              }}
            />

            {/* Moved Content from Sidebar to Fill White Space */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {/* Daily Motivation Quote */}
              <DailyMotivationQuote />
              
              {/* Progress Overview */}
              <CircularProgressChart />
              
              {/* Task Progress Radar Chart */}
              <TaskProgressRadar />
              
              {/* AI Tools */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
                <CardHeader className="pb-4 pt-6 px-6">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowSmartInput(!showSmartInput)}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Quick Add Task
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowAIRefiner(!showAIRefiner)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    AI Task Refiner
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/advanced-features'}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    View All AI Features
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
                <CardHeader className="pb-4 pt-6 px-6">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Active Tasks</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completed Today</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">AI Calls Used</span>
                      <span className="font-medium">
                        {subscriptionStatus.isPremium ? 'Unlimited' : `${subscriptionStatus.dailyAiUsage}/${subscriptionStatus.dailyAiLimit}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Features Sidebar */}
          <div className="space-y-4">
            {/* Dev Mode Controls - Toggle between free and premium testing */}
            {import.meta.env.DEV && (
              <Card className="border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-3 text-center">
                    Dev Mode Controls
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await apiRequest("POST", "/api/dev/toggle-premium");
                          if (response.ok) {
                            const data = await response.json();
                            await refreshStatus();
                            toast({
                              title: "Dev Mode",
                              description: `Switched to ${data.isPremium ? 'Premium' : 'Free'} user mode`,
                            });
                          }
                        } catch (error) {
                          console.error('Failed to toggle premium:', error);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full text-blue-800 border-blue-300 hover:bg-blue-100 dark:text-blue-200 dark:border-blue-600 dark:hover:bg-blue-800"
                    >
                      {subscriptionStatus.isPremium ? 'Switch to Free User' : 'Switch to Premium User'}
                    </Button>
                    <div className="text-xs text-center text-blue-700 dark:text-blue-300">
                      Current: {subscriptionStatus.isPremium ? 'Premium' : 'Free'} user
                      <br />
                      AI Usage: {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit === 999 ? '∞' : subscriptionStatus.dailyAiLimit}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            
            {/* Upgrade to Pro Card - Prominent placement */}
            {!subscriptionStatus.isPremium && (
              <Card className="border-2 border-gradient-to-r from-yellow-400 to-orange-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    Unlock Pro Features
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Get unlimited AI requests, advanced analytics, and personalized insights
                  </p>
                  <Button
                    onClick={() => window.location.href = '/upgrade'}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0 font-semibold"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now - $5/month
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Task View Dialog */}
      <AdvancedTaskView
        task={selectedTask}
        isOpen={isAdvancedViewOpen}
        onClose={() => {
          setIsAdvancedViewOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={(updatedTask) => {
          // Handle task update here
          console.log('Task updated:', updatedTask);
        }}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUsage={subscriptionStatus.dailyAiUsage}
        dailyLimit={subscriptionStatus.dailyAiLimit}
      />

      {/* Upgrade Pro Modal */}
      <UpgradeProModal 
        isOpen={showUpgradeProModal} 
        onClose={() => setShowUpgradeProModal(false)} 
      />
      
      {/* User Profile Settings Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UserProfile onClose={() => setShowProfile(false)} />
          </div>
        </div>
      )}
      
      {/* Confetti Burst Animation */}
      <ConfettiBurst 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </div>
  );
}