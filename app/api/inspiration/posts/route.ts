import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { inspirationPosts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const likedOnly = searchParams.get('liked') === '1';

  let rows = db.select().from(inspirationPosts)
    .orderBy(desc(inspirationPosts.publishedAt))
    .limit(200)
    .all();

  if (likedOnly) rows = rows.filter((r) => r.liked === 1);
  return NextResponse.json(rows);
}
