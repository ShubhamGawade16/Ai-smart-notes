import { User, Habit, HabitCompletion, Task } from '@shared/schema';

export interface GamificationReward {
  type: 'xp' | 'badge' | 'power_up' | 'challenge_unlock';
  value: number | string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PersonalityCluster {
  type: 'achiever' | 'explorer' | 'socializer' | 'competitor';
  traits: string[];
  preferences: {
    rewardTypes: string[];
    challengeTypes: string[];
    motivationTactics: string[];
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'milestone';
  requirements: {
    tasks?: number;
    streak?: number;
    category?: string;
    timeframe?: number; // hours
  };
  rewards: GamificationReward[];
  isActive: boolean;
  expiresAt?: Date;
}

export class GamificationService {
  // Behavioral clustering using simple heuristics (Thompson Sampling placeholder)
  analyzePersonalityCluster(user: User, completionHistory: any[] = []): PersonalityCluster {
    const completionRate = completionHistory.length > 0 ? 
      completionHistory.filter(h => h.completed).length / completionHistory.length : 0.5;
    
    const avgTasksPerDay = user.totalXp / Math.max(1, user.currentStreak);
    const streakConsistency = user.currentStreak / Math.max(1, user.longestStreak);

    // Simple clustering logic (placeholder for ML)
    if (completionRate > 0.8 && user.currentStreak > 7) {
      return {
        type: 'achiever',
        traits: ['high_completion_rate', 'consistent', 'goal_oriented'],
        preferences: {
          rewardTypes: ['milestone_badges', 'xp_multipliers', 'progress_visualization'],
          challengeTypes: ['streak_challenges', 'completion_goals', 'time_trials'],
          motivationTactics: ['progress_tracking', 'achievement_unlocks', 'leaderboards']
        }
      };
    } else if (avgTasksPerDay > 5) {
      return {
        type: 'competitor',
        traits: ['high_volume', 'fast_paced', 'challenge_seeking'],
        preferences: {
          rewardTypes: ['leaderboard_positions', 'speed_bonuses', 'challenge_victories'],
          challengeTypes: ['speed_challenges', 'volume_goals', 'difficulty_spikes'],
          motivationTactics: ['social_comparison', 'time_pressure', 'competitive_rewards']
        }
      };
    } else if (streakConsistency > 0.7) {
      return {
        type: 'explorer',
        traits: ['steady_progress', 'variety_seeking', 'experimental'],
        preferences: {
          rewardTypes: ['discovery_badges', 'variety_bonuses', 'surprise_rewards'],
          challengeTypes: ['variety_challenges', 'exploration_goals', 'creativity_tasks'],
          motivationTactics: ['novelty_introduction', 'surprise_elements', 'customization_options']
        }
      };
    } else {
      return {
        type: 'socializer',
        traits: ['community_oriented', 'sharing_focused', 'supportive'],
        preferences: {
          rewardTypes: ['social_badges', 'sharing_rewards', 'collaboration_bonuses'],
          challengeTypes: ['team_challenges', 'sharing_goals', 'community_events'],
          motivationTactics: ['social_recognition', 'peer_support', 'shared_achievements']
        }
      };
    }
  }

  // Calculate XP rewards based on task completion
  calculateTaskXP(task: Task, completionTime?: number): number {
    let baseXP = 10;

    // Priority multiplier
    const priorityMultipliers = {
      low: 1,
      medium: 1.2,
      high: 1.5,
      urgent: 2
    };
    baseXP *= priorityMultipliers[task.priority] || 1;

    // Time-based bonuses
    if (task.estimatedTime && completionTime) {
      if (completionTime <= task.estimatedTime * 0.8) {
        baseXP *= 1.3; // Early completion bonus
      } else if (completionTime <= task.estimatedTime) {
        baseXP *= 1.1; // On-time bonus
      }
    }

    // Category bonuses (encourage variety)
    const categoryBonuses = {
      health: 1.2,
      learning: 1.3,
      work: 1.1,
      personal: 1.0
    };
    if (task.category && categoryBonuses[task.category as keyof typeof categoryBonuses]) {
      baseXP *= categoryBonuses[task.category as keyof typeof categoryBonuses];
    }

    return Math.round(baseXP);
  }

  // Generate personalized challenges based on user personality
  generatePersonalizedChallenges(
    user: User, 
    personalityCluster: PersonalityCluster,
    currentTasks: Task[] = []
  ): Challenge[] {
    const challenges: Challenge[] = [];
    const now = new Date();

    switch (personalityCluster.type) {
      case 'achiever':
        challenges.push({
          id: 'streak_master',
          title: 'Streak Master',
          description: 'Complete tasks for 10 consecutive days',
          type: 'milestone',
          requirements: { streak: 10 },
          rewards: [{
            type: 'badge',
            value: 'streak_master_badge',
            title: 'Streak Master',
            description: 'Completed 10-day streak',
            rarity: 'epic'
          }],
          isActive: user.currentStreak >= 7
        });
        break;

      case 'competitor':
        challenges.push({
          id: 'speed_demon',
          title: 'Speed Demon',
          description: 'Complete 5 tasks in under 2 hours',
          type: 'daily',
          requirements: { tasks: 5, timeframe: 2 },
          rewards: [{
            type: 'power_up',
            value: '2x_xp_boost',
            title: '2X XP Boost',
            description: 'Double XP for next 5 tasks',
            rarity: 'rare'
          }],
          isActive: true,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        });
        break;

      case 'explorer':
        challenges.push({
          id: 'category_explorer',
          title: 'Category Explorer',
          description: 'Complete tasks in 4 different categories this week',
          type: 'weekly',
          requirements: { tasks: 4 },
          rewards: [{
            type: 'badge',
            value: 'versatility_badge',
            title: 'Versatility Master',
            description: 'Explored multiple task categories',
            rarity: 'rare'
          }],
          isActive: true,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        });
        break;

      case 'socializer':
        if (user.tier !== 'free') { // Social features for paid users
          challenges.push({
            id: 'knowledge_sharer',
            title: 'Knowledge Sharer',
            description: 'Share 3 completed tasks with insights',
            type: 'weekly',
            requirements: { tasks: 3 },
            rewards: [{
              type: 'badge',
              value: 'mentor_badge',
              title: 'Mentor',
              description: 'Shared knowledge with community',
              rarity: 'epic'
            }],
            isActive: true,
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          });
        }
        break;
    }

    return challenges;
  }

  // Power-ups and micro-rewards system
  generateMicroRewards(user: User, context: 'task_completion' | 'streak_milestone' | 'category_variety'): GamificationReward[] {
    const rewards: GamificationReward[] = [];

    switch (context) {
      case 'task_completion':
        if (Math.random() < 0.1) { // 10% chance for bonus reward
          rewards.push({
            type: 'xp',
            value: 25,
            title: 'Surprise Bonus!',
            description: 'Extra XP for being awesome',
            rarity: 'rare'
          });
        }
        break;

      case 'streak_milestone':
        if (user.currentStreak % 5 === 0) {
          rewards.push({
            type: 'power_up',
            value: 'focus_boost',
            title: 'Focus Boost',
            description: 'Enhanced AI insights for 24 hours',
            rarity: user.currentStreak >= 20 ? 'legendary' : 'epic'
          });
        }
        break;

      case 'category_variety':
        rewards.push({
          type: 'xp',
          value: 15,
          title: 'Variety Bonus',
          description: 'Bonus XP for exploring different categories',
          rarity: 'common'
        });
        break;
    }

    return rewards;
  }

  // Status badges and achievements
  calculateStatusBadges(user: User): Array<{ id: string; title: string; description: string; tier: string }> {
    const badges = [];

    // Streak-based badges
    if (user.currentStreak >= 30) {
      badges.push({
        id: 'streak_legend',
        title: 'Streak Legend',
        description: '30+ day streak',
        tier: 'legendary'
      });
    } else if (user.currentStreak >= 14) {
      badges.push({
        id: 'streak_champion',
        title: 'Streak Champion',
        description: '14+ day streak',
        tier: 'epic'
      });
    } else if (user.currentStreak >= 7) {
      badges.push({
        id: 'consistent_performer',
        title: 'Consistent Performer',
        description: '7+ day streak',
        tier: 'rare'
      });
    }

    // XP-based badges
    if (user.totalXp >= 10000) {
      badges.push({
        id: 'productivity_master',
        title: 'Productivity Master',
        description: '10,000+ total XP',
        tier: 'legendary'
      });
    } else if (user.totalXp >= 5000) {
      badges.push({
        id: 'productivity_expert',
        title: 'Productivity Expert',
        description: '5,000+ total XP',
        tier: 'epic'
      });
    } else if (user.totalXp >= 1000) {
      badges.push({
        id: 'rising_star',
        title: 'Rising Star',
        description: '1,000+ total XP',
        tier: 'rare'
      });
    }

    // Tier-based badges
    if (user.tier === 'premium_pro') {
      badges.push({
        id: 'premium_member',
        title: 'Premium Member',
        description: 'Unlocked all features',
        tier: 'legendary'
      });
    } else if (user.tier !== 'free') {
      badges.push({
        id: 'pro_member',
        title: 'Pro Member',
        description: 'Upgraded to Pro features',
        tier: 'epic'
      });
    }

    return badges;
  }

  // Progressive unlock system
  getProgressiveUnlocks(user: User): Array<{ feature: string; unlocked: boolean; requirement: string }> {
    const unlocks = [
      {
        feature: 'Basic Habits',
        unlocked: true,
        requirement: 'Available to all users'
      },
      {
        feature: 'Advanced Habits',
        unlocked: user.tier !== 'free',
        requirement: 'Upgrade to Pro'
      },
      {
        feature: 'Focus Forecast',
        unlocked: user.tier === 'advanced_pro' || user.tier === 'premium_pro',
        requirement: 'Advanced Pro or higher'
      },
      {
        feature: 'XP Multipliers',
        unlocked: user.currentStreak >= 7,
        requirement: '7-day streak'
      },
      {
        feature: 'Custom Challenges',
        unlocked: user.totalXp >= 1000,
        requirement: '1,000 total XP'
      },
      {
        feature: 'Leaderboards',
        unlocked: user.tier === 'premium_pro',
        requirement: 'Premium Pro membership'
      },
      {
        feature: 'Team Challenges',
        unlocked: user.tier === 'premium_pro' && user.currentStreak >= 14,
        requirement: 'Premium Pro + 14-day streak'
      }
    ];

    return unlocks;
  }

  // Habit streak management
  updateHabitStreak(habit: Habit, completion: HabitCompletion): { newStreak: number; milestoneReached: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completionDate = new Date(completion.completedAt);
    completionDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = habit.currentStreak;
    let milestoneReached = false;

    if (daysDiff === 0) {
      // Completed today
      newStreak = habit.currentStreak + 1;
      milestoneReached = newStreak % 5 === 0; // Milestone every 5 days
    } else if (daysDiff === 1) {
      // Completed yesterday, maintain streak
      // Streak stays the same
    } else {
      // Missed days, reset streak
      newStreak = 1;
    }

    return { newStreak, milestoneReached };
  }

  // Generate motivational messages based on user state
  generateMotivationalMessage(user: User, context: string): string {
    const personalityCluster = this.analyzePersonalityCluster(user);
    const messages = {
      achiever: {
        task_completion: `Great job! You're ${user.currentStreak} days strong. Keep building that consistency! 💪`,
        streak_milestone: `Incredible ${user.currentStreak}-day streak! You're in the top 10% of achievers! 🏆`,
        low_energy: `Every small step counts. Your ${user.totalXp} XP shows real progress! 📈`
      },
      competitor: {
        task_completion: `Speed demon! Another task crushed. Can you beat your personal best? ⚡`,
        streak_milestone: `${user.currentStreak} days in a row! You're dominating this challenge! 🚀`,
        low_energy: `Champions train even on tough days. You've got this! 🥊`
      },
      explorer: {
        task_completion: `Nice variety in your tasks! Exploring different areas makes you well-rounded 🌟`,
        streak_milestone: `${user.currentStreak} days of consistent exploration! What will you discover next? 🗺️`,
        low_energy: `Every journey has rest stops. You're still moving forward! 🌱`
      },
      socializer: {
        task_completion: `Your progress inspires others! ${user.totalXp} XP and counting! 👥`,
        streak_milestone: `${user.currentStreak} days! Your consistency motivates the whole community! 🤝`,
        low_energy: `Remember, you're not alone in this journey. Keep going! 💝`
      }
    };

    return messages[personalityCluster.type][context as keyof typeof messages[typeof personalityCluster.type]] || 
           "Keep up the great work! Every task completed is progress! ✨";
  }
}

export const gamificationService = new GamificationService();