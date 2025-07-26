import { useState } from "react";
import { Header } from "@/components/header";
import { QuickAdd } from "@/components/quick-add";
import { TodaysPlan } from "@/components/todays-plan";
import { RecentNotes } from "@/components/recent-notes";
import { AIInsights } from "@/components/ai-insights";
import { ProgressStats } from "@/components/progress-stats";
import { QuickActions } from "@/components/quick-actions";
import { Categories } from "@/components/categories";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import FocusForecast from "@/components/focus-forecast";
import TaskRefiner from "@/components/task-refiner";
import AutoScheduler from "@/components/auto-scheduler";
import HabitGamification from "@/components/habit-gamification";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const isMobile = useIsMobile();

  const renderMobileContent = () => {
    switch (activeTab) {
      case 'today':
        return (
          <div className="space-y-6">
            <QuickAdd />
            <TodaysPlan />
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            <QuickAdd />
            <TodaysPlan />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FocusForecast />
              <TaskRefiner />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AutoScheduler />
              <HabitGamification />
            </div>
            <AIInsights />
            <ProgressStats />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isMobile ? (
          <>
            <div className="pb-20">
              {renderMobileContent()}
            </div>
            <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
          </>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="xl:col-span-3 space-y-6">
              <QuickAdd />
              <TodaysPlan />
              
              {/* AI Features Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  AI Features
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FocusForecast />
                  <TaskRefiner />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AutoScheduler />
                  <HabitGamification />
                </div>
              </div>
              
              <RecentNotes />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <AIInsights />
              <ProgressStats />
              <QuickActions />
              <Categories />
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform lg:hidden"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
