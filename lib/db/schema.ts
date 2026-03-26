import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ── Rooms ─────────────────────────────────────────────────────────────────────

export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').default('other'), // living_room|bedroom|dining_room|kitchen|bathroom|office|outdoor|other
  widthFt: real('width_ft'),
  lengthFt: real('length_ft'),
  heightFt: real('height_ft'),
  style: text('style'),
  colorPalette: text('color_palette'), // JSON: string[] hex colors
  notes: text('notes'),
  imagePath: text('image_path'),
  createdAt: integer('created_at').notNull(),
});

// ── Catalog ───────────────────────────────────────────────────────────────────

export const catalogItems = sqliteTable('catalog_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand'),
  retailer: text('retailer'),
  category: text('category').default('other'), // sofa|chair|table|desk|bed|storage|lighting|rug|art|decor|plant|other
  style: text('style').default('other'), // mid_century|scandinavian|industrial|bohemian|contemporary|traditional|coastal|farmhouse|eclectic|other
  primaryColor: text('primary_color'), // hex
  material: text('material').default('other'), // wood|metal|fabric|glass|ceramic|leather|rattan|concrete|other
  condition: text('condition').default('good'), // excellent|good|fair|poor
  purchasePrice: real('purchase_price'),
  purchaseDate: integer('purchase_date'),
  sourceUrl: text('source_url'),
  notes: text('notes'),
  imagePath: text('image_path'),
  roomId: text('room_id').references(() => rooms.id),
  createdAt: integer('created_at').notNull(),
});

// ── Wishlist ──────────────────────────────────────────────────────────────────

export const wishlistItems = sqliteTable('wishlist_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand'),
  category: text('category').default('other'),
  style: text('style'),
  priority: text('priority').default('medium'), // high|medium|low
  retailerUrl: text('retailer_url'), // product page URL to scrape
  imageUrl: text('image_url'),
  notes: text('notes'),
  currentPrice: real('current_price'), // last detected price
  targetPrice: real('target_price'), // alert threshold: alert when currentPrice <= targetPrice
  priceLastChecked: integer('price_last_checked'), // unix timestamp
  priceAlertEnabled: integer('price_alert_enabled').default(0),
  priceAlertTriggered: integer('price_alert_triggered').default(0),
  scrapeStatus: text('scrape_status').default('pending'), // ok|failed|unsupported|pending
  acquired: integer('acquired').default(0),
  acquiredPrice: real('acquired_price'),
  sortOrder: integer('sort_order').default(0),
  roomId: text('room_id').references(() => rooms.id),
  createdAt: integer('created_at').notNull(),
});

// ── Price History ─────────────────────────────────────────────────────────────

export const priceHistory = sqliteTable('price_history', {
  id: text('id').primaryKey(),
  wishlistItemId: text('wishlist_item_id').notNull().references(() => wishlistItems.id),
  price: real('price').notNull(),
  currency: text('currency').default('USD'),
  checkedAt: integer('checked_at').notNull(),
  source: text('source').default('manual'), // manual|scraped
});

// ── Moodboards ────────────────────────────────────────────────────────────────

export const moodboards = sqliteTable('moodboards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imagePath: text('image_path'), // background image
  canvasData: text('canvas_data'), // JSON: Konva stage state
  style: text('style'),
  colorPalette: text('color_palette'), // JSON: string[]
  tags: text('tags'), // JSON: string[]
  createdAt: integer('created_at').notNull(),
});

// ── Style Wiki ────────────────────────────────────────────────────────────────

export const styleWiki = sqliteTable('style_wiki', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  type: text('type').notNull(), // design_style|material
  description: text('description'),
  characteristics: text('characteristics'), // JSON: string[]
  colorPalette: text('color_palette'), // JSON: string[] typical hex colors
  materials: text('materials'), // JSON: string[]
  imageUrl: text('image_url'),
  origin: text('origin'),
  era: text('era'),
  tags: text('tags'), // JSON: string[]
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const styleRelationships = sqliteTable('style_relationships', {
  id: text('id').primaryKey(),
  styleAId: text('style_a_id').references(() => styleWiki.id),
  styleBId: text('style_b_id').references(() => styleWiki.id),
  relationship: text('relationship').notNull(), // pairs_with|contrasts_with|evolved_from|subcategory_of
  notes: text('notes'),
});

// ── Inspiration Feed ──────────────────────────────────────────────────────────

export const inspirationSources = sqliteTable('inspiration_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // reddit_rss|rss|youtube_atom
  url: text('url').notNull(),
  active: integer('active').default(1),
  lastFetched: integer('last_fetched'),
  createdAt: integer('created_at').notNull(),
});

export const inspirationPosts = sqliteTable('inspiration_posts', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').references(() => inspirationSources.id),
  externalId: text('external_id'),
  title: text('title'),
  description: text('description'),
  url: text('url').notNull(),
  imageUrl: text('image_url'),
  author: text('author'),
  publishedAt: integer('published_at'),
  fetchedAt: integer('fetched_at').notNull(),
  tags: text('tags'), // JSON: string[]
  liked: integer('liked').default(0),
  styleTag: text('style_tag'),
  roomTag: text('room_tag'),
});

// ── Inspire Sessions ──────────────────────────────────────────────────────────

export const inspireSessions = sqliteTable('inspire_sessions', {
  id: text('id').primaryKey(),
  imagePath: text('image_path').notNull(),
  analysisResult: text('analysis_result'), // JSON string
  mode: text('mode'), // 'shop'|'rearrange'|'style'|'brief'
  userChoices: text('user_choices'), // JSON string
  planResult: text('plan_result'),
  roomIds: text('room_ids'), // JSON array string
  createdAt: integer('created_at').notNull(),
});

// ── Advisor Chat ──────────────────────────────────────────────────────────────

export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  title: text('title'),
  mode: text('mode').default('quick'),
  model: text('model'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => chatSessions.id),
  role: text('role').notNull(), // user|assistant|system
  content: text('content').notNull(),
  contextUsed: text('context_used'), // JSON
  tokensUsed: integer('tokens_used'),
  createdAt: integer('created_at').notNull(),
});
