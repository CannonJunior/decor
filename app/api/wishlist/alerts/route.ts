import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { wishlistItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/wishlist/alerts — returns count and items where price alert triggered
export async function GET() {
  const alerts = db.select().from(wishlistItems)
    .where(and(eq(wishlistItems.priceAlertTriggered, 1), eq(wishlistItems.acquired, 0)))
    .all();
  return NextResponse.json({ count: alerts.length, items: alerts });
}
