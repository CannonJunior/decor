import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { inspirationSources } from '@/lib/db/schema';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';

export async function GET() {
  return NextResponse.json(db.select().from(inspirationSources).all());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const source = {
    id: newId(),
    name: body.name as string,
    type: (body.type ?? 'rss') as string,
    url: body.url as string,
    active: 1,
    lastFetched: null,
    createdAt: now(),
  };
  db.insert(inspirationSources).values(source).run();
  return NextResponse.json(source, { status: 201 });
}
