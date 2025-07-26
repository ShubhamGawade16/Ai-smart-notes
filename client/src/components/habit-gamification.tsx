import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Gift, Target, Crown, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface HabitGamification {
  currentXp: number;
  level: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
  dailyChallenges: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    reward: string;
    completed: boolean;
  }>;
  powerUps: Array<{
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic';
    quantity: number;
    effect: string;
  }>;
  personalityInsights: {
    type: string;
    preferredRewards: string[];
    motivationStyle: string;
    recommendations: string[];
  };
}

interface HabitGamificationProps {
  userTier?: string;
}

export default function HabitGamification({ userTier = 'free' }: HabitGamificationProps) {
  const [selectedPowerUp, setSelectedPowerUp] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: gamification, isLoading } = useQuery<HabitGamification>({
    queryKey: ['/api/ai/habit-gamification'],
    refetchInterval: 60000, // Refresh every minute
  });

  const usePowerUpMutation = useMutation({
    mutationFn: async (powerUpId: string) => {
      return apiRequest(`/api/ai/use-power-up/${powerUpId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Power-up activated!",
        description: "Your productivity boost is now active.",
      });
      setSelectedPowerUp(null);
    },
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'epic': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'rare': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="h-4 w-4" />;
      case 'epic': return <Star className="h-4 w-4" />;
      case 'rare': return <Zap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Habit-Loop Gamification
            <Badge variant="secondary">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gamification) {
    return (
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gray-400" />
            Habit-Loop Gamification
            <Badge variant="outline">Pro Features</Badge>
          </CardTitle>
          <CardDescription>
            AI-powered rewards and challenges tailored to your personality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Unlock personalized achievements, rare power-ups, and behavioral clustering that adapts to your unique motivation style.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-left max-w-md mx-auto mb-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Micro-rewards</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Rare power-ups</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span>Daily challenges</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <span>Achievements</span>
              </div>
            </div>
            <Button variant="outline">Upgrade for Gamification</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const levelProgress = (gamification.currentXp / (gamification.currentXp + gamification.xpToNextLevel)) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Habit-Loop Gamification
          <Badge variant="secondary">
            Level {gamification.level}
          </Badge>
        </CardTitle>
        <CardDescription>
          Behavioral AI that adapts to your unique motivation style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* XP and Level Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Level Progress</span>
            <span className="text-sm text-gray-500">
              {gamification.currentXp} XP / {gamification.currentXp + gamification.xpToNextLevel} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-2" />
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>{gamification.currentStreak} day streak</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>{gamification.longestStreak} best streak</span>
            </div>
          </div>
        </div>

        {/* Daily Challenges */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Target className="h-4 w-4" />
            Today's Challenges
          </h4>
          <div className="space-y-3">
            {gamification.dailyChallenges.map((challenge) => (
              <div 
                key={challenge.id}
                className={`p-3 rounded-lg border ${
                  challenge.completed 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{challenge.title}</h5>
                  <Badge variant={challenge.completed ? "default" : "outline"}>
                    {challenge.reward}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {challenge.description}
                </p>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(challenge.progress / challenge.target) * 100} 
                    className="flex-1 h-1" 
                  />
                  <span className="text-xs text-gray-500">
                    {challenge.progress}/{challenge.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Power-ups (Pro Feature) */}
        {userTier !== 'free' && gamification.powerUps.length > 0 && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4" />
              Power-ups Inventory
              <Badge variant="secondary">Pro</Badge>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gamification.powerUps.map((powerUp) => (
                <div 
                  key={powerUp.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPowerUp === powerUp.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => setSelectedPowerUp(powerUp.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getRarityColor(powerUp.rarity)}`}>
                        {getRarityIcon(powerUp.rarity)}
                      </div>
                      <span className="font-medium text-sm">{powerUp.name}</span>
                    </div>
                    <Badge variant="outline">×{powerUp.quantity}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {powerUp.description}
                  </p>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {powerUp.effect}
                  </p>
                </div>
              ))}
            </div>
            {selectedPowerUp && (
              <Button 
                onClick={() => usePowerUpMutation.mutate(selectedPowerUp)}
                disabled={usePowerUpMutation.isPending}
                className="w-full mt-3"
              >
                {usePowerUpMutation.isPending ? "Activating..." : "Use Power-up"}
              </Button>
            )}
          </div>
        )}

        {/* Achievements */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Star className="h-4 w-4" />
            Achievements
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {gamification.achievements.slice(0, 6).map((achievement) => (
              <div 
                key={achievement.id}
                className={`p-2 rounded-lg border text-center ${
                  achievement.earned 
                    ? getRarityColor(achievement.rarity)
                    : 'bg-gray-50 dark:bg-gray-800/50 opacity-50'
                }`}
              >
                <div className="text-lg mb-1">{achievement.icon}</div>
                <h6 className="font-medium text-xs">{achievement.name}</h6>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Personality Insights (Premium Feature) */}
        {userTier === 'premium_pro' && (
          <div className="border-t pt-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4" />
              Personality Insights
              <Badge variant="secondary">Premium</Badge>
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h5 className="font-medium text-sm mb-1">Motivation Type</h5>
                <p className="text-sm">{gamification.personalityInsights.type}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {gamification.personalityInsights.motivationStyle}
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-sm mb-2">Personalized Recommendations</h5>
                <div className="space-y-1">
                  {gamification.personalityInsights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Star className="h-3 w-3 mt-1 text-purple-500 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Behavioral clustering algorithm • Updates based on your interaction patterns
        </div>
      </CardContent>
    </Card>
  );
}