import { db } from '@/lib/db/client';
import { rooms, catalogItems } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import dynamic from 'next/dynamic';

const InspireClient = dynamic(() => import('@/components/inspire/InspireClient'), { ssr: false });

export default function InspirePage() {
  const allRooms = db.select().from(rooms).orderBy(desc(rooms.createdAt)).all();
  const allCatalogItems = db.select().from(catalogItems).orderBy(desc(catalogItems.createdAt)).all();
  return <InspireClient rooms={allRooms} catalogItems={allCatalogItems} />;
}
