import { useState } from 'react';
import { ConversationalRefiner } from '@/components/ConversationalRefiner';
import { SmartTaskInput } from '@/components/SmartTaskInput';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'wouter';

export default function TaskRefiner() {
  const [selectedTask, setSelectedTask] = useState('');
  const [refinedTasks, setRefinedTasks] = useState<any[]>([]);
  const [showRefiner, setShowRefiner] = useState(false);

  const handleTasksRefined = (tasks: any[]) => {
    setRefinedTasks(tasks);
    // Here you could create the tasks in the system
    console.log('Refined tasks:', tasks);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Task Refiner
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Use AI to break down complex tasks, get suggestions, and optimize your workflow
          </p>
        </div>

        <div className="space-y-6">
          {/* Phase 4: Conversational Task Refiner */}
          {showRefiner ? (
            <ConversationalRefiner
              initialTask={selectedTask}
              onTasksRefined={handleTasksRefined}
              onClose={() => setShowRefiner(false)}
            />
          ) : (
            <div className="space-y-4">
              <SmartTaskInput
                onTaskCreated={() => {
                  // Task created successfully
                }}
              />
              
              <div className="text-center">
                <Button
                  onClick={() => setShowRefiner(true)}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Task Refinement Session
                </Button>
              </div>
            </div>
          )}

          {/* Show refined tasks */}
          {refinedTasks.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold">Refined Tasks Ready to Create</h3>
              <div className="space-y-3">
                {refinedTasks.map((task, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {task.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {task.priority}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {task.estimatedTime}min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}