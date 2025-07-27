import { useState } from "react";
import { Header } from "@/components/header";
import { QuickAdd } from "@/components/quick-add";
import { TodaysPlan } from "@/components/todays-plan";
import { RecentNotes } from "@/components/recent-notes";
import { AIInsights } from "@/components/ai-insights";
import { AIInsightsEnhanced } from "@/components/ai-insights-enhanced";
import { ProgressStats } from "@/components/progress-stats";
import { QuickActions } from "@/components/quick-actions";
import { Categories } from "@/components/categories";
import { NotificationSystem } from "@/components/notification-system";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { ProductivityInsightsDashboard } from "@/components/productivity-insights-dashboard";
import { SmartReminderRecalibration } from "@/components/smart-reminder-recalibration";
import { RecurringTaskGeneratorTuner } from "@/components/recurring-task-generator-tuner";
import { TaskDecayDeclutter } from "@/components/task-decay-declutter";
import { MoodAwareTaskSuggestions } from "@/components/mood-aware-suggestions";
import { GoalTrackingAlignment } from "@/components/goal-tracking-alignment";
import { useIsMobile } from "@/hooks/use-mobile";
import { FocusForecast } from "@/components/FocusForecast";
import { ProductivityInsights } from "@/components/ProductivityInsights";
import { SmartTaskInput } from "@/components/SmartTaskInput";
import { ConversationalRefiner } from "@/components/ConversationalRefiner";
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
            <ProductivityInsights />
            <FocusForecast />
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
              <SmartTaskInput />
              <TodaysPlan />
              
              {/* Phase 3: AI Features Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  AI-Powered Features
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProductivityInsights />
                  <FocusForecast />
                </div>
              </div>
              
              <RecentNotes />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <AIInsightsEnhanced />
              <ProgressStats />
              <QuickActions />
              <Categories />
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for mobile */}
      {isMobile && (
        <Button
          size="lg"
          className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform z-40"
          onClick={() => {
            // Focus on the quick add input
            const quickAddInput = document.querySelector('input[placeholder*="What would you like to add"]') as HTMLInputElement;
            if (quickAddInput) {
              quickAddInput.focus();
              quickAddInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
