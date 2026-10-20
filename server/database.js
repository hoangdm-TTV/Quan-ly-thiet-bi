import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

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
  await pool.query(
    `INSERT INTO app_metadata (key, value) VALUES ('dataVersion', '0')
     ON CONFLICT (key) DO NOTHING`,
  );
};

const dateValue = (value) => value || null;
const dateOnly = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = String(value.getFullYear()).padStart(4, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'string') return value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/)?.[1] || null;
  return null;
};
const cleanText = (value) => value === undefined ? null : value;
const sameId = (left, right) => (left ?? null) === (right ?? null);

const handoverError = (message) => Object.assign(new Error(message), { status: 422 });

const validateHandoverTransitions = async (client, snapshot, { allowReset = false } = {}) => {
  const [handoverResult, deviceResult, maintenanceResult] = await Promise.all([
    client.query('SELECT id, code, type, device_id, user_id, department_id, handover_date, status FROM handovers'),
    client.query('SELECT id, status, user_id, department_id FROM devices'),
    client.query('SELECT id, code, device_id, status FROM maintenance'),
  ]);
  const previousHandovers = new Map(handoverResult.rows.map((row) => [row.id, row]));
  const previousDevices = new Map(deviceResult.rows.map((row) => [row.id, row]));
  const previousMaintenance = new Map(maintenanceResult.rows.map((row) => [row.id, row]));
  const incomingHandovers = new Map(snapshot.handovers.map((row) => [row.id, row]));
  const incomingDevices = new Map(snapshot.devices.map((row) => [row.id, row]));
  const incomingMaintenance = new Map(snapshot.maintenance.map((row) => [row.id, row]));
  const incomingUsers = new Map(snapshot.users.map((row) => [row.id, row]));
  const activeByDevice = new Map();

  if (!allowReset) {
    for (const oldHandover of previousHandovers.values()) {
      if (!incomingHandovers.has(oldHandover.id)) {
        throw handoverError(`Không thể xóa phiếu bàn giao ${oldHandover.code}; hãy giữ lại lịch sử phiếu.`);
      }
    }
    for (const oldMaintenance of previousMaintenance.values()) {
      const maintenance = incomingMaintenance.get(oldMaintenance.id);
      if (!maintenance) {
        throw handoverError(`Không thể xóa phiếu bảo trì ${oldMaintenance.code}; hãy giữ lại lịch sử tài sản.`);
      }
      if (maintenance.code !== oldMaintenance.code || !sameId(oldMaintenance.device_id, maintenance.deviceId)) {
        throw handoverError(`Không thể đổi mã phiếu hoặc thiết bị của phiếu bảo trì ${oldMaintenance.code}.`);
      }
      if (oldMaintenance.status === 'completed' && maintenance.status !== 'completed'
        || oldMaintenance.status === 'in_progress' && maintenance.status === 'scheduled'
        || oldMaintenance.status === 'scheduled' && maintenance.status === 'completed') {
        throw handoverError(`Trạng thái phiếu bảo trì ${oldMaintenance.code} không theo đúng thứ tự lên lịch, xử lý, nghiệm thu.`);
      }
    }
    for (const oldDeviceId of previousDevices.keys()) {
      if (incomingDevices.has(oldDeviceId)) continue;
      const hasHistory = [...previousHandovers.values()].some((row) => row.device_id === oldDeviceId)
        || [...previousMaintenance.values()].some((row) => row.device_id === oldDeviceId);
      if (hasHistory) {
        throw handoverError('Không thể xóa thiết bị đã có lịch sử bàn giao hoặc bảo trì; hãy ghi nhận thanh lý để giữ hồ sơ.');
      }
    }
  }

  for (const handover of snapshot.handovers) {
    const previous = previousHandovers.get(handover.id);
    if (previous && (
      previous.code !== handover.code
      || previous.type !== handover.type
      || !sameId(previous.device_id, handover.deviceId)
      || !sameId(previous.user_id, handover.userId)
    )) {
      throw handoverError(`Không thể đổi mã phiếu, loại phiếu, thiết bị hoặc người nhận của phiếu ${previous.code}.`);
    }

    if (previous?.status === 'returned' && handover.status !== 'returned') {
      throw handoverError(`Phiếu ${previous.code} đã hoàn trả và không thể mở lại.`);
    }
    if (handover.status === 'returned' && (!previous || previous.status !== 'returned' && previous.status !== 'active')) {
      throw handoverError('Chỉ có thể đánh dấu đã trả cho phiếu bàn giao đang hoạt động.');
    }

    if (handover.status === 'active') {
      if (!handover.deviceId || !incomingDevices.has(handover.deviceId)) {
        throw handoverError(`Phiếu ${handover.code} phải tham chiếu đến một thiết bị đang tồn tại.`);
      }
      if (activeByDevice.has(handover.deviceId)) {
        throw handoverError('Thiết bị đang có nhiều hơn một phiếu sử dụng chưa trả.');
      }
      activeByDevice.set(handover.deviceId, handover.id);

      const device = incomingDevices.get(handover.deviceId);
      const hasInProgressMaintenance = snapshot.maintenance.some(
        (item) => item.deviceId === handover.deviceId && item.status === 'in_progress',
      );
      if (hasInProgressMaintenance) {
        throw handoverError(`Thiết bị trong phiếu ${handover.code} đang được sửa chữa.`);
      }
      const expectedStatus = handover.type === 'borrow' ? 'borrowed' : 'in_use';
      if (device.status !== expectedStatus
        || !sameId(device.userId, handover.userId)
        || !sameId(device.departmentId, handover.departmentId)) {
        throw handoverError(`Thiết bị trong phiếu ${handover.code} phải có đúng trạng thái, người giữ và phòng ban theo phiếu.`);
      }

      if (!previous || previous.status !== 'active') {
        const oldDevice = previousDevices.get(handover.deviceId);
        const oldActiveHandover = [...previousHandovers.values()].some(
          (row) => row.device_id === handover.deviceId && row.status === 'active',
        );
        if (!oldDevice || oldDevice.status !== 'available' || oldActiveHandover) {
          throw handoverError('Chỉ được bàn giao thiết bị đang sẵn sàng và chưa có phiếu sử dụng chưa trả.');
        }
        const user = incomingUsers.get(handover.userId);
        if (!user || !sameId(user.departmentId, handover.departmentId)) {
          throw handoverError('Phòng ban trên phiếu phải khớp với phòng ban hiện tại của nhân viên nhận.');
        }
      }
    }

    if (previous?.status === 'active' && handover.status === 'returned') {
      const actualReturnDate = dateOnly(handover.actualReturnDate);
      const handoverDate = dateOnly(previous.handover_date);
      if (!actualReturnDate || handoverDate && actualReturnDate < handoverDate) {
        throw handoverError('Ngày trả phải được ghi nhận và không được trước ngày bàn giao.');
      }
      const device = incomingDevices.get(handover.deviceId);
      const validLocations = { available: 'Kho IT', maintenance: 'Khu vực bảo trì', broken: 'Khu vực thiết bị hỏng' };
      if (!device || !Object.hasOwn(validLocations, device.status)
        || device.userId != null || device.departmentId != null
        || device.location !== validLocations[device.status]) {
        throw handoverError('Khi trả phải cập nhật thiết bị, xóa người giữ/phòng ban và chuyển về đúng vị trí theo trạng thái.');
      }
    }
  }
};

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

export const replaceSnapshot = async (input, expectedVersion, options = {}) => {
  if (expectedVersion === undefined || expectedVersion === null || expectedVersion === '') {
    const error = new Error('Thiếu phiên bản dữ liệu. Hãy tải lại dữ liệu trước khi lưu.');
    error.status = 428;
    throw error;
  }

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
    const versionResult = await client.query(
      "SELECT value FROM app_metadata WHERE key = 'dataVersion' FOR UPDATE",
    );
    const currentVersion = Number(versionResult.rows[0]?.value ?? 0);
    if (!Number.isSafeInteger(currentVersion) || String(currentVersion) !== String(expectedVersion)) {
      const error = new Error('Dữ liệu đã được người khác cập nhật. Hãy tải lại dữ liệu rồi thực hiện lại thay đổi.');
      error.status = 409;
      throw error;
    }

    await validateHandoverTransitions(client, snapshot, options);

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
    const nextVersion = currentVersion + 1;
    await client.query(
      `INSERT INTO app_metadata (key, value) VALUES ('updatedAt', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [updatedAt],
    );
    await client.query(
      `INSERT INTO app_metadata (key, value) VALUES ('dataVersion', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [String(nextVersion)],
    );
    await client.query('COMMIT');
    return { ...snapshot, updatedAt, revision: nextVersion };
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
    pool.query("SELECT key, value FROM app_metadata WHERE key IN ('updatedAt', 'dataVersion')"),
  ]);

  const recordsByAudit = new Map();
  for (const record of records.rows) {
    const group = recordsByAudit.get(record.auditId) || [];
    group.push({ deviceId: record.deviceId, status: record.status, note: record.note });
    recordsByAudit.set(record.auditId, group);
  }
  const metadataByKey = Object.fromEntries(metadata.rows.map(({ key, value }) => [key, value]));
  return {
    departments: departments.rows,
    users: users.rows,
    devices: devices.rows,
    handovers: handovers.rows,
    maintenance: maintenance.rows,
    audits: audits.rows.map((audit) => ({ ...audit, records: recordsByAudit.get(audit.id) || [] })),
    updatedAt: metadataByKey.updatedAt || null,
    revision: Number(metadataByKey.dataVersion ?? 0),
  };
};

export const closePool = () => pool.end();
