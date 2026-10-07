CREATE TABLE IF NOT EXISTS links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT    NOT NULL UNIQUE,
  target_url  TEXT    NOT NULL,
  label       TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clicks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id     INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  clicked_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  user_agent  TEXT,
  referrer    TEXT,
  is_bot      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
