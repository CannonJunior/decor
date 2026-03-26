import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { wishlistItems, priceHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';

// POST /api/wishlist/[id]/price — manually record a price observation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const price = parseFloat(body.price);
  if (isNaN(price) || price <= 0) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }
  const currency = (body.currency ?? 'USD') as string;
  const ts = now();

  // Insert price history entry
  db.insert(priceHistory).values({
    id: newId(),
    wishlistItemId: id,
    price,
    currency,
    checkedAt: ts,
    source: 'manual',
  }).run();

  // Update wishlist item
  const item = db.select().from(wishlistItems).where(eq(wishlistItems.id, id)).get();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const alertTriggered = item.targetPrice !== null && price <= item.targetPrice ? 1 : (item.priceAlertTriggered ?? 0);
  db.update(wishlistItems).set({
    currentPrice: price,
    priceLastChecked: ts,
    priceAlertTriggered: alertTriggered,
    scrapeStatus: 'ok',
  }).where(eq(wishlistItems.id, id)).run();

  const updated = db.select().from(wishlistItems).where(eq(wishlistItems.id, id)).get();
  return NextResponse.json(updated);
}
