import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Missing Razorpay credentials: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
}

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  // Static method to get plan pricing (no API calls needed)
  static getPlanPricing() {
    return {
      basic: {
        name: 'Basic Plan',
        price: 299, // ₹299/month
        currency: 'INR',
        features: [
          '3 daily AI interactions',
          '100 monthly bonus credits',
          'Smart task categorization',
          'Basic productivity insights',
          'Priority email support',
        ],
        dailyLimit: 3,
        monthlyLimit: 100,
      },
      pro: {
        name: 'Pro Plan',
        price: 499, // ₹499/month
        currency: 'INR',
        features: [
          'Unlimited AI interactions',
          'Advanced productivity analytics',
          'Predictive focus forecasting',
          'Priority scheduling optimization',
          'Dedicated support & early access',
          'Export & backup features',
        ],
        dailyLimit: -1, // Unlimited
        monthlyLimit: -1, // Unlimited
      },
    };
  }

  // Create Razorpay order for subscription
  async createSubscriptionOrder(
    userId: string,
    planType: 'basic' | 'pro',
    amount: number,
    currency: string = 'INR'
  ) {
    try {
      const options = {
        amount: amount * 100, // Convert to paisa
        currency,
        receipt: `sub_${planType}_${Date.now().toString().slice(-8)}`,
        notes: {
          user_id: userId,
          plan_type: planType,
          subscription_duration: '30_days',
        },
      };

      const order = await this.razorpay.orders.create(options);
      console.log(`💳 Razorpay order created: ${order.id} for ${planType} plan`);
      return order;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify payment signature
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): { isValid: boolean; error?: string } {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === signature;
      
      if (isValid) {
        console.log(`✅ Payment signature verified: ${paymentId}`);
      } else {
        console.error(`❌ Payment signature verification failed: ${paymentId}`);
      }

      return { isValid };
    } catch (error) {
      console.error('Payment signature verification error:', error);
      return { 
        isValid: false, 
        error: 'Signature verification failed' 
      };
    }
  }

  // Fetch payment details (optional - for additional verification)
  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  // Create customer for future payments (optional)
  async createCustomer(userId: string, email: string, name: string) {
    try {
      const customer = await this.razorpay.customers.create({
        name,
        email,
        notes: {
          user_id: userId,
        },
      });

      console.log(`👤 Razorpay customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      console.error('Razorpay customer creation failed:', error);
      throw new Error('Failed to create customer');
    }
  }

  // List all payments (for admin/debugging)
  async listPayments(count: number = 10) {
    try {
      const payments = await this.razorpay.payments.all({ count });
      return payments;
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      throw new Error('Failed to fetch payments');
    }
  }
}

export const razorpayService = new RazorpayService();