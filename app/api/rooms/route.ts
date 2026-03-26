import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { rooms } from '@/lib/db/schema';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
import { desc } from 'drizzle-orm';

export async function GET() {
  const rows = db.select().from(rooms).orderBy(desc(rooms.createdAt)).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const room = {
    id: newId(),
    name: body.name as string,
    type: (body.type ?? 'other') as string,
    widthFt: (body.widthFt ?? null) as number | null,
    lengthFt: (body.lengthFt ?? null) as number | null,
    heightFt: (body.heightFt ?? null) as number | null,
    style: (body.style ?? null) as string | null,
    colorPalette: (body.colorPalette ? JSON.stringify(body.colorPalette) : null) as string | null,
    notes: (body.notes ?? null) as string | null,
    imagePath: (body.imagePath ?? null) as string | null,
    createdAt: now(),
  };
  db.insert(rooms).values(room).run();
  return NextResponse.json(room, { status: 201 });
}
