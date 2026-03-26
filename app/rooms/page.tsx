import { db } from '@/lib/db/client';
import { rooms, catalogItems } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { RoomsClient } from '@/components/rooms/RoomsClient';

export default function RoomsPage() {
  const allRooms = db.select().from(rooms).orderBy(desc(rooms.createdAt)).all();
  const allItems = db.select().from(catalogItems).orderBy(desc(catalogItems.createdAt)).all();
  return <RoomsClient initialRooms={allRooms} initialItems={allItems} />;
}
