import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { styleWiki } from '@/lib/db/schema';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  let rows = db.select().from(styleWiki).orderBy(asc(styleWiki.name)).all();
  if (type) rows = rows.filter((r) => r.type === type);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ts = now();
  const entry = {
    id: newId(),
    name: body.name as string,
    type: body.type as string,
    description: (body.description ?? null) as string | null,
    characteristics: body.characteristics ? JSON.stringify(body.characteristics) : null,
    colorPalette: body.colorPalette ? JSON.stringify(body.colorPalette) : null,
    materials: body.materials ? JSON.stringify(body.materials) : null,
    imageUrl: (body.imageUrl ?? null) as string | null,
    origin: (body.origin ?? null) as string | null,
    era: (body.era ?? null) as string | null,
    tags: body.tags ? JSON.stringify(body.tags) : null,
    createdAt: ts,
    updatedAt: ts,
  };
  db.insert(styleWiki).values(entry).run();
  return NextResponse.json(entry, { status: 201 });
}
