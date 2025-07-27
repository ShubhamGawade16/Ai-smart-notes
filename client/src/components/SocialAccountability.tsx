import React, { useState } from 'react';
import { Users, Share2, Lock, Globe, UserPlus, Heart, MessageCircle, Trophy, Target, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUpgrade } from '@/hooks/useUpgrade';

interface ShareableUpdate {
  id: string;
  type: 'achievement' | 'goal_progress' | 'streak' | 'milestone' | 'reflection';
  content: string;
  visibility: 'public' | 'friends' | 'private';
  metadata: {
    achievement?: string;
    progress?: number;
    streak?: number;
    goalTitle?: string;
  };
  createdAt: Date;
  likes: number;
  comments: number;
  userHasLiked: boolean;
}

interface AccountabilityPartner {
  id: string;
  name: string;
  avatar: string;
  mutualGoals: number;
  supportLevel: 'casual' | 'active' | 'committed';
  lastInteraction: Date;
  streak: number;
}

interface SharingSettings {
  autoShareAchievements: boolean;
  autoShareStreaks: boolean;
  autoShareGoalProgress: boolean;
  defaultVisibility: 'public' | 'friends' | 'private';
  allowComments: boolean;
  shareWeeklySummary: boolean;
}

export const SocialAccountability: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'partners' | 'settings'>('feed');
  const [newUpdate, setNewUpdate] = useState('');
  const [updateVisibility, setUpdateVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [showShareModal, setShowShareModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseFeature, showUpgradeModal } = useUpgrade();

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['/api/social/feed'],
    enabled: canUseFeature('social_sharing'),
  });

  const { data: partnersData, isLoading: partnersLoading } = useQuery({
    queryKey: ['/api/social/partners'],
    enabled: canUseFeature('social_sharing'),
  });

  const { data: settingsData } = useQuery({
    queryKey: ['/api/social/settings'],
    enabled: canUseFeature('social_sharing'),
  });

  const shareUpdateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await apiRequest('POST', '/api/social/share', updateData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/feed'] });
      setNewUpdate('');
      toast({
        title: "Update Shared",
        description: "Your progress update has been shared successfully!",
      });
    },
  });

  const likeUpdateMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const response = await apiRequest('POST', `/api/social/updates/${updateId}/like`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/feed'] });
    },
  });

  const addPartnerMutation = useMutation({
    mutationFn: async (partnerData: any) => {
      const response = await apiRequest('POST', '/api/social/partners', partnerData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/partners'] });
      toast({
        title: "Partner Added",
        description: "New accountability partner added successfully!",
      });
    },
  });

  if (!canUseFeature('social_sharing')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Social Accountability
            <Badge variant="outline">Advanced Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Stay Accountable Together</h3>
            <p className="text-gray-600 mb-4">
              Share your progress, connect with accountability partners, and stay motivated through community support and friendly competition.
            </p>
            <Button 
              onClick={() => showUpgradeModal('social_sharing', 'Social accountability features require Advanced Pro subscription for community engagement.')}
            >
              Upgrade to Advanced Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mockUpdates: ShareableUpdate[] = [
    {
      id: '1',
      type: 'achievement',
      content: "Just unlocked the 'Task Master' achievement! Completed 50 tasks this week 🎯",
      visibility: 'public',
      metadata: { achievement: 'Task Master' },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 12,
      comments: 3,
      userHasLiked: false,
    },
    {
      id: '2',
      type: 'streak',
      content: "Day 15 of my daily task completion streak! Momentum is building 🔥",
      visibility: 'friends',
      metadata: { streak: 15 },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      likes: 8,
      comments: 2,
      userHasLiked: true,
    },
    {
      id: '3',
      type: 'goal_progress',
      content: "75% complete on my 'Learn React Advanced Patterns' goal. The finish line is in sight!",
      visibility: 'public',
      metadata: { progress: 75, goalTitle: 'Learn React Advanced Patterns' },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      likes: 15,
      comments: 5,
      userHasLiked: false,
    },
  ];

  const mockPartners: AccountabilityPartner[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: '/api/placeholder/32/32',
      mutualGoals: 3,
      supportLevel: 'committed',
      lastInteraction: new Date(Date.now() - 2 * 60 * 60 * 1000),
      streak: 12,
    },
    {
      id: '2',
      name: 'Mike Rodriguez',
      avatar: '/api/placeholder/32/32',
      mutualGoals: 1,
      supportLevel: 'active',
      lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000),
      streak: 8,
    },
  ];

  const mockSettings: SharingSettings = {
    autoShareAchievements: true,
    autoShareStreaks: true,
    autoShareGoalProgress: false,
    defaultVisibility: 'friends',
    allowComments: true,
    shareWeeklySummary: false,
  };

  const handleShareUpdate = () => {
    if (!newUpdate.trim()) return;
    
    shareUpdateMutation.mutate({
      content: newUpdate,
      visibility: updateVisibility,
      type: 'reflection',
    });
  };

  const getUpdateIcon = (type: ShareableUpdate['type']) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-4 h-4 text-yellow-600" />;
      case 'streak': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'goal_progress': return <Target className="w-4 h-4 text-blue-600" />;
      case 'milestone': return <Trophy className="w-4 h-4 text-purple-600" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-3 h-3" />;
      case 'friends': return <Users className="w-3 h-3" />;
      default: return <Lock className="w-3 h-3" />;
    }
  };

  const getSupportLevelColor = (level: AccountabilityPartner['supportLevel']) => {
    switch (level) {
      case 'committed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderFeed = () => (
    <div className="space-y-4">
      {/* Share New Update */}
      <div className="p-4 border rounded-lg space-y-3">
        <Textarea
          placeholder="Share your progress, achievements, or reflections with your accountability partners..."
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
          className="resize-none"
          rows={3}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Visibility:</span>
            <select
              value={updateVisibility}
              onChange={(e) => setUpdateVisibility(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="public">Public</option>
              <option value="friends">Friends only</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          <Button
            size="sm"
            onClick={handleShareUpdate}
            disabled={!newUpdate.trim() || shareUpdateMutation.isPending}
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share Update
          </Button>
        </div>
      </div>

      {/* Feed Updates */}
      <div className="space-y-4">
        {mockUpdates.map(update => (
          <div key={update.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/api/placeholder/32/32" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getUpdateIcon(update.type)}
                  <span className="font-medium text-sm">You</span>
                  <Badge variant="outline" className="text-xs">
                    {getVisibilityIcon(update.visibility)}
                    {update.visibility}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(update.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {update.content}
                </p>
                
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => likeUpdateMutation.mutate(update.id)}
                  >
                    <Heart className={`w-3 h-3 mr-1 ${update.userHasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    {update.likes}
                  </Button>
                  
                  <Button size="sm" variant="ghost" className="text-xs">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {update.comments}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPartners = () => (
    <div className="space-y-4">
      {/* Add Partner */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-sm">Add Accountability Partner</span>
        </div>
        
        <div className="flex gap-2">
          <Input placeholder="Enter email or username" className="flex-1" />
          <Button size="sm" onClick={() => addPartnerMutation.mutate({ email: 'example@email.com' })}>
            Add Partner
          </Button>
        </div>
      </div>

      {/* Partners List */}
      <div className="space-y-3">
        {mockPartners.map(partner => (
          <div key={partner.id} className="p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={partner.avatar} />
                <AvatarFallback>{partner.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{partner.name}</span>
                  <Badge className={getSupportLevelColor(partner.supportLevel)}>
                    {partner.supportLevel}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-4">
                    <span>{partner.mutualGoals} mutual goals</span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {partner.streak} day streak
                    </span>
                  </div>
                  <div>
                    Last interaction: {partner.lastInteraction.toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button size="sm" variant="outline">
                  Message
                </Button>
                <Button size="sm" variant="outline">
                  Goals
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Auto-Share Settings</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Auto-share achievements</span>
              <p className="text-xs text-gray-600">Automatically share when you unlock new achievements</p>
            </div>
            <Switch checked={mockSettings.autoShareAchievements} />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Auto-share streaks</span>
              <p className="text-xs text-gray-600">Share milestone streak updates (every 5 days)</p>
            </div>
            <Switch checked={mockSettings.autoShareStreaks} />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Auto-share goal progress</span>
              <p className="text-xs text-gray-600">Share major goal milestones (25%, 50%, 75%, 100%)</p>
            </div>
            <Switch checked={mockSettings.autoShareGoalProgress} />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Privacy Settings</h4>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Default visibility</label>
            <select className="w-full mt-1 border rounded px-3 py-2 text-sm">
              <option value="public">Public</option>
              <option value="friends" selected>Friends only</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Allow comments</span>
              <p className="text-xs text-gray-600">Let others comment on your updates</p>
            </div>
            <Switch checked={mockSettings.allowComments} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Social Accountability
            <Badge variant="outline">{mockPartners.length} partners</Badge>
          </div>
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 mt-2">
          {(['feed', 'partners', 'settings'] as const).map(tab => (
            <Button
              key={tab}
              size="sm"
              variant={activeTab === tab ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'partners' && renderPartners()}
        {activeTab === 'settings' && renderSettings()}
      </CardContent>
    </Card>
  );
};