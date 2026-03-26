import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { inspirationSources } from '../db/schema';
import { ulid } from 'ulid';
import path from 'path';

const db = drizzle(new Database(path.join(process.cwd(), 'nest.db')));
const now = () => Math.floor(Date.now() / 1000);

const SOURCES = [
  // Reddit RSS feeds
  { name: 'r/interiordesign', type: 'reddit_rss', url: 'https://www.reddit.com/r/interiordesign/.rss' },
  { name: 'r/malelivingspace', type: 'reddit_rss', url: 'https://www.reddit.com/r/malelivingspace/.rss' },
  { name: 'r/femalelivingspace', type: 'reddit_rss', url: 'https://www.reddit.com/r/femalelivingspace/.rss' },
  { name: 'r/HomeDecorating', type: 'reddit_rss', url: 'https://www.reddit.com/r/HomeDecorating/.rss' },
  { name: 'r/designmyroom', type: 'reddit_rss', url: 'https://www.reddit.com/r/designmyroom/.rss' },
  { name: 'r/Mid_Century', type: 'reddit_rss', url: 'https://www.reddit.com/r/Mid_Century/.rss' },
  { name: 'r/Frugal (home)', type: 'reddit_rss', url: 'https://www.reddit.com/r/Frugal/.rss' },
  { name: 'r/DIY', type: 'reddit_rss', url: 'https://www.reddit.com/r/DIY/.rss' },
  // RSS / Atom feeds
  { name: 'Apartment Therapy', type: 'rss', url: 'https://www.apartmenttherapy.com/feed' },
  { name: 'Dezeen', type: 'rss', url: 'https://www.dezeen.com/feed/' },
  { name: 'Design Milk', type: 'rss', url: 'https://design-milk.com/feed/' },
  { name: 'The Spruce', type: 'rss', url: 'https://www.thespruce.com/rss/4127952' },
];

async function main() {
  const ts = now();
  for (const source of SOURCES) {
    try {
      db.insert(inspirationSources).values({
        id: ulid(),
        name: source.name,
        type: source.type,
        url: source.url,
        active: 1,
        lastFetched: null,
        createdAt: ts,
      }).run();
      console.log(`✅ ${source.name}`);
    } catch {
      console.log(`⏭️  ${source.name} (already exists)`);
    }
  }
  console.log('\n✅ Inspiration sources seeded');
}

main();
