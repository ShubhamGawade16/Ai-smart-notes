import React, { useState } from 'react';
import { Trophy, Flame, Star, Medal, Gift, Target, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUpgrade } from '@/hooks/useUpgrade';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
}

interface Streak {
  type: 'daily_tasks' | 'focus_sessions' | 'goals_met';
  current: number;
  longest: number;
  lastUpdated: Date;
}

interface UserStats {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  achievements: Achievement[];
  streaks: Streak[];
  weeklyGoal: number;
  weeklyProgress: number;
}

export const HabitGamification: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'streaks'>('overview');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseFeature, showUpgradeModal } = useUpgrade();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/gamification/stats'],
    enabled: canUseFeature('habit_gamification'),
  });

  const stats: UserStats = statsData?.stats || {
    level: 1,
    totalPoints: 0,
    pointsToNextLevel: 100,
    achievements: [],
    streaks: [],
    weeklyGoal: 20,
    weeklyProgress: 0,
  };

  const claimRewardMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const response = await apiRequest('POST', '/api/gamification/claim-reward', { achievementId });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/stats'] });
      toast({
        title: "Reward Claimed!",
        description: `You earned ${data.points} points!`,
      });
    },
  });

  if (!canUseFeature('habit_gamification')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Habit Gamification
            <Badge variant="outline">Premium Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Level Up Your Productivity</h3>
            <p className="text-gray-600 mb-4">
              Unlock achievements, build streaks, and gamify your productivity journey with points, levels, and rewards.
            </p>
            <Button 
              onClick={() => showUpgradeModal('habit_gamification', 'Habit gamification requires Premium Pro subscription for achievement tracking.')}
            >
              Upgrade to Premium Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Habit Gamification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600 bg-amber-50';
      case 'silver': return 'text-gray-600 bg-gray-50';
      case 'gold': return 'text-yellow-600 bg-yellow-50';
      case 'platinum': return 'text-purple-600 bg-purple-50';
    }
  };

  const getTierIcon = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return Medal;
      case 'silver': return Medal;
      case 'gold': return Trophy;
      case 'platinum': return Star;
    }
  };

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first task',
      icon: '🎯',
      progress: 1,
      maxProgress: 1,
      tier: 'bronze',
      points: 10,
      unlockedAt: new Date(),
    },
    {
      id: '2',
      title: 'Task Master',
      description: 'Complete 10 tasks in a single day',
      icon: '⚡',
      progress: 7,
      maxProgress: 10,
      tier: 'silver',
      points: 50,
    },
    {
      id: '3',
      title: 'Streak Keeper',
      description: 'Maintain a 7-day completion streak',
      icon: '🔥',
      progress: 5,
      maxProgress: 7,
      tier: 'gold',
      points: 100,
    },
    {
      id: '4',
      title: 'AI Pioneer',
      description: 'Use AI features 50 times',
      icon: '🤖',
      progress: 23,
      maxProgress: 50,
      tier: 'platinum',
      points: 200,
    },
  ];

  const mockStreaks: Streak[] = [
    {
      type: 'daily_tasks',
      current: 5,
      longest: 12,
      lastUpdated: new Date(),
    },
    {
      type: 'focus_sessions',
      current: 3,
      longest: 8,
      lastUpdated: new Date(),
    },
    {
      type: 'goals_met',
      current: 2,
      longest: 5,
      lastUpdated: new Date(),
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Level & Points */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold">Level {stats.level}</span>
          </div>
          <div className="text-sm text-gray-600">
            {stats.totalPoints} points
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress to Level {stats.level + 1}</span>
            <span>{stats.pointsToNextLevel} points needed</span>
          </div>
          <Progress 
            value={(stats.totalPoints % 100)} 
            className="h-2" 
          />
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="font-medium text-sm">Weekly Goal</span>
          </div>
          <Badge variant="outline">
            {stats.weeklyProgress}/{stats.weeklyGoal} tasks
          </Badge>
        </div>
        
        <Progress 
          value={(stats.weeklyProgress / stats.weeklyGoal) * 100} 
          className="h-2" 
        />
      </div>

      {/* Active Streaks */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Active Streaks
        </h4>
        
        {mockStreaks.map(streak => (
          <div key={streak.type} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-orange-600">{streak.current}</span>
              </div>
              <div>
                <div className="font-medium text-sm capitalize">
                  {streak.type.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  Best: {streak.longest} days
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-3">
      {mockAchievements.map(achievement => {
        const TierIcon = getTierIcon(achievement.tier);
        const isCompleted = achievement.progress >= achievement.maxProgress;
        
        return (
          <div key={achievement.id} className="p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{achievement.icon}</div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{achievement.title}</h4>
                  <Badge className={getTierColor(achievement.tier)}>
                    <TierIcon className="w-3 h-3 mr-1" />
                    {achievement.tier}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  {achievement.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress: {achievement.progress}/{achievement.maxProgress}</span>
                    <span className="font-medium">{achievement.points} points</span>
                  </div>
                  
                  <Progress 
                    value={(achievement.progress / achievement.maxProgress) * 100} 
                    className="h-1.5" 
                  />
                </div>
                
                {isCompleted && !achievement.unlockedAt && (
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => claimRewardMutation.mutate(achievement.id)}
                    disabled={claimRewardMutation.isPending}
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    Claim Reward
                  </Button>
                )}
                
                {achievement.unlockedAt && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <Trophy className="w-3 h-3" />
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderStreaks = () => (
    <div className="space-y-4">
      {mockStreaks.map(streak => (
        <div key={streak.type} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h4 className="font-medium capitalize">
                {streak.type.replace('_', ' ')} Streak
              </h4>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {streak.current}
              </div>
              <div className="text-xs text-gray-500">
                days
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {streak.longest}
              </div>
              <div className="text-xs text-gray-500">Best Streak</div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {Math.floor((Date.now() - new Date(streak.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-gray-500">Days Ago</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Habit Gamification
            <Badge variant="outline">Level {stats.level}</Badge>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Zap className="w-4 h-4" />
            {stats.totalPoints} pts
          </div>
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 mt-2">
          {(['overview', 'achievements', 'streaks'] as const).map(tab => (
            <Button
              key={tab}
              size="sm"
              variant={selectedTab === tab ? 'default' : 'ghost'}
              onClick={() => setSelectedTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'achievements' && renderAchievements()}
        {selectedTab === 'streaks' && renderStreaks()}
      </CardContent>
    </Card>
  );
};