import { db } from '@/lib/db/client';
import { styleWiki, styleRelationships } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { StyleClient } from '@/components/style/StyleClient';

export default function StylePage() {
  const entries = db.select().from(styleWiki).orderBy(asc(styleWiki.name)).all();
  const relationships = db.select().from(styleRelationships).all();
  return <StyleClient initialEntries={entries} initialRelationships={relationships} />;
}
