import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { wishlistItems, priceHistory } from '@/lib/db/schema';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
import { asc, eq } from 'drizzle-orm';
import { scrapePrice } from '@/lib/scraper/price-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const priority = searchParams.get('priority');
  const alertOnly = searchParams.get('alerts') === '1';

  let rows = db.select().from(wishlistItems)
    .orderBy(asc(wishlistItems.sortOrder), asc(wishlistItems.createdAt))
    .all();

  if (priority) rows = rows.filter((r) => r.priority === priority);
  if (alertOnly) rows = rows.filter((r) => r.priceAlertTriggered === 1);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = newId();
  const ts = now();

  const item = {
    id,
    name: body.name as string,
    brand: (body.brand ?? null) as string | null,
    category: (body.category ?? 'other') as string,
    style: (body.style ?? null) as string | null,
    priority: (body.priority ?? 'medium') as string,
    retailerUrl: (body.retailerUrl ?? null) as string | null,
    imageUrl: (body.imageUrl ?? null) as string | null,
    notes: (body.notes ?? null) as string | null,
    currentPrice: (body.currentPrice ?? null) as number | null,
    targetPrice: (body.targetPrice ?? null) as number | null,
    priceLastChecked: null as number | null,
    priceAlertEnabled: (body.priceAlertEnabled ?? 0) as number,
    priceAlertTriggered: 0,
    scrapeStatus: 'pending' as string,
    acquired: 0,
    acquiredPrice: null as number | null,
    sortOrder: (body.sortOrder ?? 0) as number,
    roomId: (body.roomId ?? null) as string | null,
    createdAt: ts,
  };

  db.insert(wishlistItems).values(item).run();

  // If URL provided and alert enabled, attempt immediate scrape
  if (item.retailerUrl && item.priceAlertEnabled) {
    try {
      const result = await scrapePrice(item.retailerUrl);
      if (result.success && result.price !== null) {
        const alertTriggered = item.targetPrice !== null && result.price <= item.targetPrice ? 1 : 0;
        db.update(wishlistItems).set({
          currentPrice: result.price,
          priceLastChecked: now(),
          scrapeStatus: 'ok',
          priceAlertTriggered: alertTriggered,
        }).where(eq(wishlistItems.id, id)).run();
        item.currentPrice = result.price;
        item.priceLastChecked = now();
        item.scrapeStatus = 'ok';

        db.insert(priceHistory).values({
          id: newId(),
          wishlistItemId: id,
          price: result.price,
          currency: result.currency,
          checkedAt: now(),
          source: 'scraped',
        }).run();
      } else {
        db.update(wishlistItems).set({ scrapeStatus: 'failed', priceLastChecked: now() })
          .where(eq(wishlistItems.id, id)).run();
      }
    } catch {
      // Don't fail the insert if scraping errors
    }
  }

  const saved = db.select().from(wishlistItems).where(eq(wishlistItems.id, id)).get();
  return NextResponse.json(saved ?? item, { status: 201 });
}
