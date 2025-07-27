import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../auth';
import { checkTier } from '../middleware/tier-check';

const router = Router();

// Mock data for social accountability features
const mockUpdates = [
  {
    id: '1',
    userId: 'user123',
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
    userId: 'user123',
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
    userId: 'user456',
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

const mockPartners = [
  {
    id: '1',
    userId: 'user123',
    partnerId: 'partner1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: '/api/placeholder/32/32',
    mutualGoals: 3,
    supportLevel: 'committed',
    lastInteraction: new Date(Date.now() - 2 * 60 * 60 * 1000),
    streak: 12,
    status: 'active',
  },
  {
    id: '2',
    userId: 'user123',
    partnerId: 'partner2',
    name: 'Mike Rodriguez',
    email: 'mike@example.com',
    avatar: '/api/placeholder/32/32',
    mutualGoals: 1,
    supportLevel: 'active',
    lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000),
    streak: 8,
    status: 'active',
  },
];

const mockSettings = {
  autoShareAchievements: true,
  autoShareStreaks: true,
  autoShareGoalProgress: false,
  defaultVisibility: 'friends',
  allowComments: true,
  shareWeeklySummary: false,
};

// Get social feed
router.get('/feed', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    // In a real app, fetch personalized feed based on user's partners and settings
    const feed = mockUpdates.filter(update => {
      // Show public updates and friends-only updates from partners
      return update.visibility === 'public' || 
             (update.visibility === 'friends' && update.userId === req.userId);
    });

    res.json({ 
      updates: feed,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching social feed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch social feed',
      success: false 
    });
  }
});

// Share an update
router.post('/share', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { content, visibility = 'friends', type = 'reflection', metadata = {} } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Content is required',
        success: false 
      });
    }

    if (!['public', 'friends', 'private'].includes(visibility)) {
      return res.status(400).json({ 
        error: 'Invalid visibility setting',
        success: false 
      });
    }

    const newUpdate = {
      id: Date.now().toString(),
      userId: req.userId,
      type,
      content: content.trim(),
      visibility,
      metadata,
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      userHasLiked: false,
    };

    // In a real app, save to database
    mockUpdates.unshift(newUpdate);

    res.json({ 
      update: newUpdate,
      message: 'Update shared successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error sharing update:', error);
    res.status(500).json({ 
      error: 'Failed to share update',
      success: false 
    });
  }
});

// Like/unlike an update
router.post('/updates/:updateId/like', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { updateId } = req.params;

    const update = mockUpdates.find(u => u.id === updateId);
    
    if (!update) {
      return res.status(404).json({ 
        error: 'Update not found',
        success: false 
      });
    }

    // Toggle like status
    if (update.userHasLiked) {
      update.likes -= 1;
      update.userHasLiked = false;
    } else {
      update.likes += 1;
      update.userHasLiked = true;
    }

    res.json({ 
      update,
      action: update.userHasLiked ? 'liked' : 'unliked',
      success: true 
    });
  } catch (error) {
    console.error('Error liking update:', error);
    res.status(500).json({ 
      error: 'Failed to like update',
      success: false 
    });
  }
});

// Get accountability partners
router.get('/partners', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const userPartners = mockPartners.filter(p => p.userId === req.userId);

    res.json({ 
      partners: userPartners,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ 
      error: 'Failed to fetch accountability partners',
      success: false 
    });
  }
});

// Add accountability partner
router.post('/partners', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      return res.status(400).json({ 
        error: 'Email or username is required',
        success: false 
      });
    }

    // In a real app, search for user by email/username and send invitation
    const newPartner = {
      id: Date.now().toString(),
      userId: req.userId,
      partnerId: 'new_partner_id',
      name: email ? email.split('@')[0] : username,
      email: email || `${username}@example.com`,
      avatar: '/api/placeholder/32/32',
      mutualGoals: 0,
      supportLevel: 'casual' as const,
      lastInteraction: new Date(),
      streak: 0,
      status: 'pending' as const,
    };

    mockPartners.push(newPartner);

    res.json({ 
      partner: newPartner,
      message: 'Partner invitation sent successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error adding partner:', error);
    res.status(500).json({ 
      error: 'Failed to add accountability partner',
      success: false 
    });
  }
});

// Remove accountability partner
router.delete('/partners/:partnerId', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { partnerId } = req.params;

    const partnerIndex = mockPartners.findIndex(p => p.id === partnerId && p.userId === req.userId);
    
    if (partnerIndex === -1) {
      return res.status(404).json({ 
        error: 'Partner not found',
        success: false 
      });
    }

    mockPartners.splice(partnerIndex, 1);

    res.json({ 
      message: 'Partner removed successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error removing partner:', error);
    res.status(500).json({ 
      error: 'Failed to remove partner',
      success: false 
    });
  }
});

// Get sharing settings
router.get('/settings', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    // In a real app, fetch user's sharing settings from database
    res.json({ 
      settings: mockSettings,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sharing settings',
      success: false 
    });
  }
});

// Update sharing settings
router.put('/settings', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const updates = req.body;

    // Validate settings
    const validSettings = [
      'autoShareAchievements',
      'autoShareStreaks', 
      'autoShareGoalProgress',
      'defaultVisibility',
      'allowComments',
      'shareWeeklySummary'
    ];

    const invalidKeys = Object.keys(updates).filter(key => !validSettings.includes(key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({ 
        error: `Invalid settings: ${invalidKeys.join(', ')}`,
        success: false 
      });
    }

    // Update settings (in real app, save to database)
    Object.assign(mockSettings, updates);

    res.json({ 
      settings: mockSettings,
      message: 'Settings updated successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      error: 'Failed to update settings',
      success: false 
    });
  }
});

// Auto-share achievement (called by other parts of the app)
router.post('/auto-share/achievement', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { achievementTitle, achievementDescription } = req.body;

    if (!mockSettings.autoShareAchievements) {
      return res.json({ 
        message: 'Auto-sharing disabled for achievements',
        shared: false,
        success: true 
      });
    }

    const autoUpdate = {
      id: Date.now().toString(),
      userId: req.userId,
      type: 'achievement',
      content: `🎉 Just unlocked: ${achievementTitle}! ${achievementDescription}`,
      visibility: mockSettings.defaultVisibility,
      metadata: { achievement: achievementTitle },
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      userHasLiked: false,
    };

    mockUpdates.unshift(autoUpdate);

    res.json({ 
      update: autoUpdate,
      message: 'Achievement auto-shared successfully',
      shared: true,
      success: true 
    });
  } catch (error) {
    console.error('Error auto-sharing achievement:', error);
    res.status(500).json({ 
      error: 'Failed to auto-share achievement',
      success: false 
    });
  }
});

// Auto-share streak milestone
router.post('/auto-share/streak', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { streakCount, streakType } = req.body;

    if (!mockSettings.autoShareStreaks) {
      return res.json({ 
        message: 'Auto-sharing disabled for streaks',
        shared: false,
        success: true 
      });
    }

    // Only share milestone streaks (every 5 days)
    if (streakCount % 5 !== 0) {
      return res.json({ 
        message: 'Not a milestone streak',
        shared: false,
        success: true 
      });
    }

    const autoUpdate = {
      id: Date.now().toString(),
      userId: req.userId,
      type: 'streak',
      content: `🔥 ${streakCount} day ${streakType.replace('_', ' ')} streak! Consistency is key!`,
      visibility: mockSettings.defaultVisibility,
      metadata: { streak: streakCount, streakType },
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      userHasLiked: false,
    };

    mockUpdates.unshift(autoUpdate);

    res.json({ 
      update: autoUpdate,
      message: 'Streak milestone auto-shared successfully',
      shared: true,
      success: true 
    });
  } catch (error) {
    console.error('Error auto-sharing streak:', error);
    res.status(500).json({ 
      error: 'Failed to auto-share streak',
      success: false 
    });
  }
});

// Get user's public profile for sharing
router.get('/profile/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // In a real app, fetch user's public profile data
    const publicProfile = {
      id: userId,
      name: 'Productivity Champion',
      avatar: '/api/placeholder/64/64',
      level: 8,
      totalPoints: 1250,
      achievements: 12,
      currentStreaks: {
        dailyTasks: 15,
        focusSessions: 8,
      },
      publicStats: {
        tasksCompleted: 234,
        goalsAchieved: 8,
        totalFocusTime: 1456, // minutes
      },
      joinedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    };

    res.json({ 
      profile: publicProfile,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch public profile',
      success: false 
    });
  }
});

export default router;