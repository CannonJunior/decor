import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { catalogItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = db.select().from(catalogItems).where(eq(catalogItems.id, id)).get();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const fields = ['name','brand','retailer','category','style','primaryColor','material','condition',
    'purchasePrice','purchaseDate','sourceUrl','notes','imagePath','roomId'];
  const update: Record<string, unknown> = {};
  for (const f of fields) {
    if (body[f] !== undefined) update[f] = body[f];
  }
  db.update(catalogItems).set(update).where(eq(catalogItems.id, id)).run();
  const updated = db.select().from(catalogItems).where(eq(catalogItems.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(catalogItems).where(eq(catalogItems.id, id)).run();
  return NextResponse.json({ ok: true });
}
