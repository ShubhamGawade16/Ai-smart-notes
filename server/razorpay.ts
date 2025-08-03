// @ts-ignore - razorpay doesn't have type definitions
import Razorpay from "razorpay";
import { Request, Response } from "express";
import crypto from "crypto";

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

if (!RAZORPAY_KEY_ID) {
  console.warn("Missing RAZORPAY_KEY_ID - Payment functionality will be disabled");
}
if (!RAZORPAY_KEY_SECRET) {
  console.warn("Missing RAZORPAY_KEY_SECRET - Payment functionality will be disabled");
}

// Initialize Razorpay instance
const razorpay = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET ? new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
}) : null;

// Subscription plans (amounts in INR)
export const SUBSCRIPTION_PLANS = {
  BASIC_PRO: {
    id: "basic_pro",
    name: "Basic Pro",
    amount: 39900, // ₹399.00 per month in paise
    currency: "INR",
    interval: "monthly",
    description: "Unlimited AI features and task management"
  },
  ADVANCED_PRO: {
    id: "advanced_pro", 
    name: "Advanced Pro",
    amount: 79900, // ₹799.00 per month in paise
    currency: "INR",
    interval: "monthly",
    description: "Advanced analytics and team collaboration"
  },
  PREMIUM_PRO: {
    id: "premium_pro",
    name: "Premium Pro", 
    amount: 129900, // ₹1299.00 per month in paise
    currency: "INR",
    interval: "monthly",
    description: "Full suite with AI scheduling and insights"
  }
};

// Create Razorpay order for one-time payment
export async function createRazorpayOrder(req: Request, res: Response) {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: "Payment service not configured" });
    }

    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    const order = await (razorpay as any).orders.create(options);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      key_id: RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Failed to create Razorpay order:", error);
    res.status(500).json({ 
      error: "Failed to create payment order",
      details: error.message 
    });
  }
}

// Create subscription
export async function createRazorpaySubscription(req: Request, res: Response) {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: "Payment service not configured" });
    }

    const { planId, customerId, customerEmail, customerPhone } = req.body;

    if (!planId || !SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];

    // Create Razorpay plan if it doesn't exist
    let razorpayPlan: any;
    try {
      // Try to fetch existing plan
      razorpayPlan = await (razorpay as any).plans.fetch(`plan_${planId}`);
    } catch (error) {
      // Create new plan if it doesn't exist
      razorpayPlan = await (razorpay as any).plans.create({
        id: `plan_${planId}`,
        item: {
          name: plan.name,
          amount: plan.amount,
          currency: plan.currency,
          description: plan.description,
        },
        period: "monthly",
        interval: 1,
      });
    }

    // Create customer if not exists
    let customer: any = null;
    if (customerId) {
      try {
        customer = await (razorpay as any).customers.fetch(customerId);
      } catch (error) {
        // Customer doesn't exist, create new one
        customer = null;
      }
    }

    if (!customer && customerEmail) {
      customer = await (razorpay as any).customers.create({
        name: customerEmail.split("@")[0],
        email: customerEmail,
        contact: customerPhone || "",
      });
    }

    // Create subscription
    const subscription = await (razorpay as any).subscriptions.create({
      plan_id: razorpayPlan.id,
      customer_id: customer?.id,
      total_count: 12, // 12 months
      quantity: 1,
      notes: {
        plan_type: planId,
        user_email: customerEmail,
      },
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan_id: subscription.plan_id,
        customer_id: subscription.customer_id,
        status: subscription.status,
        short_url: subscription.short_url,
      },
      customer: customer ? {
        id: customer.id,
        email: customer.email,
      } : null,
      key_id: RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Failed to create subscription:", error);
    res.status(500).json({ 
      error: "Failed to create subscription",
      details: error.message 
    });
  }
}

// Verify payment signature
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay key secret not configured");
    }

    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Failed to verify signature:", error);
    return false;
  }
}

// Handle payment verification
export async function verifyRazorpayPayment(req: Request, res: Response) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: "Missing required payment verification data" 
      });
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ 
        error: "Invalid payment signature" 
      });
    }

    // Payment is verified - you can update user subscription status here
    res.json({
      success: true,
      message: "Payment verified successfully",
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    res.status(500).json({ 
      error: "Payment verification failed",
      details: error.message 
    });
  }
}

// Handle Razorpay webhooks
export async function handleRazorpayWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = JSON.stringify(req.body);

    if (!signature || !RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    const event = req.body;
    
    // Handle different webhook events
    switch (event.event) {
      case "subscription.authenticated":
        console.log("Subscription authenticated:", event.payload.subscription.entity);
        break;
      case "subscription.activated":
        console.log("Subscription activated:", event.payload.subscription.entity);
        // Update user subscription status to active
        break;
      case "subscription.charged":
        console.log("Subscription charged:", event.payload.subscription.entity);
        break;
      case "subscription.cancelled":
        console.log("Subscription cancelled:", event.payload.subscription.entity);
        // Update user subscription status to cancelled
        break;
      case "payment.captured":
        console.log("Payment captured:", event.payload.payment.entity);
        break;
      case "payment.failed":
        console.log("Payment failed:", event.payload.payment.entity);
        break;
      default:
        console.log("Unhandled webhook event:", event.event);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Webhook handling failed:", error);
    res.status(500).json({ 
      error: "Webhook handling failed",
      details: error.message 
    });
  }
}

// Get subscription details
export async function getSubscriptionDetails(req: Request, res: Response) {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: "Payment service not configured" });
    }

    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    const subscription = await (razorpay as any).subscriptions.fetch(subscriptionId);
    
    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan_id: subscription.plan_id,
        status: subscription.status,
        current_start: subscription.current_start,
        current_end: subscription.current_end,
        charge_at: subscription.charge_at,
        created_at: subscription.created_at,
      },
    });
  } catch (error: any) {
    console.error("Failed to get subscription details:", error);
    res.status(500).json({ 
      error: "Failed to get subscription details",
      details: error.message 
    });
  }
}

// Cancel subscription
export async function cancelRazorpaySubscription(req: Request, res: Response) {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: "Payment service not configured" });
    }

    const { subscriptionId } = req.params;
    const { cancel_at_cycle_end = true } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    const subscription = await (razorpay as any).subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end,
    });
    
    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        ended_at: subscription.ended_at,
      },
    });
  } catch (error: any) {
    console.error("Failed to cancel subscription:", error);
    res.status(500).json({ 
      error: "Failed to cancel subscription",
      details: error.message 
    });
  }
}