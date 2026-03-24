export const CONTENT_TYPE_CONFIG = {
  'tutorial/how-to': { label: 'TUTORIAL', color: '#6DD5FA', icon: 'school' },
  'trading/investing': { label: 'TRADING', color: '#00E676', icon: 'trending-up' },
  'recipe/cooking': { label: 'RECIPE', color: '#FF8A65', icon: 'restaurant' },
  'business/entrepreneurship': { label: 'BUSINESS', color: '#FFD740', icon: 'briefcase' },
  'advertisement/marketing': { label: 'AD INTEL', color: '#FF4081', icon: 'megaphone' },
  'workout/fitness': { label: 'WORKOUT', color: '#B388FF', icon: 'fitness' },
  'news/opinion': { label: 'NEWS', color: '#80DEEA', icon: 'newspaper' },
  'podcast/interview': { label: 'PODCAST', color: '#EA80FC', icon: 'mic' },
  'product-demo': { label: 'PRODUCT', color: '#A5D6A7', icon: 'cube' },
  'unknown': { label: 'GENERAL', color: '#90A4AE', icon: 'help-circle' },
};

export function getContentTypeConfig(type) {
  return CONTENT_TYPE_CONFIG[type] || CONTENT_TYPE_CONFIG['unknown'];
}

export const AD_PRODUCTS = [
  'LedgerAI',
  'Tavolo',
  'Extract',
  'Toolbelt',
  'Mentor Millionaire',
];
