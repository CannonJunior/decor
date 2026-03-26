import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { styleWiki, styleRelationships } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { now } from '@/lib/utils/time';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = db.select().from(styleWiki).where(eq(styleWiki.id, id)).get();
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const rels = db.select().from(styleRelationships)
    .where(or(eq(styleRelationships.styleAId, id), eq(styleRelationships.styleBId, id)))
    .all();
  return NextResponse.json({ ...entry, relationships: rels });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = { updatedAt: now() };
  if (body.description !== undefined) update.description = body.description;
  if (body.characteristics !== undefined) update.characteristics = JSON.stringify(body.characteristics);
  if (body.colorPalette !== undefined) update.colorPalette = JSON.stringify(body.colorPalette);
  if (body.tags !== undefined) update.tags = JSON.stringify(body.tags);
  db.update(styleWiki).set(update).where(eq(styleWiki.id, id)).run();
  return NextResponse.json(db.select().from(styleWiki).where(eq(styleWiki.id, id)).get());
}
