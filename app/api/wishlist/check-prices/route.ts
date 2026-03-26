import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { wishlistItems, priceHistory } from '@/lib/db/schema';
import { eq, and, isNotNull, or, isNull, lt } from 'drizzle-orm';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
import { scrapePrice } from '@/lib/scraper/price-scraper';

// POST /api/wishlist/check-prices
// Scrapes prices for all active wishlist items that haven't been checked in the last hour.
// Called by cron (start.sh sets up: 0 */6 * * * curl -s http://localhost:3001/api/wishlist/check-prices)
// Also callable manually from the wishlist UI.
export async function POST(_req: NextRequest) {
  const oneHourAgo = now() - 3600;

  // Items eligible for price check:
  // - not acquired
  // - has a retailerUrl
  // - either never checked, or last checked over 1 hour ago
  const eligible = db.select().from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.acquired, 0),
        isNotNull(wishlistItems.retailerUrl),
        or(
          isNull(wishlistItems.priceLastChecked),
          lt(wishlistItems.priceLastChecked, oneHourAgo),
        ),
      )
    )
    .all();

  let checked = 0;
  let updated = 0;
  let alertsTriggered = 0;
  const errors: string[] = [];

  const CONCURRENCY = 5;

  async function processItem(item: typeof eligible[number]) {
    if (!item.retailerUrl) return;
    checked++;

    const result = await scrapePrice(item.retailerUrl);
    const ts = now();

    if (result.success && result.price !== null) {
      db.insert(priceHistory).values({
        id: newId(),
        wishlistItemId: item.id,
        price: result.price,
        currency: result.currency,
        checkedAt: ts,
        source: 'scraped',
      }).run();

      const wasTriggered = item.priceAlertTriggered === 1;
      const shouldTrigger = item.priceAlertEnabled === 1 &&
        item.targetPrice !== null &&
        result.price <= item.targetPrice;

      db.update(wishlistItems).set({
        currentPrice: result.price,
        priceLastChecked: ts,
        scrapeStatus: 'ok',
        priceAlertTriggered: shouldTrigger ? 1 : item.priceAlertTriggered,
      }).where(eq(wishlistItems.id, item.id)).run();

      updated++;
      if (shouldTrigger && !wasTriggered) alertsTriggered++;
    } else {
      db.update(wishlistItems).set({
        priceLastChecked: ts,
        scrapeStatus: 'failed',
      }).where(eq(wishlistItems.id, item.id)).run();

      if (result.error) errors.push(`${item.name}: ${result.error}`);
    }
  }

  // Process in parallel batches to avoid overwhelming retailer sites
  for (let i = 0; i < eligible.length; i += CONCURRENCY) {
    await Promise.allSettled(eligible.slice(i, i + CONCURRENCY).map(processItem));
  }

  return NextResponse.json({ checked, updated, alertsTriggered, errors });
}
