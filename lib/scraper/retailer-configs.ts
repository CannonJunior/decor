export interface RetailerConfig {
  name: string;
  pattern: RegExp;
  priceSelectors: string[];
  currency: 'USD' | 'GBP' | 'EUR';
  requiresJs: boolean; // if true, skip (no headless browser available)
}

export const RETAILER_CONFIGS: RetailerConfig[] = [
  {
    name: 'IKEA US',
    pattern: /ikea\.com\/us\//,
    priceSelectors: ['.pip-price__integer', '[data-ref="price"]', '.pip-price'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'IKEA UK',
    pattern: /ikea\.com\/gb\//,
    priceSelectors: ['.pip-price__integer', '[data-ref="price"]', '.pip-price'],
    currency: 'GBP',
    requiresJs: false,
  },
  {
    name: 'IKEA CA',
    pattern: /ikea\.com\/ca\//,
    priceSelectors: ['.pip-price__integer', '[data-ref="price"]', '.pip-price'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'Wayfair',
    pattern: /wayfair\.com/,
    priceSelectors: ['[data-cy="sale-price"]', '.BasePriceBlock', '[class*="SalePrice"]', '[class*="sale-price"]'],
    currency: 'USD',
    requiresJs: true, // heavy JS rendering
  },
  {
    name: 'West Elm',
    pattern: /westelm\.com/,
    priceSelectors: ['.product-price .price', '.pip-product-price', '[data-testid="product-price"]'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'CB2',
    pattern: /cb2\.com/,
    priceSelectors: ['.product-price', '[itemprop="price"]', '.price'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'Crate & Barrel',
    pattern: /crateandbarrel\.com/,
    priceSelectors: ['.product-price__price', '.product-price', '[itemprop="price"]'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'Pottery Barn',
    pattern: /potterybarn\.com/,
    priceSelectors: ['.pip-product-price', '.product-price', '[data-testid="price"]'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'Amazon',
    pattern: /amazon\.com/,
    priceSelectors: [
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '[data-asin] .a-price .a-offscreen',
      '.a-price-whole',
    ],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'Target',
    pattern: /target\.com/,
    priceSelectors: ['[data-test="product-price"]', '[data-test="current-price"]'],
    currency: 'USD',
    requiresJs: true,
  },
  {
    name: 'Home Depot',
    pattern: /homedepot\.com/,
    priceSelectors: ['.price-format__main-price', '[data-testid="price-format__main-price"]'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'Article',
    pattern: /article\.com/,
    priceSelectors: ['.price', '[data-testid="price"]', '.product-price'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'World Market',
    pattern: /worldmarket\.com/,
    priceSelectors: ['.product-price', '.sale-price', '[itemprop="price"]'],
    currency: 'USD',
    requiresJs: false,
  },
  {
    name: 'Restoration Hardware',
    pattern: /rh\.com/,
    priceSelectors: ['.product-price', '.selling-price'],
    currency: 'USD',
    requiresJs: true,
  },
  {
    name: 'Anthropologie',
    pattern: /anthropologie\.com/,
    priceSelectors: ['[data-testid="price"]', '.c-product-price'],
    currency: 'USD',
    requiresJs: false,
  },
];

// Generic price patterns as fallback
export const PRICE_PATTERNS: Array<{ regex: RegExp; currency: 'USD' | 'GBP' | 'EUR' }> = [
  { regex: /\$\s*([\d,]+(?:\.\d{1,2})?)/g, currency: 'USD' },
  { regex: /USD\s*([\d,]+(?:\.\d{1,2})?)/g, currency: 'USD' },
  { regex: /£\s*([\d,]+(?:\.\d{1,2})?)/g, currency: 'GBP' },
  { regex: /€\s*([\d,]+(?:\.\d{1,2})?)/g, currency: 'EUR' },
];
