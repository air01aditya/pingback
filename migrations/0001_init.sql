CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE clicks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  link       TEXT NOT NULL CHECK (link IN ('cv', 'demo')),
  kind       TEXT NOT NULL CHECK (kind IN ('human', 'bot', 'owner')),
  clicked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  browser    TEXT,
  city       TEXT,
  country    TEXT
);

CREATE INDEX idx_clicks_link_time ON clicks (link, clicked_at);

CREATE TABLE devices (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  last_seen_at TEXT
);
