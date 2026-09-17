// i18n Architecture - Ready for English, Hindi, Marathi

export type Locale = 'en' | 'hi' | 'mr';

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    'app.tagline': 'Select Before You Arrive',
    'app.search.placeholder': 'Search products, shops, brands...',
    'shop.open': 'Open',
    'shop.closed': 'Closed',
    'order.pending': 'Pending',
    'order.accepted': 'Accepted',
    'order.preparing': 'Preparing',
    'order.ready': 'Ready for Pickup',
    'order.completed': 'Completed',
    'cart.add': 'Add to Cart',
    'cart.empty': 'Your cart is empty',
    'notification.order_ready': 'Your order is ready for pickup!',
    'ai.assistant.greeting': 'Hi! I am your Digital Bazar AI assistant',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong'
  },
  hi: {
    'app.tagline': 'Pahunchne se pehle chunein',
    'app.search.placeholder': 'Utpad, dukaan, brand khojein...',
    'shop.open': 'Khula hai',
    'shop.closed': 'Band hai',
    'order.pending': 'Lambit',
    'order.accepted': 'Sweekrit',
    'order.preparing': 'Taiyaar ho raha hai',
    'order.ready': 'Pickup ke liye taiyaar',
    'order.completed': 'Pura hua',
    'cart.add': 'Cart mein jodein',
    'cart.empty': 'Aapka cart khali hai',
    'notification.order_ready': 'Aapka order pickup ke liye taiyaar hai!',
    'ai.assistant.greeting': 'Namaste! Main aapka Digital Bazar AI sahayak hun',
    'common.loading': 'Loading ho raha hai...',
    'common.error': 'Kuch galat hua'
  },
  mr: {
    'app.tagline': 'Pohchanya aadhi nivda',
    'app.search.placeholder': 'Utpadane, dukane, brand shodha...',
    'shop.open': 'Ughade aahe',
    'shop.closed': 'Band aahe',
    'order.pending': 'Pralambit',
    'order.accepted': 'Sweekrut',
    'order.preparing': 'Tayari chalu aahe',
    'order.ready': 'Pickup sathi tayar',
    'order.completed': 'Purna zale',
    'cart.add': 'Cart madhe joda',
    'cart.empty': 'Tumcha cart rikama aahe',
    'notification.order_ready': 'Tumcha order pickup sathi tayar aahe!',
    'ai.assistant.greeting': 'Namaskar! Mi tumcha Digital Bazar AI sahayak aahe',
    'common.loading': 'Loading...',
    'common.error': 'Kahi tari chukle'
  }
};

export function t(key: string, locale: Locale = 'en'): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

export function getLocaleFromRequest(request?: Request): Locale {
  // In production: check Accept-Language header, user preference, etc.
  return 'en';
}
