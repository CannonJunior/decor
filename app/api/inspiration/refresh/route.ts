import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { inspirationSources, inspirationPosts } from '@/lib/db/schema';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
import { eq, inArray } from 'drizzle-orm';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });

export async function POST() {
  const sources = db.select().from(inspirationSources).where(eq(inspirationSources.active, 1)).all();

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      return { source, items: feed.items ?? [] };
    })
  );

  type Candidate = {
    sourceId: string;
    externalId: string;
    title: string | null;
    description: string | null;
    url: string;
    imageUrl: string | null;
    author: string | null;
    publishedAt: number;
  };

  const ts = now();
  const candidates: Candidate[] = [];

  for (const result of results) {
    if (result.status === 'rejected') continue;
    const { source, items } = result.value;
    for (const item of items) {
      const externalId = item.guid ?? item.link ?? item.title ?? '';
      if (!externalId) continue;
      const enclosure = (item as Record<string, unknown>).enclosure as { url?: string } | undefined;
      candidates.push({
        sourceId: source.id,
        externalId,
        title: item.title ?? null,
        description: item.contentSnippet ?? item.content ?? null,
        url: item.link ?? '',
        imageUrl: enclosure?.url ?? null,
        author: item.creator ?? item.author ?? null,
        publishedAt: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : ts,
      });
    }
  }

  if (candidates.length === 0) return NextResponse.json({ added: 0 });

  // Deduplicate by externalId
  const externalIds = candidates.map((c) => c.externalId);
  const existing = db.select({ externalId: inspirationPosts.externalId })
    .from(inspirationPosts)
    .where(inArray(inspirationPosts.externalId, externalIds))
    .all();
  const existingSet = new Set(existing.map((r) => r.externalId));

  const newPosts = candidates.filter((c) => !existingSet.has(c.externalId));
  if (newPosts.length > 0) {
    db.insert(inspirationPosts).values(
      newPosts.map((c) => ({
        id: newId(),
        sourceId: c.sourceId,
        externalId: c.externalId,
        title: c.title,
        description: c.description,
        url: c.url,
        imageUrl: c.imageUrl,
        author: c.author,
        publishedAt: c.publishedAt,
        fetchedAt: ts,
        tags: null,
        liked: 0,
        styleTag: null,
        roomTag: null,
      }))
    ).run();
  }

  // Update lastFetched
  const fetchedIds = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<{ source: typeof sources[number] }>).value.source.id);
  if (fetchedIds.length) {
    db.update(inspirationSources).set({ lastFetched: ts }).where(inArray(inspirationSources.id, fetchedIds)).run();
  }

  return NextResponse.json({ added: newPosts.length });
}
