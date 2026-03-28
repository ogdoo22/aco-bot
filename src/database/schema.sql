-- Profiles table (payment and shipping info)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  shipping_json TEXT NOT NULL,
  billing_json TEXT NOT NULL,
  payment_json TEXT NOT NULL, -- Encrypted
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Proxies table (now profile-specific for BYOP model)
CREATE TABLE IF NOT EXISTS proxies (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL, -- Each proxy belongs to a profile
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('residential', 'datacenter', 'isp')),
  speed_ms INTEGER,
  success_rate REAL DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  last_tested INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  site TEXT NOT NULL,
  product_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  profile_id TEXT NOT NULL,
  proxy_id TEXT,
  mode TEXT NOT NULL CHECK(mode IN ('safe', 'fast', 'aggressive')),
  status TEXT NOT NULL CHECK(status IN ('idle', 'running', 'success', 'failed', 'retrying')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  delay INTEGER DEFAULT 500,
  order_number TEXT,
  error_message TEXT,
  checkout_time INTEGER,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  FOREIGN KEY (proxy_id) REFERENCES proxies(id)
);

-- Task history (for analytics)
CREATE TABLE IF NOT EXISTS task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  site TEXT NOT NULL,
  product_name TEXT NOT NULL,
  success INTEGER NOT NULL,
  order_number TEXT,
  checkout_time INTEGER,
  error_message TEXT,
  profile_id TEXT NOT NULL,
  proxy_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  FOREIGN KEY (proxy_id) REFERENCES proxies(id)
);

-- App settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proxies_is_active ON proxies(is_active);
CREATE INDEX IF NOT EXISTS idx_proxies_profile_id ON proxies(profile_id);
