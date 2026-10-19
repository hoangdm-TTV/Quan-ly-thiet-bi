import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const legacyJsonPath = path.join(currentDir, '..', 'data', 'database.json');

if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu DATABASE_URL. Hãy tạo file .env từ .env.example và cấu hình PostgreSQL.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PGPOOL_MAX || 10),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

export const initializeSchema = async () => {
  const sql = await fs.readFile(path.join(currentDir, 'schema.sql'), 'utf8');
  await pool.query(sql);
};

const dateValue = (value) => value || null;
const cleanText = (value) => value === undefined ? null : value;

const insertRows = async (client, table, columns, rows, valuesOf) => {
  for (const row of rows) {
    const values = valuesOf(row);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values,
    );
  }
};

export const replaceSnapshot = async (input) => {
  const snapshot = {
    departments: input.departments || [],
    users: input.users || [],
    devices: input.devices || [],
    handovers: input.handovers || [],
    maintenance: input.maintenance || [],
    audits: input.audits || [],
  };
  for (const key of ['departments', 'users', 'devices', 'handovers', 'maintenance', 'audits']) {
    if (!Array.isArray(snapshot[key])) throw new Error(`Danh sách ${key} phải là một mảng.`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE audit_records, audits, maintenance, handovers, devices, users, departments CASCADE');

    await insertRows(client, 'departments', ['id', 'name', 'code', 'manager', 'room'], snapshot.departments, (r) => [r.id, r.name, r.code, cleanText(r.manager), cleanText(r.room)]);
    await insertRows(client, 'users', ['id', 'code', 'name', 'email', 'phone', 'department_id', 'position', 'avatar'], snapshot.users, (r) => [r.id, r.code, r.name, cleanText(r.email), cleanText(r.phone), cleanText(r.departmentId), cleanText(r.position), cleanText(r.avatar)]);
    await insertRows(client, 'devices', ['id', 'code', 'name', 'category', 'brand', 'model', 'serial', 'specs', 'status', 'user_id', 'department_id', 'purchase_date', 'purchase_cost', 'warranty_until', 'location', 'notes'], snapshot.devices, (r) => [r.id, r.code, r.name, r.category, cleanText(r.brand), cleanText(r.model), cleanText(r.serial), cleanText(r.specs), r.status || 'available', cleanText(r.userId), cleanText(r.departmentId), dateValue(r.purchaseDate), r.purchaseCost ?? null, dateValue(r.warrantyUntil), cleanText(r.location), cleanText(r.notes)]);
    await insertRows(client, 'handovers', ['id', 'code', 'type', 'device_id', 'user_id', 'department_id', 'handover_date', 'expected_return_date', 'actual_return_date', 'status', 'giver_id', 'giver_name', 'device_condition', 'notes'], snapshot.handovers, (r) => [r.id, r.code, r.type, cleanText(r.deviceId), cleanText(r.userId), cleanText(r.departmentId), dateValue(r.handoverDate), dateValue(r.expectedReturnDate), dateValue(r.actualReturnDate), r.status || 'active', cleanText(r.giverId), cleanText(r.giverName), cleanText(r.condition), cleanText(r.notes)]);
    await insertRows(client, 'maintenance', ['id', 'code', 'device_id', 'issue', 'solution', 'cost', 'vendor', 'status', 'start_date', 'completed_date', 'technician', 'notes'], snapshot.maintenance, (r) => [r.id, r.code, cleanText(r.deviceId), r.issue, cleanText(r.solution), r.cost ?? 0, cleanText(r.vendor), r.status, dateValue(r.startDate), dateValue(r.completedDate), cleanText(r.technician), cleanText(r.notes)]);

    for (const audit of snapshot.audits) {
      await client.query(
        `INSERT INTO audits (id, code, title, audit_date, auditor, status, notes, total_checked, matched_count, discrepancy_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [audit.id, audit.code, audit.title, dateValue(audit.auditDate), cleanText(audit.auditor), audit.status, cleanText(audit.notes), audit.totalChecked || 0, audit.matchedCount || 0, audit.discrepancyCount || 0],
      );
      for (const record of audit.records || []) {
        await client.query(
          'INSERT INTO audit_records (audit_id, device_id, status, note) VALUES ($1,$2,$3,$4)',
          [audit.id, record.deviceId, record.status, cleanText(record.note)],
        );
      }
    }

    const updatedAt = new Date().toISOString();
    await client.query(
      `INSERT INTO app_metadata (key, value) VALUES ('updatedAt', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [updatedAt],
    );
    await client.query('COMMIT');
    return { ...snapshot, updatedAt };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getSnapshot = async () => {
  const [departments, users, devices, handovers, maintenance, audits, records, metadata] = await Promise.all([
    pool.query('SELECT id, name, code, manager, room FROM departments ORDER BY id'),
    pool.query('SELECT id, code, name, email, phone, department_id AS "departmentId", position, avatar FROM users ORDER BY id'),
    pool.query('SELECT id, code, name, category, brand, model, serial, specs, status, user_id AS "userId", department_id AS "departmentId", purchase_date AS "purchaseDate", purchase_cost::float8 AS "purchaseCost", warranty_until AS "warrantyUntil", location, notes FROM devices ORDER BY id'),
    pool.query('SELECT id, code, type, device_id AS "deviceId", user_id AS "userId", department_id AS "departmentId", handover_date AS "handoverDate", expected_return_date AS "expectedReturnDate", actual_return_date AS "actualReturnDate", status, giver_id AS "giverId", giver_name AS "giverName", device_condition AS condition, notes FROM handovers ORDER BY handover_date DESC NULLS LAST, id'),
    pool.query('SELECT id, code, device_id AS "deviceId", issue, solution, cost::float8 AS cost, vendor, status, start_date AS "startDate", completed_date AS "completedDate", technician, notes FROM maintenance ORDER BY start_date DESC NULLS LAST, id'),
    pool.query('SELECT id, code, title, audit_date AS "auditDate", auditor, status, notes, total_checked AS "totalChecked", matched_count AS "matchedCount", discrepancy_count AS "discrepancyCount" FROM audits ORDER BY audit_date DESC NULLS LAST, id'),
    pool.query('SELECT audit_id AS "auditId", device_id AS "deviceId", status, note FROM audit_records ORDER BY audit_id, device_id'),
    pool.query("SELECT value FROM app_metadata WHERE key = 'updatedAt'"),
  ]);

  const recordsByAudit = new Map();
  for (const record of records.rows) {
    const group = recordsByAudit.get(record.auditId) || [];
    group.push({ deviceId: record.deviceId, status: record.status, note: record.note });
    recordsByAudit.set(record.auditId, group);
  }
  return {
    departments: departments.rows,
    users: users.rows,
    devices: devices.rows,
    handovers: handovers.rows,
    maintenance: maintenance.rows,
    audits: audits.rows.map((audit) => ({ ...audit, records: recordsByAudit.get(audit.id) || [] })),
    updatedAt: metadata.rows[0]?.value || null,
  };
};

export const importLegacyJsonIfEmpty = async () => {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM departments) + (SELECT COUNT(*) FROM users) +
      (SELECT COUNT(*) FROM devices) + (SELECT COUNT(*) FROM handovers) +
      (SELECT COUNT(*) FROM maintenance) + (SELECT COUNT(*) FROM audits) AS total
  `);
  if (Number(rows[0].total) !== 0) {
    throw new Error('Từ chối import: PostgreSQL không trống. Không có dữ liệu nào bị thay đổi.');
  }
  const raw = await fs.readFile(legacyJsonPath, 'utf8');
  const legacyData = JSON.parse(raw);
  const userIds = new Set((legacyData.users || []).map((row) => row.id));
  const departmentIds = new Set((legacyData.departments || []).map((row) => row.id));
  const orphanUserIds = new Set();
  let clearedUserReferences = 0;
  let clearedDepartmentReferences = 0;
  const clearMissing = (row, field, validIds, onMissing) => {
    if (row[field] && !validIds.has(row[field])) {
      onMissing(row[field]);
      row[field] = null;
    }
  };
  for (const user of legacyData.users || []) {
    clearMissing(user, 'departmentId', departmentIds, () => { clearedDepartmentReferences += 1; });
  }
  for (const device of legacyData.devices || []) {
    clearMissing(device, 'userId', userIds, (id) => { orphanUserIds.add(id); clearedUserReferences += 1; });
    clearMissing(device, 'departmentId', departmentIds, () => { clearedDepartmentReferences += 1; });
  }
  for (const handover of legacyData.handovers || []) {
    clearMissing(handover, 'userId', userIds, (id) => { orphanUserIds.add(id); clearedUserReferences += 1; });
    clearMissing(handover, 'giverId', userIds, (id) => { orphanUserIds.add(id); clearedUserReferences += 1; });
    clearMissing(handover, 'departmentId', departmentIds, () => { clearedDepartmentReferences += 1; });
  }
  const saved = await replaceSnapshot(legacyData);
  return {
    imported: true,
    counts: Object.fromEntries(Object.entries(saved).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])),
    warnings: { orphanUserIds: [...orphanUserIds], clearedUserReferences, clearedDepartmentReferences },
  };
};

export const closePool = () => pool.end();
