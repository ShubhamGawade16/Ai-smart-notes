import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernTaskList } from "@/components/modern-task-list";
import { AdvancedTaskView } from "@/components/advanced-task-view";
import { SimpleTaskInput } from "@/components/simple-task-input";
import { ModernAIRefiner } from "@/components/modern-ai-refiner";
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
  Settings
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/delete-account', 'DELETE');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Compact Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src="@assets/Planify_imresizer(1)_1753901727720.jpg" alt="Planify" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Planify
              </h1>
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
                onClick={() => setShowAIRefiner(!showAIRefiner)}
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
              <SimpleTaskInput onTaskCreated={() => setShowSmartInput(false)} />
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
                />
              </div>
            )}

            {/* Task List */}
            <ModernTaskList 
              onAdvancedView={(task) => {
                setSelectedTask(task);
                setIsAdvancedViewOpen(true);
              }}
            />
          </div>

          {/* AI Features Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  Task Refiner
                </Button>
                
                <Link href="/advanced-features">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    All AI Features
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                    <span className="font-medium">Unlimited</span>
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
    </div>
  );
}