import * as cheerio from 'cheerio';
import { RETAILER_CONFIGS, PRICE_PATTERNS, type RetailerConfig } from './retailer-configs';

export interface PriceResult {
  price: number | null;
  currency: 'USD' | 'GBP' | 'EUR';
  success: boolean;
  retailer: string;
  error?: string;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parsePrice(text: string): number | null {
  if (!text) return null;
  // Remove currency symbols, commas, whitespace; keep digits and decimal point
  const cleaned = text.replace(/[^\d.,]/g, '').replace(/,(?=\d{3})/g, '').replace(/,/g, '.');
  const val = parseFloat(cleaned);
  return isNaN(val) || val <= 0 ? null : val;
}

function findRetailerConfig(url: string): RetailerConfig | null {
  for (const config of RETAILER_CONFIGS) {
    if (config.pattern.test(url)) return config;
  }
  return null;
}

function extractPriceFromHtml(html: string, config: RetailerConfig | null): { price: number | null; currency: 'USD' | 'GBP' | 'EUR' } {
  const $ = cheerio.load(html);

  // 1. Try retailer-specific selectors
  if (config) {
    for (const selector of config.priceSelectors) {
      const el = $(selector).first();
      if (el.length) {
        const text = el.text().trim();
        const price = parsePrice(text);
        if (price !== null) return { price, currency: config.currency };
      }
    }
  }

  // 2. Try JSON-LD structured data (most reliable)
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const data = JSON.parse($(jsonLdScripts[i]).html() ?? '');
      const offers = data.offers ?? (Array.isArray(data) ? data[0]?.offers : null);
      if (offers) {
        const priceStr = Array.isArray(offers) ? offers[0]?.price : offers.price;
        if (priceStr) {
          const price = parsePrice(String(priceStr));
          if (price !== null) {
            const cur = (offers.priceCurrency ?? config?.currency ?? 'USD') as 'USD' | 'GBP' | 'EUR';
            return { price, currency: cur };
          }
        }
      }
    } catch {
      // skip malformed JSON-LD
    }
  }

  // 3. Try itemprop="price"
  const itemPriceProp = $('[itemprop="price"]').first();
  if (itemPriceProp.length) {
    const content = itemPriceProp.attr('content') ?? itemPriceProp.text();
    const price = parsePrice(content);
    if (price !== null) return { price, currency: config?.currency ?? 'USD' };
  }

  // 4. Generic regex fallback on full page text
  const fullText = $.text();
  for (const { regex, currency } of PRICE_PATTERNS) {
    regex.lastIndex = 0; // reset stateful regex
    const match = regex.exec(fullText);
    if (match) {
      const price = parsePrice(match[1]);
      if (price !== null && price < 100000) return { price, currency };
    }
  }

  return { price: null, currency: config?.currency ?? 'USD' };
}

export async function scrapePrice(url: string): Promise<PriceResult> {
  const config = findRetailerConfig(url);
  const retailerName = config?.name ?? 'Unknown';

  // Skip known JS-heavy sites (no headless browser)
  if (config?.requiresJs) {
    return { price: null, currency: 'USD', success: false, retailer: retailerName, error: 'Requires JS rendering' };
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return { price: null, currency: 'USD', success: false, retailer: retailerName, error: `HTTP ${res.status}` };
    }

    html = await res.text();
  } catch (err) {
    return { price: null, currency: 'USD', success: false, retailer: retailerName, error: String(err) };
  }

  const { price, currency } = extractPriceFromHtml(html, config);

  if (price === null) {
    return { price: null, currency, success: false, retailer: retailerName, error: 'Price not found in page' };
  }

  return { price, currency, success: true, retailer: retailerName };
}
