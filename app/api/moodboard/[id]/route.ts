import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { moodboards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = db.select().from(moodboards).where(eq(moodboards.id, id)).get();
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(board);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.canvasData !== undefined) update.canvasData = body.canvasData;
  if (body.style !== undefined) update.style = body.style;
  if (body.colorPalette !== undefined) update.colorPalette = JSON.stringify(body.colorPalette);
  if (body.tags !== undefined) update.tags = JSON.stringify(body.tags);
  db.update(moodboards).set(update).where(eq(moodboards.id, id)).run();
  return NextResponse.json(db.select().from(moodboards).where(eq(moodboards.id, id)).get());
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(moodboards).where(eq(moodboards.id, id)).run();
  return NextResponse.json({ ok: true });
}
