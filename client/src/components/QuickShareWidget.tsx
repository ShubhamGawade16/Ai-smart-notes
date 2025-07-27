import React, { useState } from 'react';
import { Share2, Users, Trophy, Flame, Lock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUpgrade } from '@/hooks/useUpgrade';

interface QuickShareProps {
  recentAchievement?: {
    title: string;
    description: string;
    points: number;
  };
  currentStreak?: {
    type: string;
    count: number;
  };
  todayProgress?: {
    tasksCompleted: number;
    focusTime: number;
  };
}

export const QuickShareWidget: React.FC<QuickShareProps> = ({
  recentAchievement,
  currentStreak,
  todayProgress
}) => {
  const [shareText, setShareText] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [isExpanded, setIsExpanded] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseFeature, showUpgradeModal } = useUpgrade();

  const shareUpdateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await apiRequest('POST', '/api/social/share', updateData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/feed'] });
      setShareText('');
      setIsExpanded(false);
      toast({
        title: "Shared Successfully",
        description: "Your progress update has been shared with your network!",
      });
    },
    onError: () => {
      toast({
        title: "Share Failed",
        description: "Failed to share your update. Please try again.",
        variant: "destructive",
      });
    },
  });

  const quickShareAchievement = () => {
    if (!recentAchievement) return;
    
    const content = `🎉 Just unlocked: ${recentAchievement.title}! ${recentAchievement.description} (+${recentAchievement.points} points)`;
    
    shareUpdateMutation.mutate({
      content,
      visibility,
      type: 'achievement',
      metadata: { achievement: recentAchievement.title, points: recentAchievement.points }
    });
  };

  const quickShareStreak = () => {
    if (!currentStreak) return;
    
    const content = `🔥 ${currentStreak.count} day ${currentStreak.type.replace('_', ' ')} streak! Consistency is building momentum!`;
    
    shareUpdateMutation.mutate({
      content,
      visibility,
      type: 'streak',
      metadata: { streak: currentStreak.count, streakType: currentStreak.type }
    });
  };

  const quickShareProgress = () => {
    if (!todayProgress) return;
    
    const content = `📈 Today's progress: ${todayProgress.tasksCompleted} tasks completed, ${Math.round(todayProgress.focusTime / 60)} hours of focused work! Making steady progress!`;
    
    shareUpdateMutation.mutate({
      content,
      visibility,
      type: 'milestone',
      metadata: { 
        tasksCompleted: todayProgress.tasksCompleted, 
        focusTime: todayProgress.focusTime 
      }
    });
  };

  const handleCustomShare = () => {
    if (!shareText.trim()) return;
    
    shareUpdateMutation.mutate({
      content: shareText,
      visibility,
      type: 'reflection'
    });
  };

  if (!canUseFeature('social_sharing')) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Share2 className="w-4 h-4 text-blue-600" />
            Share Your Progress
            <Badge variant="outline" className="text-xs">Advanced Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">
              Share achievements and stay accountable with friends
            </p>
            <Button 
              size="sm"
              onClick={() => showUpgradeModal('social_sharing', 'Social sharing requires Advanced Pro for community features.')}
            >
              Upgrade for Social Features
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case 'public': return <Globe className="w-3 h-3" />;
      case 'friends': return <Users className="w-3 h-3" />;
      default: return <Lock className="w-3 h-3" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Share2 className="w-4 h-4 text-blue-600" />
          Share Your Progress
          <Badge variant="outline" className="text-xs">
            {getVisibilityIcon(visibility)}
            {visibility}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Quick Share Options */}
        {!isExpanded && (
          <div className="space-y-2">
            {recentAchievement && (
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={quickShareAchievement}
                disabled={shareUpdateMutation.isPending}
              >
                <Trophy className="w-3 h-3 mr-2 text-yellow-600" />
                Share latest achievement
              </Button>
            )}
            
            {currentStreak && currentStreak.count > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={quickShareStreak}
                disabled={shareUpdateMutation.isPending}
              >
                <Flame className="w-3 h-3 mr-2 text-orange-500" />
                Share {currentStreak.count}-day streak
              </Button>
            )}
            
            {todayProgress && todayProgress.tasksCompleted > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={quickShareProgress}
                disabled={shareUpdateMutation.isPending}
              >
                <Share2 className="w-3 h-3 mr-2 text-blue-600" />
                Share today's progress
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs"
              onClick={() => setIsExpanded(true)}
            >
              Write custom update...
            </Button>
          </div>
        )}

        {/* Custom Share */}
        {isExpanded && (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts, progress, or reflections with your accountability partners..."
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              className="resize-none text-sm"
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="public">Public</option>
                <option value="friends">Friends only</option>
                <option value="private">Private</option>
              </select>
              
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsExpanded(false);
                    setShareText('');
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCustomShare}
                  disabled={!shareText.trim() || shareUpdateMutation.isPending}
                  className="text-xs"
                >
                  Share
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Preview */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Recent activity</span>
            <Button size="sm" variant="ghost" className="text-xs h-auto p-1">
              View all
            </Button>
          </div>
          
          <div className="mt-2 space-y-1">
            <div className="text-xs text-gray-500">
              • Achievement shared 2 hours ago
            </div>
            <div className="text-xs text-gray-500">
              • Progress update liked by 3 partners
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};