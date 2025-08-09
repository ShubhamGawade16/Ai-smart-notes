import { Router } from 'express';
import { storage } from '../storage';
import { authenticateToken, type AuthRequest } from '../auth';

const router = Router();

// Complete onboarding with user preferences
router.post('/onboarding-complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { preferences } = req.body;

    // Get current user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user with onboarding completion and preferences
    const updatedUser = await storage.updateUser(userId, {
      onboardingCompleted: true,
      // Store preferences in a metadata field or separate table
      // For now, we'll just mark as completed
    });

    console.log(`✅ User onboarding completed: ${userId}`);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id,
        onboardingCompleted: updatedUser.onboardingCompleted,
        tier: updatedUser.tier,
      },
    });
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        tier: user.tier,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { firstName, lastName, timezone } = req.body;

    const updatedUser = await storage.updateUser(userId, {
      firstName,
      lastName,
      timezone,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        timezone: updatedUser.timezone,
      },
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;