import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { catalogItems } from '@/lib/db/schema';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
import { saveCatalogImage } from '@/lib/utils/upload';
import { desc, eq, like, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const category = searchParams.get('category');
  const style = searchParams.get('style');
  const q = searchParams.get('q');

  let query = db.select().from(catalogItems);
  const conditions = [];
  if (roomId) conditions.push(eq(catalogItems.roomId, roomId));
  if (category) conditions.push(eq(catalogItems.category, category));
  if (style) conditions.push(eq(catalogItems.style, style));
  if (q) conditions.push(like(catalogItems.name, `%${q}%`));

  const rows = (conditions.length > 0
    ? query.where(and(...conditions))
    : query
  ).orderBy(desc(catalogItems.createdAt)).all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const id = newId();
  let imagePath: string | null = null;

  const imageFile = formData.get('image') as File | null;
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    imagePath = await saveCatalogImage(buffer, id);
  }

  const item = {
    id,
    name: formData.get('name') as string,
    brand: (formData.get('brand') as string | null) || null,
    retailer: (formData.get('retailer') as string | null) || null,
    category: (formData.get('category') as string) || 'other',
    style: (formData.get('style') as string) || 'other',
    primaryColor: (formData.get('primaryColor') as string | null) || null,
    material: (formData.get('material') as string) || 'other',
    condition: (formData.get('condition') as string) || 'good',
    purchasePrice: formData.get('purchasePrice') ? parseFloat(formData.get('purchasePrice') as string) : null,
    purchaseDate: formData.get('purchaseDate') ? parseInt(formData.get('purchaseDate') as string) : null,
    sourceUrl: (formData.get('sourceUrl') as string | null) || null,
    notes: (formData.get('notes') as string | null) || null,
    imagePath,
    roomId: (formData.get('roomId') as string | null) || null,
    createdAt: now(),
  };

  db.insert(catalogItems).values(item).run();
  return NextResponse.json(item, { status: 201 });
}
