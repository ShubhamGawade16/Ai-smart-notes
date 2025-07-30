import { useState } from "react";
import { Header } from "@/components/header";
import { QuickAdd } from "@/components/quick-add";
import { TodaysPlan } from "@/components/todays-plan";
import { RecentNotes } from "@/components/recent-notes";
import { ProductivityInsights } from "@/components/productivity-insights";
import { FocusForecast } from "@/components/focus-forecast-simple";
import { AIBrainDashboard } from "@/components/ai-brain-dashboard";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
            <AIBrainDashboard />
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Tasks */}
            <div className="xl:col-span-2 space-y-6">
              <QuickAdd />
              <TodaysPlan />
            </div>
            
            {/* Right Column - AI Features */}
            <div className="space-y-6">
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
