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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/98 dark:bg-gray-900/98 border-t border-gray-200/60 dark:border-gray-700/60 z-50 backdrop-blur-xl">
      <div className="grid grid-cols-4 h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center space-y-1.5 h-full rounded-2xl mx-1 transition-all duration-300 min-h-[44px] active:scale-90 touch-manipulation",
                isActive 
                  ? "text-teal-600 dark:text-teal-400 bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/40 dark:to-teal-900/20 shadow-lg border border-teal-200/50 dark:border-teal-700/50" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 active:bg-gray-200 dark:active:bg-gray-700"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")} />
              <span className={cn("text-xs font-medium transition-all duration-200", isActive && "font-semibold")}>{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
