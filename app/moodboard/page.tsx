import { db } from '@/lib/db/client';
import { moodboards, catalogItems } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { MoodboardClient } from '@/components/moodboard/MoodboardClient';

export default function MoodboardPage() {
  const boards = db.select().from(moodboards).orderBy(desc(moodboards.createdAt)).all();
  const items = db.select().from(catalogItems).orderBy(desc(catalogItems.createdAt)).all();
  return <MoodboardClient initialBoards={boards} initialItems={items} />;
}
