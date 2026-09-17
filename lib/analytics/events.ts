// Unified Analytics Event System

export type AnalyticsEventName =
  | 'product_view'
  | 'search'
  | 'add_to_cart'
  | 'order_created'
  | 'order_completed'
  | 'product_purchased'
  | 'review_created'
  | 'shop_view'
  | 'category_view';

export interface AnalyticsEvent {
  event_name: AnalyticsEventName;
  actor?: string; // userId
  shop_id?: string;
  customer_id?: string;
  order_id?: string;
  product_id?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  track(event: Omit<AnalyticsEvent, 'timestamp'>) {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date()
    };
    this.events.push(fullEvent);
    console.log(`[Analytics] ${event.event_name}`, fullEvent);
    
    // In production: send to analytics provider (PostHog, Mixpanel, etc.) or DB
    // Do not duplicate analytics logic in components - use this unified service
  }

  // Customer Experience Metrics
  getConversionFunnel(shopId?: string) {
    // search → product click → cart → checkout → order
    // Would query events table
    return {
      searchToProduct: 0.45,
      productToCart: 0.32,
      cartToCheckout: 0.78,
      checkoutToOrder: 0.92
    };
  }

  // Shopkeeper Metrics
  getShopMetrics(shopId: string) {
    return {
      avgPreparationTime: 18, // minutes
      acceptanceTime: 2.3,
      pickingTime: 8.5,
      delayRate: 0.05,
      cancellationRate: 0.02
    };
  }

  // Business Metrics
  getBusinessMetrics() {
    return {
      gmv: 1250000,
      revenue: 62500,
      commission: 62500,
      completedOrders: 1234,
      cancelledOrders: 45,
      avgOrderValue: 1012,
      repeatOrderRate: 0.34
    };
  }
}

export const analyticsService = new AnalyticsService();
