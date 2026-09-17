// Feature Flags for Gradual Rollout

export type FeatureFlag = 
  | 'ai_assistant'
  | 'image_search'
  | 'voice_shopping'
  | 'online_payment'
  | 'delivery'
  | 'recommendations'
  | 'forecasting'
  | 'promotions'
  | 'push_notifications';

const defaultFlags: Record<FeatureFlag, boolean> = {
  ai_assistant: process.env.FEATURE_AI_ASSISTANT !== 'false',
  image_search: process.env.FEATURE_IMAGE_SEARCH !== 'false',
  voice_shopping: process.env.FEATURE_VOICE_SHOPPING !== 'false',
  online_payment: process.env.FEATURE_ONLINE_PAYMENT !== 'false',
  delivery: process.env.FEATURE_DELIVERY === 'true',
  recommendations: true,
  forecasting: true,
  promotions: true,
  push_notifications: process.env.FEATURE_PUSH_NOTIFICATIONS === 'true'
};

class FeatureFlagService {
  private flags: Record<FeatureFlag, boolean> = defaultFlags;

  isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] ?? false;
  }

  setFlag(flag: FeatureFlag, enabled: boolean) {
    this.flags[flag] = enabled;
    console.log(`[FeatureFlag] ${flag} = ${enabled}`);
  }

  getAll(): Record<FeatureFlag, boolean> {
    return { ...this.flags };
  }

  // For gradual rollout by shop/user
  isEnabledForShop(flag: FeatureFlag, shopId: string): boolean {
    // In production: check DB for shop-specific overrides
    return this.isEnabled(flag);
  }

  isEnabledForUser(flag: FeatureFlag, userId: string): boolean {
    // In production: check user-specific rollout
    return this.isEnabled(flag);
  }
}

export const featureFlagService = new FeatureFlagService();
