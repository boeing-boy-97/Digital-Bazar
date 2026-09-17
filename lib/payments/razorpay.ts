import crypto from 'crypto';

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private isTestMode: boolean;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'demo_secret';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'demo_webhook';
    this.isTestMode = this.keyId.includes('test') || this.keyId.includes('demo');
  }

  // Server-side order creation - never trust client
  async createOrder(amount: number, receipt: string, currency = 'INR'): Promise<RazorpayOrder> {
    if (this.isTestMode) {
      // Mock for development
      return {
        id: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency,
        receipt,
        status: 'created'
      };
    }

    // Real Razorpay SDK call would be here
    // const Razorpay = require('razorpay');
    // const instance = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
    // return await instance.orders.create({ amount: amount * 100, currency, receipt });
    
    throw new Error('Production Razorpay not configured - use test mode for development');
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (this.isTestMode && signature === 'test_signature') {
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (this.isTestMode) return true;

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  async refundPayment(paymentId: string, amount?: number, notes?: any) {
    if (this.isTestMode) {
      return {
        id: `rfnd_mock_${Date.now()}`,
        payment_id: paymentId,
        amount: amount ? amount * 100 : undefined,
        status: 'processed'
      };
    }

    // Real refund logic
    throw new Error('Production refund not configured');
  }

  getPublicKey(): string {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || this.keyId;
  }

  isConfigured(): boolean {
    return !this.isTestMode && !!this.keyId && !!this.keySecret;
  }
}

export const razorpayService = new RazorpayService();
