-- Indexes for the main list, history and audit queries.
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial);
CREATE INDEX IF NOT EXISTS idx_handovers_date_id ON handovers(handover_date DESC, id);
CREATE INDEX IF NOT EXISTS idx_maintenance_start_date_id ON maintenance(start_date DESC, id);
CREATE INDEX IF NOT EXISTS idx_audits_date_id ON audits(audit_date DESC, id);
