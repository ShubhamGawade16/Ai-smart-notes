import { useState, useEffect } from "react";
import { Plus, MessageCircle, User, Settings, LogOut, Trash2, Crown, Target, Clock, CheckCircle2, Calendar, Timer, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { SimpleTaskInput } from "@/components/simple-task-input";
import { ModernTaskList } from "@/components/modern-task-list";
import { ModernAIRefiner } from "@/components/modern-ai-refiner";
import { EnhancedSmartTiming } from "@/components/enhanced-smart-timing";
import UpgradeProModal from "@/components/upgrade-pro-modal";
// Removed profile modal for now
import type { Task } from "@shared/schema";

export default function MobileOptimizedDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { subscriptionStatus, checkAiUsageLimit, incrementAiUsage } = useSubscription();
  
  const [activeTab, setActiveTab] = useState("today");
  const [showSmartInput, setShowSmartInput] = useState(false);
  const [showAIRefiner, setShowAIRefiner] = useState(false);
  const [showUpgradeProModal, setShowUpgradeProModal] = useState(false);
  // Profile settings will be implemented later

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!user,
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/user/account");
      if (!response.ok) throw new Error("Failed to delete account");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      signOut();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-First Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="px-3 sm:px-4 py-3">
          {/* Top Row: Logo + Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                Planify
              </h1>
            </div>
            
            {/* Subscription Status */}
            <div className="flex items-center gap-2">
              {userProfile?.tier !== 'free' ? (
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs px-2 py-1">
                  <Crown className="w-3 h-3 mr-1" />
                  {userProfile?.tier === 'basic' ? 'Basic' : 'Pro'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit}
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1.5">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-sm">
                    <p className="font-medium truncate">{userProfile?.firstName || "User"}</p>
                    <p className="text-gray-500 dark:text-gray-400 truncate text-xs">{userProfile?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => alert('Profile settings coming soon!')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
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

          {/* Welcome Message */}
          <div className="mb-3">
            <h2 className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Good {getGreeting()}, {userProfile?.displayName || userProfile?.email?.split('@')[0] || 'there'}!
            </h2>
            {userProfile?.tier === 'free' && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit} AI requests used today
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSmartInput(!showSmartInput)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 h-8"
            >
              <Plus className="w-3 h-3" />
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
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 h-8"
            >
              <MessageCircle className="w-3 h-3" />
              AI Assistant
            </Button>

            {userProfile?.tier === 'free' && (
              <Button
                onClick={() => setShowUpgradeProModal(true)}
                size="sm"
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xs px-3 py-1.5 h-8"
              >
                <Crown className="w-3 h-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-2 sm:px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-4">
              {/* Task Input */}
              {showSmartInput && (
                <Card className="p-3 sm:p-4">
                  <SimpleTaskInput 
                    onTaskCreated={() => setShowSmartInput(false)}
                    onUpgradeRequired={() => setShowUpgradeProModal(true)}
                  />
                </Card>
              )}

              {/* AI Refiner */}
              {showAIRefiner && (
                <Card className="p-3 sm:p-4">
                  <ModernAIRefiner
                    onUpgradeRequired={() => setShowUpgradeProModal(true)}
                    onTasksRefined={(tasks) => {
                      setShowAIRefiner(false);
                      toast({
                        title: "Tasks Created",
                        description: `${tasks.length} refined tasks added to your list.`,
                      });
                    }}
                  />
                </Card>
              )}

              {/* Task Lists with Mobile-Optimized Tabs */}
              <Card className="p-3 sm:p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4 h-9">
                    <TabsTrigger value="today" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Today</span>
                      <span className="sm:hidden">Today</span>
                    </TabsTrigger>
                    <TabsTrigger value="all" className="text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">All</span>
                      <span className="sm:hidden">All</span>
                    </TabsTrigger>
                    <TabsTrigger value="done" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Done</span>
                      <span className="sm:hidden">Done</span>
                    </TabsTrigger>
                    <TabsTrigger value="smart-timing" className="text-xs">
                      <Timer className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Timing</span>
                      <span className="sm:hidden">AI</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="today" className="mt-0">
                    <ModernTaskList 
                      filter="today" 
                      onUpgradeRequired={() => setShowUpgradeProModal(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="all" className="mt-0">
                    <ModernTaskList 
                      filter="all" 
                      onUpgradeRequired={() => setShowUpgradeProModal(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="done" className="mt-0">
                    <ModernTaskList 
                      filter="completed" 
                      onUpgradeRequired={() => setShowUpgradeProModal(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="smart-timing" className="mt-0">
                    <EnhancedSmartTiming />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Sidebar - Hidden on Mobile */}
            <div className="hidden lg:block space-y-4">
              {/* Quick Stats */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI Requests</span>
                    <Badge variant="outline" className="text-xs">
                      {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Plan</span>
                    <Badge variant="outline" className="text-xs">
                      {userProfile?.tier || 'Free'}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Upgrade Card for Free Users */}
              {userProfile?.tier === 'free' && (
                <Card className="p-4 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-950 dark:to-blue-950 border-teal-200 dark:border-teal-800">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Upgrade to Pro</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Unlock unlimited AI features and advanced task management
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowUpgradeProModal(true)}
                      className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UpgradeProModal 
        isOpen={showUpgradeProModal} 
        onClose={() => setShowUpgradeProModal(false)} 
      />
    </div>
  );
}