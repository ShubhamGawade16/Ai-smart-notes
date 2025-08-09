import { useState } from "react";
import { Header } from "@/components/header";
import { ModernTaskList } from "@/components/modern-task-list";
import { RecentNotes } from "@/components/recent-notes";
import { ProductivityInsights } from "@/components/productivity-insights";
import { FocusForecast } from "@/components/focus-forecast-simple";
import { AIBrainDashboard } from "@/components/ai-brain-dashboard";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Plus, Brain } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "wouter";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const isMobile = useIsMobile();

  const renderMobileContent = () => {
    switch (activeTab) {
      case 'today':
        return (
          <div className="space-y-6">
            <ModernTaskList />
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            <ModernTaskList />
          </div>
        );
      case 'notes':
        return (
          <div className="space-y-6">
            <RecentNotes />
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6">
            <AIBrainDashboard />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {isMobile ? (
          <>
            <div className="pb-20 px-2 sm:px-0">
              {renderMobileContent()}
            </div>
            <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
          </>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Column - Modern Task List */}
            <div className="xl:col-span-3">
              <ModernTaskList />
            </div>
            
            {/* Right Sidebar - AI Features */}
            <div className="space-y-4">
              {/* AI Features Quick Access */}
              <div className="card-animate bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900 group overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Features</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Enhance your productivity with AI-powered tools
                </p>
                <Link href="/advanced-features">
                  <Button className="btn-hover w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
                    Explore AI Tools
                  </Button>
                </Link>
              </div>
              
              <ProductivityInsights />
              <FocusForecast />
              <RecentNotes />
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for mobile */}
      {isMobile && (
        <Button
          size="lg"
          className="btn-hover fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-xl hover:scale-110 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 transition-all duration-300 z-40 animate-pulse min-h-[56px] touch-manipulation"
          onClick={() => {
            // Find and click the "New Task" button instead
            const newTaskButton = document.querySelector('button[title="Create New Task"]') as HTMLButtonElement;
            if (newTaskButton) {
              newTaskButton.click();
            }
          }}
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      )}
    </div>
  );
}
