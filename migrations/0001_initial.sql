PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  manager TEXT,
  room TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  position TEXT,
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial TEXT,
  specs TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'borrowed', 'maintenance', 'broken', 'liquidated')),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  purchase_date TEXT,
  purchase_cost REAL CHECK (purchase_cost IS NULL OR purchase_cost >= 0),
  warranty_until TEXT,
  location TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS handovers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('handover', 'borrow')),
  device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  handover_date TEXT,
  expected_return_date TEXT,
  actual_return_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned')),
  giver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  giver_name TEXT,
  device_condition TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS maintenance (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
  issue TEXT NOT NULL,
  solution TEXT,
  cost REAL NOT NULL DEFAULT 0 CHECK (cost >= 0),
  vendor TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  start_date TEXT,
  completed_date TEXT,
  technician TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  audit_date TEXT,
  auditor TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')),
  notes TEXT,
  total_checked INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  discrepancy_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_records (
  audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('found', 'confirmed', 'discrepancy', 'unverified')),
  note TEXT,
  found_at TEXT,
  found_by TEXT,
  checked_at TEXT,
  checked_by TEXT,
  discrepancies TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(discrepancies)),
  system_snapshot TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(system_snapshot)),
  PRIMARY KEY (audit_id, device_id)
);

CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_algorithm TEXT NOT NULL DEFAULT 'pbkdf2-sha256',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_key TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO app_metadata(key, value) VALUES
  ('dataVersion', '0'),
  ('updatedAt', ''),
  ('writeGuard', '');

CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_department_id ON devices(department_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_handovers_device_id ON handovers(device_id);
CREATE INDEX IF NOT EXISTS idx_handovers_user_id ON handovers(user_id);
CREATE INDEX IF NOT EXISTS idx_handovers_status_return_date ON handovers(status, expected_return_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_device_id ON maintenance(device_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_audit_records_device_id ON audit_records(device_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);
