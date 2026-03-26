import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { moodboards } from '@/lib/db/schema';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
import { saveMoodboardImage } from '@/lib/utils/upload';
import { desc } from 'drizzle-orm';

export async function GET() {
  return NextResponse.json(db.select().from(moodboards).orderBy(desc(moodboards.createdAt)).all());
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const id = newId();
  let imagePath: string | null = null;

  const imageFile = formData.get('image') as File | null;
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    imagePath = await saveMoodboardImage(buffer, id);
  }

  const board = {
    id,
    name: (formData.get('name') as string) || 'New Moodboard',
    description: (formData.get('description') as string | null) || null,
    imagePath,
    canvasData: null,
    style: (formData.get('style') as string | null) || null,
    colorPalette: null,
    tags: null,
    createdAt: now(),
  };

  db.insert(moodboards).values(board).run();
  return NextResponse.json(board, { status: 201 });
}
