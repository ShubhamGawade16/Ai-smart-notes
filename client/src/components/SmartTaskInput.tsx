import React, { useState } from 'react';
import { Plus, Wand2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
// import { useUpgrade } from '@/hooks/useUpgrade';

interface TaskAnalysis {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags: string[];
  estimatedTime: number;
  dueDate?: Date;
  contextSwitchCost?: number;
}

interface SmartTaskInputProps {
  onTaskCreated?: () => void;
}

export const SmartTaskInput: React.FC<SmartTaskInputProps> = ({ onTaskCreated }) => {
  const [input, setInput] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Mock upgrade hooks for testing (no limitations)
  const canUseFeature = (_feature: string) => true;
  const hasReachedLimit = (_limitType: string) => false;
  const handleApiError = (_error: Error) => false;
  const limits = {
    tier: 'premium_pro' as const,
    unlimited: true,
    dailyAiCalls: { limit: -1, used: 0, remaining: -1 },
    monthlyTasks: { limit: -1, used: 0, remaining: -1 }
  };

  // AI Task Parsing Mutation
  const parseTaskMutation = useMutation({
    mutationFn: async (taskInput: string) => {
      const response = await apiRequest('POST', '/api/ai/parse-task', { input: taskInput });
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setIsAnalyzing(false);
      toast({
        title: "Smart Analysis Complete",
        description: "Your task has been analyzed and enhanced by AI.",
      });
    },
    onError: (error: Error) => {
      setIsAnalyzing(false);
      if (!handleApiError(error)) {
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze task. Creating basic task instead.",
          variant: "destructive",
        });
      }
    },
  });

  // Task Creation Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest('POST', '/api/tasks', taskData);
      return await response.json();
    },
    onSuccess: () => {
      setInput('');
      setAnalysis(null);
      setUseAI(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats'] });
      onTaskCreated?.();
      
      toast({
        title: "Task Created",
        description: analysis ? "Smart task created with AI enhancements!" : "Task added successfully!",
      });
    },
    onError: (error: Error) => {
      if (!handleApiError(error)) {
        toast({
          title: "Creation Failed",
          description: "Failed to create task. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAnalyze = () => {
    if (!input.trim()) return;
    
    if (!canUseFeature('basic_tasks') || hasReachedLimit('daily_ai')) {
      handleApiError(new Error('Daily limit exceeded'));
      return;
    }
    
    setIsAnalyzing(true);
    parseTaskMutation.mutate(input);
  };

  const handleCreate = () => {
    if (!input.trim()) return;
    
    const taskData = analysis ? {
      title: analysis.title,
      description: analysis.description,
      priority: analysis.priority,
      category: analysis.category,
      tags: analysis.tags,
      estimatedTime: analysis.estimatedTime,
      dueDate: analysis.dueDate,
      useAiParsing: false, // Already parsed
    } : {
      title: input,
      useAiParsing: useAI,
    };
    
    createTaskMutation.mutate(taskData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (useAI && !analysis) {
        handleAnalyze();
      } else {
        handleCreate();
      }
    }
  };

  const canUseAI = canUseFeature('basic_tasks') && !hasReachedLimit('daily_ai');
  const isPro = limits && ['basic_pro', 'advanced_pro', 'premium_pro'].includes(limits.tier);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <Label htmlFor="task-input" className="text-sm font-medium">
          Add New Task
        </Label>
        
        {/* AI Toggle */}
        <div className="flex items-center space-x-2">
          <Sparkles className={`w-4 h-4 ${canUseAI ? 'text-purple-500' : 'text-gray-400'}`} />
          <Switch
            id="ai-mode"
            checked={useAI && canUseAI}
            onCheckedChange={(checked) => setUseAI(checked && canUseAI)}
            disabled={!canUseAI}
          />
          <Label htmlFor="ai-mode" className="text-xs">
            Smart Mode
            {!isPro && <Badge variant="outline" className="ml-1 text-xs">Pro</Badge>}
          </Label>
        </div>
      </div>

      {/* Usage Stats for Free Users */}
      {limits && !limits.unlimited && (
        <div className="text-xs text-gray-500 flex justify-between">
          <span>
            AI calls: {limits.dailyAiCalls?.used || 0}/{limits.dailyAiCalls?.limit || 5}
          </span>
          <span>
            Tasks: {limits.monthlyTasks?.used || 0}/{limits.monthlyTasks?.limit || 50}
          </span>
        </div>
      )}

      <div className="space-y-3">
        <Input
          id="task-input"
          placeholder={useAI ? 
            "Describe your task naturally... (e.g., 'Call John about the project by Friday')" : 
            "Enter task title..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full"
        />

        {/* AI Analysis Results */}
        {analysis && (
          <div className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/10 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Wand2 className="w-4 h-4" />
              <span className="font-medium text-sm">AI Enhanced Task</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Title:</span> {analysis.title}
              </div>
              {analysis.description && (
                <div>
                  <span className="font-medium">Description:</span> {analysis.description}
                </div>
              )}
              <div className="flex gap-4">
                <span>
                  <span className="font-medium">Priority:</span> 
                  <Badge variant="outline" className="ml-1">{analysis.priority}</Badge>
                </span>
                <span>
                  <span className="font-medium">Time:</span> {analysis.estimatedTime}min
                </span>
              </div>
              {analysis.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-medium">Tags:</span>
                  {analysis.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {useAI && !analysis ? (
            <Button
              onClick={handleAnalyze}
              disabled={!input.trim() || isAnalyzing || !canUseAI}
              className="flex-1"
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={!input.trim() || createTaskMutation.isPending}
              className="flex-1"
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {analysis ? 'Create Enhanced Task' : 'Add Task'}
                </>
              )}
            </Button>
          )}
          
          {analysis && (
            <Button
              variant="ghost"
              onClick={() => {
                setAnalysis(null);
                setUseAI(false);
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};