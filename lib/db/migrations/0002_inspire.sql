CREATE TABLE IF NOT EXISTS inspire_sessions (
  id TEXT PRIMARY KEY,
  image_path TEXT NOT NULL,
  analysis_result TEXT,
  mode TEXT,
  user_choices TEXT,
  plan_result TEXT,
  room_ids TEXT,
  created_at INTEGER NOT NULL
);
