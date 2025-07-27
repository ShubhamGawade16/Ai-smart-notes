import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../auth';
import { checkTier } from '../middleware/tier-check';

const router = Router();

// Mock data for gamification features
const mockUserStats = {
  level: 3,
  totalPoints: 285,
  pointsToNextLevel: 115,
  achievements: [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first task',
      icon: '🎯',
      progress: 1,
      maxProgress: 1,
      tier: 'bronze',
      points: 10,
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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
  ],
  streaks: [
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
  ],
  weeklyGoal: 20,
  weeklyProgress: 14,
};

// Get user gamification stats
router.get('/stats', authenticateToken, checkTier('premium_pro'), async (req: AuthRequest, res) => {
  try {
    // In a real app, fetch from database based on req.userId
    res.json({ 
      stats: mockUserStats,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch gamification stats',
      success: false 
    });
  }
});

// Claim achievement reward
router.post('/claim-reward', authenticateToken, checkTier('premium_pro'), async (req: AuthRequest, res) => {
  try {
    const { achievementId } = req.body;
    
    if (!achievementId) {
      return res.status(400).json({ 
        error: 'Achievement ID is required',
        success: false 
      });
    }

    // In a real app, update database and award points
    const achievement = mockUserStats.achievements.find(a => a.id === achievementId);
    
    if (!achievement) {
      return res.status(404).json({ 
        error: 'Achievement not found',
        success: false 
      });
    }

    if (achievement.unlockedAt) {
      return res.status(400).json({ 
        error: 'Achievement already claimed',
        success: false 
      });
    }

    // Mock claiming the reward
    achievement.unlockedAt = new Date();
    mockUserStats.totalPoints += achievement.points;

    res.json({ 
      points: achievement.points,
      newTotal: mockUserStats.totalPoints,
      success: true 
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ 
      error: 'Failed to claim reward',
      success: false 
    });
  }
});

// Update streak progress
router.post('/update-streak', authenticateToken, checkTier('premium_pro'), async (req: AuthRequest, res) => {
  try {
    const { streakType, increment = true } = req.body;
    
    const streak = mockUserStats.streaks.find(s => s.type === streakType);
    
    if (!streak) {
      return res.status(404).json({ 
        error: 'Streak type not found',
        success: false 
      });
    }

    if (increment) {
      streak.current += 1;
      streak.longest = Math.max(streak.longest, streak.current);
    } else {
      streak.current = 0;
    }
    
    streak.lastUpdated = new Date();

    res.json({ 
      streak,
      success: true 
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({ 
      error: 'Failed to update streak',
      success: false 
    });
  }
});

// Get leaderboard (mock)
router.get('/leaderboard', authenticateToken, checkTier('premium_pro'), async (req: AuthRequest, res) => {
  try {
    const mockLeaderboard = [
      { userId: '1', username: 'ProductivityMaster', level: 12, totalPoints: 2450, rank: 1 },
      { userId: '2', username: 'TaskNinja', level: 11, totalPoints: 2180, rank: 2 },
      { userId: req.userId!, username: 'You', level: mockUserStats.level, totalPoints: mockUserStats.totalPoints, rank: 3 },
      { userId: '4', username: 'FocusGuru', level: 8, totalPoints: 1650, rank: 4 },
      { userId: '5', username: 'GoalCrusher', level: 7, totalPoints: 1420, rank: 5 },
    ];

    res.json({ 
      leaderboard: mockLeaderboard,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      success: false 
    });
  }
});

export default router;