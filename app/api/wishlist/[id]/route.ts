import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { wishlistItems, priceHistory } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = db.select().from(wishlistItems).where(eq(wishlistItems.id, id)).get();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const history = db.select().from(priceHistory)
    .where(eq(priceHistory.wishlistItemId, id))
    .orderBy(desc(priceHistory.checkedAt))
    .all();
  return NextResponse.json({ ...item, priceHistory: history });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const fields = ['name','brand','category','style','priority','retailerUrl','imageUrl','notes',
    'currentPrice','targetPrice','priceAlertEnabled','priceAlertTriggered','scrapeStatus',
    'acquired','acquiredPrice','sortOrder','roomId'];
  const update: Record<string, unknown> = {};
  for (const f of fields) {
    if (body[f] !== undefined) update[f] = body[f];
  }

  // Auto-check alert trigger when price or target is updated
  const item = db.select().from(wishlistItems).where(eq(wishlistItems.id, id)).get();
  if (item) {
    const newCurrentPrice = (update.currentPrice as number | undefined) ?? item.currentPrice;
    const newTargetPrice = (update.targetPrice as number | undefined) ?? item.targetPrice;
    if (newCurrentPrice !== null && newTargetPrice !== null && newCurrentPrice <= newTargetPrice) {
      update.priceAlertTriggered = 1;
    }
  }

  db.update(wishlistItems).set(update).where(eq(wishlistItems.id, id)).run();
  const updated = db.select().from(wishlistItems).where(eq(wishlistItems.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(wishlistItems).where(eq(wishlistItems.id, id)).run();
  return NextResponse.json({ ok: true });
}
