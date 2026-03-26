import { db } from '@/lib/db/client';
import { inspirationSources, inspirationPosts } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { DiscoverClient } from '@/components/discover/DiscoverClient';

export default function DiscoverPage() {
  const sources = db.select().from(inspirationSources).orderBy(desc(inspirationSources.createdAt)).all();
  const posts = db
    .select()
    .from(inspirationPosts)
    .orderBy(desc(inspirationPosts.publishedAt))
    .limit(100)
    .all();
  return <DiscoverClient initialSources={sources} initialPosts={posts} />;
}
