CREATE TABLE `rooms` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `type` text DEFAULT 'other',
  `width_ft` real,
  `length_ft` real,
  `height_ft` real,
  `style` text,
  `color_palette` text,
  `notes` text,
  `image_path` text,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_items` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `brand` text,
  `retailer` text,
  `category` text DEFAULT 'other',
  `style` text DEFAULT 'other',
  `primary_color` text,
  `material` text DEFAULT 'other',
  `condition` text DEFAULT 'good',
  `purchase_price` real,
  `purchase_date` integer,
  `source_url` text,
  `notes` text,
  `image_path` text,
  `room_id` text REFERENCES `rooms`(`id`),
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wishlist_items` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `brand` text,
  `category` text DEFAULT 'other',
  `style` text,
  `priority` text DEFAULT 'medium',
  `retailer_url` text,
  `image_url` text,
  `notes` text,
  `current_price` real,
  `target_price` real,
  `price_last_checked` integer,
  `price_alert_enabled` integer DEFAULT 0,
  `price_alert_triggered` integer DEFAULT 0,
  `scrape_status` text DEFAULT 'pending',
  `acquired` integer DEFAULT 0,
  `acquired_price` real,
  `sort_order` integer DEFAULT 0,
  `room_id` text REFERENCES `rooms`(`id`),
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `price_history` (
  `id` text PRIMARY KEY NOT NULL,
  `wishlist_item_id` text NOT NULL REFERENCES `wishlist_items`(`id`) ON DELETE CASCADE,
  `price` real NOT NULL,
  `currency` text DEFAULT 'USD',
  `checked_at` integer NOT NULL,
  `source` text DEFAULT 'manual'
);
--> statement-breakpoint
CREATE TABLE `moodboards` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `image_path` text,
  `canvas_data` text,
  `style` text,
  `color_palette` text,
  `tags` text,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `style_wiki` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL UNIQUE,
  `type` text NOT NULL,
  `description` text,
  `characteristics` text,
  `color_palette` text,
  `materials` text,
  `image_url` text,
  `origin` text,
  `era` text,
  `tags` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `style_relationships` (
  `id` text PRIMARY KEY NOT NULL,
  `style_a_id` text REFERENCES `style_wiki`(`id`),
  `style_b_id` text REFERENCES `style_wiki`(`id`),
  `relationship` text NOT NULL,
  `notes` text
);
--> statement-breakpoint
CREATE TABLE `inspiration_sources` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `url` text NOT NULL,
  `active` integer DEFAULT 1,
  `last_fetched` integer,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inspiration_posts` (
  `id` text PRIMARY KEY NOT NULL,
  `source_id` text REFERENCES `inspiration_sources`(`id`),
  `external_id` text,
  `title` text,
  `description` text,
  `url` text NOT NULL,
  `image_url` text,
  `author` text,
  `published_at` integer,
  `fetched_at` integer NOT NULL,
  `tags` text,
  `liked` integer DEFAULT 0,
  `style_tag` text,
  `room_tag` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inspiration_posts_source_external_idx` ON `inspiration_posts`(`source_id`, `external_id`);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text,
  `mode` text DEFAULT 'quick',
  `model` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `session_id` text REFERENCES `chat_sessions`(`id`),
  `role` text NOT NULL,
  `content` text NOT NULL,
  `context_used` text,
  `tokens_used` integer,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `catalog_items_room_idx` ON `catalog_items`(`room_id`);
--> statement-breakpoint
CREATE INDEX `wishlist_items_acquired_idx` ON `wishlist_items`(`acquired`);
--> statement-breakpoint
CREATE INDEX `wishlist_items_alert_idx` ON `wishlist_items`(`price_alert_triggered`);
--> statement-breakpoint
CREATE INDEX `price_history_item_idx` ON `price_history`(`wishlist_item_id`);
--> statement-breakpoint
CREATE INDEX `inspiration_posts_source_idx` ON `inspiration_posts`(`source_id`);
--> statement-breakpoint
CREATE INDEX `inspiration_posts_liked_idx` ON `inspiration_posts`(`liked`);
