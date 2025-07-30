import { AIBrainDashboard } from "@/components/ai-brain-dashboard";
import { Header } from "@/components/header";

export default function AIControlCenter() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            AI Control Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Your AI Brain is controlling and optimizing your entire productivity experience
          </p>
        </div>
        
        <AIBrainDashboard />
      </div>
    </div>
  );
}