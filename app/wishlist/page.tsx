import { db } from '@/lib/db/client';
import { wishlistItems, priceHistory, rooms } from '@/lib/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { WishlistClient } from '@/components/wishlist/WishlistClient';

export default function WishlistPage() {
  const items = db
    .select()
    .from(wishlistItems)
    .orderBy(asc(wishlistItems.sortOrder), asc(wishlistItems.createdAt))
    .all();
  const history = db.select().from(priceHistory).orderBy(desc(priceHistory.checkedAt)).limit(500).all();
  const allRooms = db.select().from(rooms).orderBy(desc(rooms.createdAt)).all();
  return <WishlistClient initialItems={items} initialHistory={history} initialRooms={allRooms} />;
}
