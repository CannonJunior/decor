import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { styleWiki } from '../db/schema';
import { ulid } from 'ulid';
import path from 'path';

const db = drizzle(new Database(path.join(process.cwd(), 'nest.db')));
const now = () => Math.floor(Date.now() / 1000);

const MATERIALS = [
  {
    name: 'Oak',
    type: 'material',
    description: 'A durable, open-grained hardwood with warm golden tones. One of the most popular woods for furniture due to its strength and beautiful grain patterns.',
    characteristics: ['Durable', 'Open grain', 'Golden tones', 'Takes stain well', 'Ages beautifully'],
    colorPalette: ['#C8860A', '#E8B86D', '#F5DEB3', '#8B6914', '#D2A867'],
    tags: ['hardwood', 'furniture', 'flooring', 'classic'],
  },
  {
    name: 'Walnut',
    type: 'material',
    description: 'A rich, dark hardwood prized for its chocolate tones and fine grain. Associated with mid-century modern design and high-end furniture.',
    characteristics: ['Rich dark tone', 'Fine grain', 'Durable', 'Premium feel', 'Ages gracefully'],
    colorPalette: ['#5C3317', '#7B4F2E', '#8B6914', '#4A2C17', '#6B4226'],
    tags: ['hardwood', 'premium', 'mid-century', 'dark wood'],
  },
  {
    name: 'Marble',
    type: 'material',
    description: 'A metamorphic rock with distinctive veining, used for countertops, tabletops, and decorative accents. Luxurious and timeless but requires care to maintain.',
    characteristics: ['Distinctive veining', 'Cool touch', 'Luxurious', 'Heavy', 'Requires sealing', 'Unique patterns'],
    colorPalette: ['#FFFFFF', '#F5F5F5', '#808080', '#1C1C1C', '#C0A882', '#D4C5B0'],
    tags: ['stone', 'luxury', 'countertop', 'table', 'traditional'],
  },
  {
    name: 'Brass',
    type: 'material',
    description: 'A warm golden metal alloy used for hardware, lighting, and decorative accents. Has experienced a major design revival, adding warmth and sophistication.',
    characteristics: ['Warm golden tone', 'Ages to patina', 'Reflective', 'Durable', 'Tarnishes naturally'],
    colorPalette: ['#B5A642', '#CFB53B', '#DAA520', '#8B7536', '#E6C84C'],
    tags: ['metal', 'hardware', 'lighting', 'warm', 'luxury'],
  },
  {
    name: 'Velvet',
    type: 'material',
    description: 'A plush woven fabric with a distinctive soft pile. Associated with luxury and drama, velvet adds richness to sofas, chairs, and cushions.',
    characteristics: ['Soft pile', 'Rich sheen', 'Luxurious feel', 'Color depth', 'Can be delicate'],
    colorPalette: ['#4B0082', '#8B0000', '#006400', '#1C1C1C', '#DAA520', '#4682B4'],
    tags: ['fabric', 'upholstery', 'luxury', 'jewel tone'],
  },
  {
    name: 'Linen',
    type: 'material',
    description: 'A natural fiber from flax with a distinctive textured weave. Breathable, durable, and develops character with age. A staple of Scandinavian and coastal interiors.',
    characteristics: ['Natural texture', 'Breathable', 'Gets softer with washing', 'Sustainable', 'Wrinkles naturally'],
    colorPalette: ['#FAF0E6', '#F5F5DC', '#D2B48C', '#C9B99A', '#A89070'],
    tags: ['natural fiber', 'textile', 'scandinavian', 'coastal', 'sustainable'],
  },
  {
    name: 'Leather',
    type: 'material',
    description: 'A durable natural material that develops a beautiful patina with age. Full-grain leather is the highest quality, used in sofas, chairs, and accessories.',
    characteristics: ['Ages to patina', 'Durable', 'Easy to clean', 'Breathable', 'Natural variation'],
    colorPalette: ['#5C3317', '#8B4513', '#1C1C1C', '#D2691E', '#A0522D', '#F5DEB3'],
    tags: ['natural', 'upholstery', 'durable', 'premium', 'patina'],
  },
  {
    name: 'Rattan',
    type: 'material',
    description: 'A palm-derived natural material woven into furniture and decorative items. Lightweight, flexible, and evocative of tropical or bohemian interiors.',
    characteristics: ['Lightweight', 'Flexible', 'Natural look', 'Woven textures', 'Sustainable'],
    colorPalette: ['#C4A35A', '#D2B48C', '#8B7355', '#F5DEB3', '#A0784A'],
    tags: ['natural', 'woven', 'bohemian', 'tropical', 'sustainable'],
  },
  {
    name: 'Concrete',
    type: 'material',
    description: 'Raw, industrial material used for countertops, flooring, and decorative objects. Adds an urban, contemporary edge. Can be polished, stained, or left raw.',
    characteristics: ['Industrial texture', 'Heavy', 'Customizable finish', 'Heat resistant', 'Unique variations'],
    colorPalette: ['#808080', '#696969', '#A9A9A9', '#D3D3D3', '#4A4A4A', '#B8B8B8'],
    tags: ['industrial', 'urban', 'countertop', 'floor', 'modern'],
  },
  {
    name: 'Chrome & Steel',
    type: 'material',
    description: 'Highly polished metal alloys used in chair frames, table legs, and hardware. Associated with mid-century modern and contemporary design.',
    characteristics: ['High shine', 'Reflective', 'Durable', 'Industrial', 'Easy to clean'],
    colorPalette: ['#C0C0C0', '#A8A9AD', '#808080', '#D4D4D4', '#1C1C1C'],
    tags: ['metal', 'shiny', 'modern', 'industrial', 'chair legs'],
  },
  {
    name: 'Ceramic',
    type: 'material',
    description: 'Fired clay material used for decorative objects, tiles, and dinnerware. Handmade ceramics add artisan character; tiles offer timeless pattern possibilities.',
    characteristics: ['Handmade quality', 'Color variety', 'Durable', 'Heat resistant', 'Unique glazes'],
    colorPalette: ['#FFFFFF', '#F5F5DC', '#C4A35A', '#4682B4', '#8B4513', '#2F4F4F'],
    tags: ['handmade', 'tile', 'decor', 'artisan', 'craft'],
  },
  {
    name: 'Glass',
    type: 'material',
    description: 'Transparent or translucent material that creates a sense of lightness and space. Used for tabletops, shelving, partitions, and decorative objects.',
    characteristics: ['Transparent', 'Reflective', 'Creates lightness', 'Easy to clean', 'Can be colored or frosted'],
    colorPalette: ['#E8F4F8', '#B0C4DE', '#87CEEB', '#4682B4', '#FFFFFF', '#C0C0C0'],
    tags: ['transparent', 'light', 'table', 'shelf', 'modern'],
  },
];

async function main() {
  const ts = now();
  for (const material of MATERIALS) {
    try {
      db.insert(styleWiki).values({
        id: ulid(),
        name: material.name,
        type: material.type,
        description: material.description,
        characteristics: JSON.stringify(material.characteristics),
        colorPalette: JSON.stringify(material.colorPalette),
        materials: null,
        imageUrl: null,
        origin: null,
        era: null,
        tags: JSON.stringify(material.tags),
        createdAt: ts,
        updatedAt: ts,
      }).run();
      console.log(`✅ ${material.name}`);
    } catch {
      console.log(`⏭️  ${material.name} (already exists)`);
    }
  }
  console.log('\n✅ Materials seeded');
}

main();
