import express from 'express';
import { authenticateToken, type AuthRequest } from '../auth';
import { storage } from '../storage';
import { razorpayService, RazorpayService } from '../services/razorpay-service';
import { subscriptionService } from '../services/subscription-service';

const router = express.Router();

// Get subscription plans and pricing
router.get('/plans', async (req, res) => {
  try {
    const plans = RazorpayService.getPlanPricing();
    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Failed to get pricing plans:', error);
    res.status(500).json({ error: 'Failed to get pricing plans' });
  }
});

// Create payment order for subscription  
router.post('/create-order', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { planType } = req.body;

    if (!planType || !['basic', 'pro'].includes(planType)) {
      return res.status(400).json({ error: 'Valid plan type is required (basic or pro)' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get plan pricing
    const plans = RazorpayService.getPlanPricing();
    const selectedPlan = plans[planType as keyof typeof plans];
    
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpayService.createSubscriptionOrder(
      userId,
      planType as 'basic' | 'pro',
      selectedPlan.price,
      selectedPlan.currency
    );

    // Store payment record in database
    const payment = await storage.createPayment({
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount: selectedPlan.price * 100, // Store in paisa
      currency: selectedPlan.currency,
      planType: planType as 'basic' | 'pro',
      status: 'pending',
      subscriptionDurationDays: 30,
      metadata: {
        planName: selectedPlan.name,
        features: selectedPlan.features,
      },
    });

    console.log(`💳 Payment order created: ${razorpayOrder.id} for ${planType} plan (₹${selectedPlan.price})`);

    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      payment: {
        id: payment.id,
        planType: payment.planType,
        amount: payment.amount,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Failed to create payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment and upgrade user subscription
router.post('/verify-payment', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification data is required' });
    }

    // Enhanced payment verification for live mode with fallback
    console.log(`🔍 Starting payment verification for order: ${razorpay_order_id}`);
    
    const verification = await razorpayService.verifyPaymentWithFallback(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!verification.isValid) {
      console.error('❌ Payment verification failed:', verification.error);
      // Enhanced error response for live mode debugging
      return res.status(400).json({ 
        error: 'Payment verification failed',
        details: verification.error,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        paymentStatus: verification.paymentStatus
      });
    }

    console.log(`✅ Payment verified successfully for: ${razorpay_payment_id}` + 
      (verification.paymentStatus ? ` (Status: ${verification.paymentStatus})` : ''));

    // Get payment record
    const payment = await storage.getPaymentByOrderId(razorpay_order_id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.userId !== userId) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    // Update payment record
    await storage.updatePayment(payment.id, {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'captured',
    });

    // Upgrade user subscription based on plan type
    let upgradedUser;
    if (payment.planType === 'pro') {
      upgradedUser = await subscriptionService.upgradeUserToPro(userId, razorpay_payment_id);
      // Restore any frozen Pro credits
      await subscriptionService.restoreFrozenCredits(userId);
    } else if (payment.planType === 'basic') {
      upgradedUser = await subscriptionService.upgradeUserToBasic(userId, razorpay_payment_id);
    } else {
      return res.status(400).json({ error: 'Invalid plan type in payment record' });
    }

    console.log(`✅ Payment verified and user upgraded: ${userId} to ${payment.planType} plan`);

    res.json({
      success: true,
      message: `Successfully upgraded to ${payment.planType} plan!`,
      user: {
        id: upgradedUser.id,
        tier: upgradedUser.tier,
        subscriptionEndDate: upgradedUser.subscriptionEndDate,
      },
      payment: {
        id: payment.id,
        amount: payment.amount / 100, // Convert back to rupees
        planType: payment.planType,
        status: 'captured',
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get user's subscription status
router.get('/subscription-status', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const status = await subscriptionService.getSubscriptionStatus(userId);
    
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Check AI usage limits
router.get('/ai-limits', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limits = await subscriptionService.canUseAI(userId);
    
    res.json({
      success: true,
      ...limits,
    });
  } catch (error) {
    console.error('Failed to check AI limits:', error);
    res.status(500).json({ error: 'Failed to check AI limits' });
  }
});

// Test Razorpay connection endpoint with live mode detection
router.get('/test-razorpay', async (req, res) => {
  try {
    const hasKeys = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    const keyType = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'LIVE' : 'TEST';
    
    res.json({
      success: true,
      status: hasKeys ? `Razorpay keys configured (${keyType} mode)` : 'Missing Razorpay keys',
      keyId: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 12)}...` : 'Not set',
      mode: keyType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Razorpay test failed:', error);
    res.status(500).json({ error: 'Razorpay test failed' });
  }
});

export default router;