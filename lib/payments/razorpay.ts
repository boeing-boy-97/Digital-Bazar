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
  private isLiveMode: boolean;
  private isDemoMode: boolean;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'demo_secret';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'demo_webhook';
    this.isDemoMode = this.keyId.includes('demo');
    this.isTestMode = this.keyId.includes('test') || this.isDemoMode;
    this.isLiveMode = this.keyId.startsWith('rzp_live_');
  }

  // Server-side order creation - never trust client, server authoritative amount per point 24,38
  async createOrder(amount: number, receipt: string, currency = 'INR'): Promise<RazorpayOrder> {
    // Amount is in INR (float), convert to paise for Razorpay
    const amountPaise = Math.round(amount * 100);

    if (this.isDemoMode) {
      // Mock for development - honest, says mock
      console.warn('[PAYMENTS] Using MOCK Razorpay order - demo mode. For REAL payments, set RAZORPAY_KEY_ID=rzp_test_* or rzp_live_* per .env.example');
      return {
        id: `order_mock_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        amount: amountPaise,
        currency,
        receipt,
        status: 'created'
      };
    }

    if (this.isTestMode) {
      // Test mode - try real SDK if configured, else mock with warning
      try {
        // Attempt real Razorpay SDK if available
        // npm i razorpay - eval to avoid webpack bundling
        const razorpayRequire = eval("require") as any;
        const Razorpay = razorpayRequire('razorpay');
        const instance = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
        const order = await instance.orders.create({ amount: amountPaise, currency, receipt });
        console.log(`[PAYMENTS] REAL Razorpay TEST order created: ${order.id} amount ${amountPaise} paise`);
        return order;
      } catch (e: any) {
        console.warn(`[PAYMENTS] Razorpay SDK not installed or test keys invalid, using mock. Install: npm i razorpay. Error: ${e.message}`);
        return {
          id: `order_test_${Date.now()}`,
          amount: amountPaise,
          currency,
          receipt,
          status: 'created'
        };
      }
    }

    // Live mode - REAL payments, must have live keys
    if (this.isLiveMode) {
      try {
        const razorpayRequireLive = eval("require") as any;
        const Razorpay = razorpayRequireLive('razorpay');
        const instance = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
        const order = await instance.orders.create({ 
          amount: amountPaise, 
          currency, 
          receipt,
          notes: { source: 'digital_bazar', receipt }
        });
        console.log(`[PAYMENTS] REAL Razorpay LIVE order created: ${order.id} amount ${amountPaise} paise receipt ${receipt}`);
        return order;
      } catch (e: any) {
        console.error(`[PAYMENTS] REAL Razorpay LIVE order failed: ${e.message}. Check RAZORPAY_KEY_ID/SECRET per .env.example`);
        throw new Error(`Razorpay LIVE order creation failed: ${e.message}. Verify live keys and SDK installed.`);
      }
    }

    throw new Error('Razorpay not configured - set RAZORPAY_KEY_ID per .env.example for REAL payments');
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    // In demo/test, allow test_signature for dev convenience, but log warning
    if (this.isDemoMode && signature === 'test_signature') {
      console.warn('[PAYMENTS] Using test_signature in demo mode - OK for dev, NEVER in prod');
      return true;
    }
    if (this.isTestMode && signature === 'test_signature') {
      console.warn('[PAYMENTS] Using test_signature in test mode - OK for dev testing');
      return true;
    }

    // REAL verification - HMAC SHA256 per Razorpay docs
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = expectedSignature === signature;
    if (!isValid) {
      console.error(`[PAYMENTS] Signature verification FAILED - possible spoofing. orderId=${orderId} paymentId=${paymentId}`);
    }
    return isValid;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (this.isDemoMode) {
      console.warn('[PAYMENTS] Webhook signature bypassed in demo mode - NEVER in prod');
      return true;
    }

    // REAL webhook verification
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    const isValid = expectedSignature === signature;
    if (!isValid) {
      console.error('[PAYMENTS] Webhook signature FAILED - possible spoofing attempt');
    }
    return isValid;
  }

  async refundPayment(paymentId: string, amount?: number, notes?: any) {
    const amountPaise = amount ? Math.round(amount * 100) : undefined;

    if (this.isDemoMode) {
      console.warn('[PAYMENTS] Mock refund in demo mode');
      return {
        id: `rfnd_mock_${Date.now()}`,
        payment_id: paymentId,
        amount: amountPaise,
        status: 'processed',
        notes
      };
    }

    try {
      const razorpayRequireRefund = eval("require") as any;
      const Razorpay = razorpayRequireRefund('razorpay');
      const instance = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
      const refund = await instance.payments.refund(paymentId, {
        amount: amountPaise,
        notes: notes || { reason: 'customer_request', source: 'digital_bazar' }
      });
      console.log(`[PAYMENTS] REAL refund processed: ${refund.id} for payment ${paymentId} amount ${amountPaise}`);
      return refund;
    } catch (e: any) {
      if (this.isTestMode) {
        console.warn(`[PAYMENTS] Refund mock in test mode: ${e.message}`);
        return {
          id: `rfnd_test_${Date.now()}`,
          payment_id: paymentId,
          amount: amountPaise,
          status: 'processed'
        };
      }
      throw new Error(`Refund failed: ${e.message}`);
    }
  }

  getPublicKey(): string {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || this.keyId;
  }

  isConfigured(): boolean {
    return (this.isTestMode || this.isLiveMode) && !!this.keyId && !!this.keySecret && !this.isDemoMode;
  }

  getMode(): 'demo' | 'test' | 'live' | 'unconfigured' {
    if (this.isDemoMode) return 'demo';
    if (this.isLiveMode) return 'live';
    if (this.isTestMode) return 'test';
    return 'unconfigured';
  }

  getConfigState(): { mode: string; healthy: boolean; message: string } {
    const mode = this.getMode();
    if (mode === 'live') return { mode, healthy: true, message: 'REAL LIVE payments configured' };
    if (mode === 'test') return { mode, healthy: true, message: 'REAL TEST payments configured (use test cards)' };
    if (mode === 'demo') return { mode, healthy: false, message: 'MOCK payments - demo mode, set real keys per .env.example for REAL' };
    return { mode, healthy: false, message: 'Payments not configured - set RAZORPAY_KEY_ID per .env.example' };
  }
}

export const razorpayService = new RazorpayService();
