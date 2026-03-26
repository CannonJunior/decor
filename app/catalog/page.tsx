import { db } from '@/lib/db/client';
import { catalogItems, rooms } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { CatalogClient } from '@/components/catalog/CatalogClient';

export default function CatalogPage() {
  const items = db.select().from(catalogItems).orderBy(desc(catalogItems.createdAt)).all();
  const allRooms = db.select().from(rooms).orderBy(desc(rooms.createdAt)).all();
  return <CatalogClient initialItems={items} initialRooms={allRooms} />;
}
