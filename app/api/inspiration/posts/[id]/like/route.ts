import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { inspirationPosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = db.select().from(inspirationPosts).where(eq(inspirationPosts.id, id)).get();
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const newLiked = post.liked ? 0 : 1;
  db.update(inspirationPosts).set({ liked: newLiked }).where(eq(inspirationPosts.id, id)).run();
  return NextResponse.json({ liked: newLiked });
}
