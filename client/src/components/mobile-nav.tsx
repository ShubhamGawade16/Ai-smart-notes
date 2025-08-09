import { Button } from "@/components/ui/button";
import { CalendarDays, CheckSquare, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs = [
    { id: 'today', label: 'Today', icon: CalendarDays },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'ai', label: 'AI', icon: Zap },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/98 dark:bg-gray-900/98 border-t border-gray-200/80 dark:border-gray-700/80 z-50 backdrop-blur-lg">
      <div className="grid grid-cols-4 h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center space-y-0.5 h-full rounded-xl mx-0.5 transition-all duration-200 min-h-[44px] active:scale-95",
                isActive 
                  ? "text-teal-600 dark:text-teal-400 bg-teal-50/70 dark:bg-teal-900/30 shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 active:bg-gray-100 dark:active:bg-gray-800"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium leading-tight">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
