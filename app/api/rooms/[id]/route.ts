import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { rooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = db.select().from(rooms).where(eq(rooms.id, id)).get();
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(room);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.type !== undefined) update.type = body.type;
  if (body.widthFt !== undefined) update.widthFt = body.widthFt;
  if (body.lengthFt !== undefined) update.lengthFt = body.lengthFt;
  if (body.heightFt !== undefined) update.heightFt = body.heightFt;
  if (body.style !== undefined) update.style = body.style;
  if (body.colorPalette !== undefined) update.colorPalette = JSON.stringify(body.colorPalette);
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.imagePath !== undefined) update.imagePath = body.imagePath;
  db.update(rooms).set(update).where(eq(rooms.id, id)).run();
  const updated = db.select().from(rooms).where(eq(rooms.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(rooms).where(eq(rooms.id, id)).run();
  return NextResponse.json({ ok: true });
}
