import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernTaskList } from "@/components/modern-task-list";
import { AdvancedTaskView } from "@/components/advanced-task-view";
import { SimpleTaskInput } from "@/components/simple-task-input";
import { ModernAIRefiner } from "@/components/modern-ai-refiner";
import UpgradeModal from "@/components/UpgradeModal";
import UpgradeProModal from "@/components/upgrade-pro-modal";
import DailyMotivationQuote from "@/components/daily-motivation-quote";
import TaskProgressRadar from "@/components/task-progress-radar";
import ConfettiBurst from "@/components/confetti-burst";
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
  
  const { user, signOut } = useAuth();
  const { subscriptionStatus, incrementAiUsage, checkAiUsageLimit, refreshStatus, resetAiUsage } = useSubscription();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Compact Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <img 
                src="/attached_assets/Planify_imresizer_1754161747016.jpg"
                alt="Planify"
                className="w-8 h-8 rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) nextElement.style.display = 'flex';
                }}
              />
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-sm" style={{display: 'none'}}>
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Planify
              </h1>
              {!subscriptionStatus.isPremium && (
                <div className="ml-4 px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit} AI requests
                </div>
              )}
              {subscriptionStatus.isPremium && (
                <div className="ml-4 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded-full flex items-center gap-1 font-medium">
                  <Crown className="w-3 h-3" />
                  Pro User
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSmartInput(!showSmartInput)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const canUseAi = await handleAiFeatureRequest();
                  if (canUseAi) {
                    setShowAIRefiner(!showAIRefiner);
                  }
                }}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <MessageCircle className="w-4 h-4" />
                AI Assistant
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 text-sm">
                    <p className="font-medium">{user?.firstName || "User"}</p>
                    <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-red-600 focus:text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteAccountMutation.mutate()}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleteAccountMutation.isPending}
                        >
                          {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Task Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Task Input */}
            {showSmartInput && (
              <SimpleTaskInput 
                onTaskCreated={() => setShowSmartInput(false)}
                onUpgradeRequired={() => setShowUpgradeModal(true)}
              />
            )}

            {/* AI Task Refiner */}
            {showAIRefiner && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">AI Task Refiner</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIRefiner(false)}
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
                  onUpgradeRequired={() => setShowUpgradeModal(true)}
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
          </div>

          {/* AI Features Sidebar */}
          <div className="space-y-4">
            {/* Dev Tools - Remove AI limits for testing */}
            <Card className="border-2 border-dashed border-orange-300 bg-orange-50 dark:bg-orange-900/20">
              <CardContent className="p-4 text-center">
                <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">
                  Dev Mode
                </h3>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/dev/reset-ai-usage', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: '{}'
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                          // Reset subscription status immediately
                          await resetAiUsage();
                          // Force refresh all cached queries
                          queryClient.invalidateQueries();
                          // Add a small delay to ensure database consistency
                          setTimeout(async () => {
                            await refreshStatus();
                          }, 200);
                          // Show success message
                          toast({
                            title: "Dev Mode",
                            description: "AI usage reset successfully! You now have 3 AI requests available.",
                          });
                        }
                      } else {
                        console.error('Failed to reset AI usage');
                      }
                    } catch (error) {
                      console.error('Failed to reset AI usage:', error);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-orange-800 border-orange-300 hover:bg-orange-100 dark:text-orange-200 dark:border-orange-600 dark:hover:bg-orange-800"
                >
                  Reset AI Usage (Dev)
                </Button>
              </CardContent>
            </Card>

            {/* Daily Motivation Quote */}
            <DailyMotivationQuote />
            
            {/* Task Progress Radar Chart */}
            <TaskProgressRadar />
            
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
                    onClick={() => setShowUpgradeProModal(true)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0 font-semibold"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now - $5/month
                  </Button>
                </CardContent>
              </Card>
            )}
            
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
      
      {/* Confetti Burst Animation */}
      <ConfettiBurst 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </div>
  );
}