-- Separate physical discovery from the explicit inventory review result.
ALTER TABLE audit_records ADD COLUMN IF NOT EXISTS found_at TIMESTAMPTZ;
ALTER TABLE audit_records ADD COLUMN IF NOT EXISTS found_by TEXT;
ALTER TABLE audit_records ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ;
ALTER TABLE audit_records ADD COLUMN IF NOT EXISTS checked_by TEXT;
ALTER TABLE audit_records ADD COLUMN IF NOT EXISTS discrepancies JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE audit_records ADD COLUMN IF NOT EXISTS system_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Existing installations have the original matched/discrepancy constraint.
ALTER TABLE audit_records DROP CONSTRAINT IF EXISTS audit_records_status_check;
UPDATE audit_records SET status = 'confirmed' WHERE status = 'matched';
ALTER TABLE audit_records ADD CONSTRAINT audit_records_status_check
  CHECK (status IN ('found', 'confirmed', 'discrepancy', 'unverified'));
