import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { styleWiki } from '../db/schema';
import { ulid } from 'ulid';
import path from 'path';

const db = drizzle(new Database(path.join(process.cwd(), 'nest.db')));
const now = () => Math.floor(Date.now() / 1000);

const STYLES = [
  {
    name: 'Mid-Century Modern',
    type: 'design_style',
    description: 'A design movement from the 1940s–1970s emphasizing clean lines, organic forms, and functional simplicity. Characterized by tapered legs, warm woods, and a seamless blend of indoor and outdoor living.',
    characteristics: ['Clean lines', 'Tapered/splayed legs', 'Organic shapes', 'Minimal ornamentation', 'Indoor-outdoor connection', 'Functional form'],
    colorPalette: ['#D4A853', '#8B4513', '#228B22', '#FF6347', '#1C1C1C', '#F5F5DC'],
    materials: ['Walnut', 'Teak', 'Fiberglass', 'Plastic', 'Chrome', 'Leather'],
    origin: 'United States / Scandinavia',
    era: '1940s–1970s',
    tags: ['retro', 'organic', 'eames', 'saarinen', 'danish'],
  },
  {
    name: 'Scandinavian',
    type: 'design_style',
    description: 'A design philosophy rooted in simplicity, functionality, and connection to nature. Prioritizes light, airy spaces with natural materials, hygge warmth, and minimal clutter.',
    characteristics: ['Minimalist', 'Functional', 'Natural materials', 'Light palette', 'Hygge warmth', 'Quality craftsmanship'],
    colorPalette: ['#FFFFFF', '#F0EDE8', '#B0B0B0', '#4A4A4A', '#8FBC8F', '#C9A96E'],
    materials: ['Light oak', 'Birch', 'Linen', 'Wool', 'Ceramic', 'Rattan'],
    origin: 'Denmark, Sweden, Norway, Finland',
    era: '1950s–present',
    tags: ['nordic', 'hygge', 'danish', 'minimal', 'natural'],
  },
  {
    name: 'Industrial',
    type: 'design_style',
    description: 'Inspired by converted warehouses and factories, industrial style celebrates raw materials, exposed structure, and utilitarian aesthetics. Think exposed brick, metal pipes, and reclaimed wood.',
    characteristics: ['Exposed materials', 'Raw textures', 'Metal accents', 'Neutral palette', 'Open floor plans', 'Edison bulbs'],
    colorPalette: ['#3C3C3C', '#8B7355', '#A0A0A0', '#1C1C1C', '#CD853F', '#D3D3D3'],
    materials: ['Reclaimed wood', 'Steel', 'Cast iron', 'Concrete', 'Leather', 'Brick'],
    origin: 'United States',
    era: '1990s–present',
    tags: ['warehouse', 'loft', 'raw', 'urban', 'reclaimed'],
  },
  {
    name: 'Bohemian',
    type: 'design_style',
    description: 'Free-spirited and eclectic, bohemian style layers textures, patterns, and globally sourced pieces. Celebrates individuality with plants, vintage finds, and artisan crafts.',
    characteristics: ['Layered textiles', 'Global patterns', 'Plants everywhere', 'Vintage pieces', 'Artisan crafts', 'Warm jewel tones'],
    colorPalette: ['#8B0000', '#FF8C00', '#4B0082', '#228B22', '#DAA520', '#8FBC8F'],
    materials: ['Rattan', 'Macramé', 'Cotton', 'Silk', 'Jute', 'Terracotta'],
    origin: 'Global',
    era: '1960s–present',
    tags: ['boho', 'eclectic', 'global', 'vintage', 'handmade'],
  },
  {
    name: 'Contemporary',
    type: 'design_style',
    description: 'Reflects current design trends with a focus on clean lines, neutral palettes, and smart comfort. Less rigid than minimalism, contemporary design balances simplicity with livability.',
    characteristics: ['Current trends', 'Clean lines', 'Neutral palette', 'Comfortable', 'Mix of materials', 'Smart technology'],
    colorPalette: ['#FFFFFF', '#808080', '#1C1C1C', '#C0C0C0', '#E8E8E8', '#404040'],
    materials: ['Steel', 'Glass', 'Leather', 'Microfiber', 'Engineered wood', 'Concrete'],
    origin: 'Global',
    era: '2000s–present',
    tags: ['modern', 'current', 'neutral', 'sleek'],
  },
  {
    name: 'Traditional',
    type: 'design_style',
    description: 'Rooted in European classic design with rich woods, detailed moldings, and symmetrical arrangements. Warm, elegant, and formal with an emphasis on quality and timelessness.',
    characteristics: ['Symmetry', 'Rich wood tones', 'Detailed moldings', 'Formal arrangement', 'Layered patterns', 'Antique accents'],
    colorPalette: ['#8B4513', '#DAA520', '#800000', '#003366', '#F5DEB3', '#2F4F4F'],
    materials: ['Mahogany', 'Cherry', 'Silk', 'Velvet', 'Brass', 'Marble'],
    origin: 'Europe',
    era: '18th–20th century',
    tags: ['classic', 'formal', 'elegant', 'antique', 'european'],
  },
  {
    name: 'Coastal',
    type: 'design_style',
    description: 'Inspired by beach and ocean life, coastal style uses light, breezy colors, natural textures, and nautical references. Relaxed and fresh with driftwood, linen, and sea glass tones.',
    characteristics: ['Light & airy', 'Natural textures', 'Blue and white palette', 'Casual comfort', 'Natural light', 'Woven elements'],
    colorPalette: ['#87CEEB', '#FFFFFF', '#F5F5DC', '#008080', '#D2B48C', '#4682B4'],
    materials: ['Driftwood', 'Linen', 'Sisal', 'Rattan', 'Jute', 'Weathered wood'],
    origin: 'United States / Australia',
    era: '1980s–present',
    tags: ['beach', 'nautical', 'relaxed', 'airy', 'natural'],
  },
  {
    name: 'Farmhouse',
    type: 'design_style',
    description: 'A warm, rustic aesthetic that blends vintage charm with modern comfort. Shiplap walls, barn doors, distressed wood, and cozy textiles define this approachable, family-friendly style.',
    characteristics: ['Shiplap/board & batten', 'Distressed finishes', 'Barn doors', 'Vintage accents', 'Cozy textiles', 'Neutral palette'],
    colorPalette: ['#FFFFFF', '#F5F5DC', '#8B7355', '#708090', '#2F4F4F', '#CD853F'],
    materials: ['Reclaimed wood', 'Galvanized metal', 'Burlap', 'Cotton', 'Wrought iron', 'Ceramic'],
    origin: 'United States',
    era: '2010s–present',
    tags: ['rustic', 'country', 'shiplap', 'fixer upper', 'joanna gaines'],
  },
  {
    name: 'Eclectic',
    type: 'design_style',
    description: 'Intentionally mixing styles, periods, and cultures to create a cohesive, personalized space. Eclectic design succeeds through thoughtful curation and a unifying element like color or scale.',
    characteristics: ['Mixed periods', 'Bold combinations', 'Personal curation', 'Unifying color', 'Unexpected pairings', 'Statement pieces'],
    colorPalette: ['#FF6347', '#4169E1', '#228B22', '#DAA520', '#8B008B', '#FF8C00'],
    materials: ['Mixed materials', 'Vintage', 'Antique', 'Modern', 'Handmade', 'Found objects'],
    origin: 'Global',
    era: 'Any era',
    tags: ['mixed', 'curated', 'personal', 'unique', 'collector'],
  },
  {
    name: 'Art Deco',
    type: 'design_style',
    description: 'Glamorous and geometric, Art Deco emerged in the 1920s celebrating modernism, luxury, and bold symmetry. Gold, black, and jewel tones with sunburst motifs and rich materials.',
    characteristics: ['Bold geometry', 'Symmetry', 'Luxurious materials', 'Gold accents', 'Sunburst motifs', 'Graphic patterns'],
    colorPalette: ['#DAA520', '#1C1C1C', '#4B0082', '#006400', '#8B0000', '#C0C0C0'],
    materials: ['Lacquered wood', 'Brass', 'Marble', 'Velvet', 'Mirror', 'Exotic veneers'],
    origin: 'France / United States',
    era: '1920s–1940s',
    tags: ['glamour', 'geometric', 'luxury', 'gatsby', 'deco'],
  },
  {
    name: 'Bauhaus',
    type: 'design_style',
    description: 'The influential German school that merged art and industrial design, creating functional objects of beauty. "Form follows function" — geometric forms, primary colors, and industrial materials.',
    characteristics: ['Form follows function', 'Geometric forms', 'Primary colors', 'Industrial materials', 'No ornamentation', 'Mass producible'],
    colorPalette: ['#FF0000', '#0000FF', '#FFFF00', '#1C1C1C', '#FFFFFF', '#808080'],
    materials: ['Steel', 'Glass', 'Concrete', 'Plywood', 'Canvas', 'Chrome'],
    origin: 'Germany',
    era: '1919–1933',
    tags: ['functional', 'geometric', 'german', 'modernist', 'gropius'],
  },
  {
    name: 'Japandi',
    type: 'design_style',
    description: 'A fusion of Japanese and Scandinavian design philosophies. Combines wabi-sabi imperfection with Nordic minimalism — earthy, muted tones, natural materials, and thoughtful simplicity.',
    characteristics: ['Wabi-sabi imperfection', 'Nordic minimalism', 'Earthy tones', 'Low furniture', 'Natural materials', 'Negative space'],
    colorPalette: ['#F5F0E8', '#8B7355', '#4A4A4A', '#C9A96E', '#708090', '#2F4F4F'],
    materials: ['Bamboo', 'Linen', 'Clay', 'Oak', 'Stone', 'Handmade ceramic'],
    origin: 'Japan / Scandinavia',
    era: '2010s–present',
    tags: ['wabi-sabi', 'zen', 'nordic', 'earth tones', 'minimal'],
  },
  {
    name: 'Wabi-Sabi',
    type: 'design_style',
    description: 'The Japanese philosophy of finding beauty in imperfection and transience. Embraces natural materials, asymmetry, handmade quality, and objects that age gracefully.',
    characteristics: ['Imperfect beauty', 'Natural aging', 'Handmade quality', 'Asymmetry', 'Organic forms', 'Earthy palette'],
    colorPalette: ['#C4A882', '#8B7355', '#6B6B6B', '#E8DCC8', '#4A3728', '#D4C5A9'],
    materials: ['Unglazed ceramic', 'Washi paper', 'Linen', 'Bamboo', 'Moss', 'Natural stone'],
    origin: 'Japan',
    era: '15th century–present',
    tags: ['zen', 'imperfect', 'natural', 'japanese', 'mindful'],
  },
  {
    name: 'Maximalist',
    type: 'design_style',
    description: 'The bold antithesis of minimalism — more is more. Maximalism celebrates pattern, color, texture, and personality in abundance. Every surface tells a story.',
    characteristics: ['Bold patterns', 'Rich colors', 'Layered textures', 'Collected objects', 'Statement wallpaper', 'Gallery walls'],
    colorPalette: ['#8B0000', '#DAA520', '#4B0082', '#006400', '#FF6347', '#1C1C1C'],
    materials: ['Velvet', 'Silk', 'Brocade', 'Lacquer', 'Mixed metals', 'Wallpaper'],
    origin: 'Global',
    era: '2010s–present',
    tags: ['bold', 'colorful', 'layered', 'expressive', 'pattern'],
  },
];

async function main() {
  const ts = now();
  for (const style of STYLES) {
    try {
      db.insert(styleWiki).values({
        id: ulid(),
        name: style.name,
        type: style.type,
        description: style.description,
        characteristics: JSON.stringify(style.characteristics),
        colorPalette: JSON.stringify(style.colorPalette),
        materials: JSON.stringify(style.materials),
        imageUrl: null,
        origin: style.origin,
        era: style.era,
        tags: JSON.stringify(style.tags),
        createdAt: ts,
        updatedAt: ts,
      }).run();
      console.log(`✅ ${style.name}`);
    } catch {
      console.log(`⏭️  ${style.name} (already exists)`);
    }
  }
  console.log('\n✅ Design styles seeded');
}

main();
