import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Menu,
  X,
  CheckSquare,
  StickyNote,
  Activity,
  Brain,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown,
  Lock,
  Upgrade,
  Sparkles,
  Clock,
  BarChart3,
  Zap
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  dailyAiCalls: number;
  maxDailyAiCalls: number;
  userTier: 'free' | 'pro';
}

export function UnifiedSidebar({ isCollapsed, onToggle, dailyAiCalls, maxDailyAiCalls, userTier }: SidebarProps) {
  const [location] = useLocation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const menuItems = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      path: '/',
      count: 0 // Would be dynamic in real app
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: StickyNote,
      path: '/notes',
      count: 0,
      proOnly: false
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: Activity,
      path: '/insights',
      proOnly: false
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: Brain,
      path: '/ai-assistant',
      proOnly: false
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: Target,
      path: '/goals',
      proOnly: userTier === 'free' // Show only after 5 tasks created
    }
  ];

  const handleProOnlyClick = (item: any) => {
    if (item.proOnly && userTier === 'free') {
      setShowUpgradeModal(true);
      return;
    }
    // Navigate normally
  };

  const aiCallsUsed = maxDailyAiCalls - dailyAiCalls;
  const aiCallsPercentage = (aiCallsUsed / maxDailyAiCalls) * 100;

  return (
    <>
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-card border-r border-border flex flex-col h-screen sticky top-0`}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-foreground">Smart To-Do AI</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-2"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* AI Calls Remaining - Always Visible */}
        <div className="p-4 border-b border-border">
          <Card className={`${userTier === 'free' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
            <CardContent className="p-3">
              {!isCollapsed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">AI Calls Today</span>
                    <Badge variant={userTier === 'free' ? 'destructive' : 'secondary'}>
                      {dailyAiCalls}/{maxDailyAiCalls}
                    </Badge>
                  </div>
                  <Progress value={aiCallsPercentage} className="h-2" />
                  {userTier === 'free' && dailyAiCalls < 2 && (
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Running low! Upgrade for unlimited AI calls.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Badge variant={userTier === 'free' ? 'destructive' : 'secondary'} className="text-xs">
                    {dailyAiCalls}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            const isLocked = item.proOnly && userTier === 'free';

            return (
              <div key={item.id}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start p-3 h-auto ${isCollapsed ? 'px-3' : ''}`}
                  onClick={() => handleProOnlyClick(item)}
                  disabled={isLocked}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="relative">
                      <Icon className={`h-5 w-5 ${isLocked ? 'text-gray-400' : ''}`} />
                      {isLocked && (
                        <Lock className="h-3 w-3 text-orange-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className={`flex-1 text-left ${isLocked ? 'text-gray-400' : ''}`}>
                          {item.label}
                        </span>
                        {item.count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {item.count}
                          </Badge>
                        )}
                        {isLocked && (
                          <Crown className="h-4 w-4 text-orange-500" />
                        )}
                      </>
                    )}
                  </div>
                </Button>
              </div>
            );
          })}
        </nav>

        {/* Upgrade Button - Always Visible for Free Users */}
        {userTier === 'free' && (
          <div className="p-4 border-t border-border">
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size={isCollapsed ? "sm" : "default"}
            >
              <Crown className="h-4 w-4 mr-2" />
              {!isCollapsed && "Upgrade to Pro"}
            </Button>
          </div>
        )}

        {/* Settings */}
        <div className="p-4 border-t border-border">
          <Link href="/settings">
            <Button
              variant="ghost"
              className={`w-full justify-start p-3 ${isCollapsed ? 'px-3' : ''}`}
            >
              <Settings className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Settings</span>}
            </Button>
          </Link>
        </div>
      </div>

      {/* Contextual Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-indigo-600" />
              Unlock Pro Features
            </DialogTitle>
            <DialogDescription>
              Get unlimited AI insights and advanced features
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                Pro All-Inclusive - ₹12/month
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-indigo-600 mr-2" />
                  Unlimited AI calls & insights
                </li>
                <li className="flex items-center">
                  <Target className="h-4 w-4 text-indigo-600 mr-2" />
                  Advanced goal tracking
                </li>
                <li className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-indigo-600 mr-2" />
                  Focus forecast & auto-schedule
                </li>
                <li className="flex items-center">
                  <Clock className="h-4 w-4 text-indigo-600 mr-2" />
                  Priority support
                </li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={() => setShowUpgradeModal(false)}
                variant="outline" 
                className="flex-1"
              >
                Try it free for 7 days
              </Button>
              <Button 
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                Upgrade Now
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              ✨ No credit card required for trial • Cancel anytime
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}