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
  Eye
} from "lucide-react";
import { Link } from "wouter";
import type { Task } from "@shared/schema";

export default function SimpleDashboard() {
  const [showSmartInput, setShowSmartInput] = useState(false);
  const [showAIRefiner, setShowAIRefiner] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAdvancedViewOpen, setIsAdvancedViewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src="@assets/Planify_1753901415287.png" alt="Planify" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Planify
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSmartInput(!showSmartInput)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIRefiner(!showAIRefiner)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                AI Refiner
              </Button>
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