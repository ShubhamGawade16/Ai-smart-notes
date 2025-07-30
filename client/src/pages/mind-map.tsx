import { TaskMindMap } from "@/components/task-mind-map";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function MindMapPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Task Mind Map
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize task relationships and get AI-powered optimization advice
            </p>
          </div>
        </div>

        {/* Mind Map Component */}
        <TaskMindMap />
      </div>
    </div>
  );
}