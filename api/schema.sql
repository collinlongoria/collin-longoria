-- The database is a single SQLite file. These tables are created automatically the
-- first time the API connects (see includes/database.php). Times are stored in UTC.

CREATE TABLE IF NOT EXISTS thoughts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  feeling TEXT,
  created_at TEXT NOT NULL,

  -- Each network is 'pending', 'posted', 'failed' or 'skipped'.
  x_status TEXT NOT NULL DEFAULT 'skipped',
  x_id TEXT,
  x_attempts INTEGER NOT NULL DEFAULT 0,
  x_error TEXT,

  threads_status TEXT NOT NULL DEFAULT 'skipped',
  threads_id TEXT,
  threads_url TEXT,
  threads_attempts INTEGER NOT NULL DEFAULT 0,
  threads_error TEXT
);

CREATE TABLE IF NOT EXISTS guestbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  deleted_at TEXT
);

-- Small key/value store, e.g. the current Threads token.
CREATE TABLE IF NOT EXISTS settings (
  name TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_by_bucket ON rate_limits (bucket, created_at);
