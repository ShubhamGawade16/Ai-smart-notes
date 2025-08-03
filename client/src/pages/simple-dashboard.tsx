import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernTaskList } from "@/components/modern-task-list";
import { AdvancedTaskView } from "@/components/advanced-task-view";
import { SimpleTaskInput } from "@/components/simple-task-input";
import { ModernAIRefiner } from "@/components/modern-ai-refiner";
import UpgradeModal from "@/components/UpgradeModal";
import DailyMotivationQuote from "@/components/daily-motivation-quote";
import TaskProgressRadar from "@/components/task-progress-radar";
import ConfettiBurst from "@/components/confetti-burst";
import TodayTasks from "@/components/today-tasks";
import DashboardStats from "@/components/dashboard-stats";
import CompletedTasks from "@/components/completed-tasks";
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
import { apiRequest } from "@/lib/queryClient";
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
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { user, signOut } = useAuth();
  const { subscriptionStatus, incrementAiUsage, checkAiUsageLimit } = useSubscription();
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Today's Tasks */}
          <div className="space-y-6">
            <TodayTasks />
            
            {/* Task Input */}
            {showSmartInput && (
              <SimpleTaskInput 
                onTaskCreated={() => setShowSmartInput(false)}
                onUpgradeRequired={() => setShowUpgradeModal(true)}
              />
            )}

            {/* AI Task Refiner */}
            {showAIRefiner && (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">AI Task Refiner</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIRefiner(false)}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <ModernAIRefiner 
                    onClose={() => setShowAIRefiner(false)}
                    onTasksRefined={(tasks) => {
                      console.log('Refined tasks:', tasks);
                      setShowAIRefiner(false);
                    }}
                    onUpgradeRequired={() => setShowUpgradeModal(true)}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats and Completed Tasks */}
          <div className="space-y-6">
            <DashboardStats />
            <CompletedTasks />
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
      
      {/* Confetti Burst Animation */}
      <ConfettiBurst 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </div>
  );
}