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
  purchase_date DATE,
  purchase_cost NUMERIC(14, 2) CHECK (purchase_cost IS NULL OR purchase_cost >= 0),
  warranty_until DATE,
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
  handover_date DATE,
  expected_return_date DATE,
  actual_return_date DATE,
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
  cost NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  vendor TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  start_date DATE,
  completed_date DATE,
  technician TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  audit_date DATE,
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
  status TEXT NOT NULL CHECK (status IN ('matched', 'discrepancy')),
  note TEXT,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_department_id ON devices(department_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_handovers_device_id ON handovers(device_id);
CREATE INDEX IF NOT EXISTS idx_handovers_user_id ON handovers(user_id);
CREATE INDEX IF NOT EXISTS idx_handovers_status_return_date ON handovers(status, expected_return_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_device_id ON maintenance(device_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_audit_records_device_id ON audit_records(device_id);
