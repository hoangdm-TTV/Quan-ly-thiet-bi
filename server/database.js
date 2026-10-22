import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Thiếu DATABASE_URL. Hãy tạo file .env từ .env.example và cấu hình PostgreSQL.",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PGPOOL_MAX || 10),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

export const initializeSchema = async () => {
  const sql = await fs.readFile(path.join(currentDir, "schema.sql"), "utf8");
  await pool.query(sql);
  const auditWorkflowMigration = await fs.readFile(
    path.join(currentDir, "migrations", "20261020_audit_workflow.sql"),
    "utf8",
  );
  await pool.query(auditWorkflowMigration);
  await pool.query(
    `INSERT INTO app_metadata (key, value) VALUES ('dataVersion', '0')
     ON CONFLICT (key) DO NOTHING`,
  );
};

const dateValue = (value) => value || null;
const dateOnly = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = String(value.getFullYear()).padStart(4, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof value === "string")
    return value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/)?.[1] || null;
  return null;
};
const cleanText = (value) => (value === undefined ? null : value);
const sameId = (left, right) => (left ?? null) === (right ?? null);

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });
const handoverError = (message) => httpError(422, message);

const validateHandoverTransitions = async (
  client,
  snapshot,
  { allowReset = false } = {},
) => {
  const [handoverResult, deviceResult, maintenanceResult] = await Promise.all([
    client.query(
      "SELECT id, code, type, device_id, user_id, department_id, handover_date, status FROM handovers",
    ),
    client.query("SELECT id, status, user_id, department_id FROM devices"),
    client.query("SELECT id, code, device_id, status FROM maintenance"),
  ]);
  const previousHandovers = new Map(
    handoverResult.rows.map((row) => [row.id, row]),
  );
  const previousDevices = new Map(
    deviceResult.rows.map((row) => [row.id, row]),
  );
  const previousMaintenance = new Map(
    maintenanceResult.rows.map((row) => [row.id, row]),
  );
  const incomingHandovers = new Map(
    snapshot.handovers.map((row) => [row.id, row]),
  );
  const incomingDevices = new Map(snapshot.devices.map((row) => [row.id, row]));
  const incomingMaintenance = new Map(
    snapshot.maintenance.map((row) => [row.id, row]),
  );
  const incomingUsers = new Map(snapshot.users.map((row) => [row.id, row]));
  const activeByDevice = new Map();

  if (!allowReset) {
    for (const oldHandover of previousHandovers.values()) {
      if (!incomingHandovers.has(oldHandover.id)) {
        throw handoverError(
          `Không thể xóa phiếu bàn giao ${oldHandover.code}; hãy giữ lại lịch sử phiếu.`,
        );
      }
    }
    for (const oldMaintenance of previousMaintenance.values()) {
      const maintenance = incomingMaintenance.get(oldMaintenance.id);
      if (!maintenance) {
        throw handoverError(
          `Không thể xóa phiếu bảo trì ${oldMaintenance.code}; hãy giữ lại lịch sử tài sản.`,
        );
      }
      if (
        maintenance.code !== oldMaintenance.code ||
        !sameId(oldMaintenance.device_id, maintenance.deviceId)
      ) {
        throw handoverError(
          `Không thể đổi mã phiếu hoặc thiết bị của phiếu bảo trì ${oldMaintenance.code}.`,
        );
      }
      if (
        (oldMaintenance.status === "completed" &&
          maintenance.status !== "completed") ||
        (oldMaintenance.status === "in_progress" &&
          maintenance.status === "scheduled") ||
        (oldMaintenance.status === "scheduled" &&
          maintenance.status === "completed")
      ) {
        throw handoverError(
          `Trạng thái phiếu bảo trì ${oldMaintenance.code} không theo đúng thứ tự lên lịch, xử lý, nghiệm thu.`,
        );
      }
    }
    for (const oldDeviceId of previousDevices.keys()) {
      if (incomingDevices.has(oldDeviceId)) continue;
      const hasHistory =
        [...previousHandovers.values()].some(
          (row) => row.device_id === oldDeviceId,
        ) ||
        [...previousMaintenance.values()].some(
          (row) => row.device_id === oldDeviceId,
        );
      if (hasHistory) {
        throw handoverError(
          "Không thể xóa thiết bị đã có lịch sử bàn giao hoặc bảo trì; hãy ghi nhận thanh lý để giữ hồ sơ.",
        );
      }
    }
  }

  for (const handover of snapshot.handovers) {
    const previous = previousHandovers.get(handover.id);
    if (
      previous &&
      (previous.code !== handover.code ||
        previous.type !== handover.type ||
        !sameId(previous.device_id, handover.deviceId) ||
        !sameId(previous.user_id, handover.userId))
    ) {
      throw handoverError(
        `Không thể đổi mã phiếu, loại phiếu, thiết bị hoặc người nhận của phiếu ${previous.code}.`,
      );
    }

    if (previous?.status === "returned" && handover.status !== "returned") {
      throw handoverError(
        `Phiếu ${previous.code} đã hoàn trả và không thể mở lại.`,
      );
    }
    if (
      handover.status === "returned" &&
      (!previous ||
        (previous.status !== "returned" && previous.status !== "active"))
    ) {
      throw handoverError(
        "Chỉ có thể đánh dấu đã trả cho phiếu bàn giao đang hoạt động.",
      );
    }

    if (handover.status === "active") {
      if (!handover.deviceId || !incomingDevices.has(handover.deviceId)) {
        throw handoverError(
          `Phiếu ${handover.code} phải tham chiếu đến một thiết bị đang tồn tại.`,
        );
      }
      if (activeByDevice.has(handover.deviceId)) {
        throw handoverError(
          "Thiết bị đang có nhiều hơn một phiếu sử dụng chưa trả.",
        );
      }
      activeByDevice.set(handover.deviceId, handover.id);

      const device = incomingDevices.get(handover.deviceId);
      const hasInProgressMaintenance = snapshot.maintenance.some(
        (item) =>
          item.deviceId === handover.deviceId && item.status === "in_progress",
      );
      if (hasInProgressMaintenance) {
        throw handoverError(
          `Thiết bị trong phiếu ${handover.code} đang được sửa chữa.`,
        );
      }
      const expectedStatus = handover.type === "borrow" ? "borrowed" : "in_use";
      if (
        device.status !== expectedStatus ||
        !sameId(device.userId, handover.userId) ||
        !sameId(device.departmentId, handover.departmentId)
      ) {
        throw handoverError(
          `Thiết bị trong phiếu ${handover.code} phải có đúng trạng thái, người giữ và phòng ban theo phiếu.`,
        );
      }

      if (!previous || previous.status !== "active") {
        const oldDevice = previousDevices.get(handover.deviceId);
        const oldActiveHandover = [...previousHandovers.values()].some(
          (row) =>
            row.device_id === handover.deviceId && row.status === "active",
        );
        if (
          !oldDevice ||
          oldDevice.status !== "available" ||
          oldActiveHandover
        ) {
          throw handoverError(
            "Chỉ được bàn giao thiết bị đang sẵn sàng và chưa có phiếu sử dụng chưa trả.",
          );
        }
        const user = incomingUsers.get(handover.userId);
        if (!user || !sameId(user.departmentId, handover.departmentId)) {
          throw handoverError(
            "Phòng ban trên phiếu phải khớp với phòng ban hiện tại của nhân viên nhận.",
          );
        }
      }
    }

    if (previous?.status === "active" && handover.status === "returned") {
      const actualReturnDate = dateOnly(handover.actualReturnDate);
      const handoverDate = dateOnly(previous.handover_date);
      if (
        !actualReturnDate ||
        (handoverDate && actualReturnDate < handoverDate)
      ) {
        throw handoverError(
          "Ngày trả phải được ghi nhận và không được trước ngày bàn giao.",
        );
      }
      const device = incomingDevices.get(handover.deviceId);
      const validLocations = {
        available: "Kho IT",
        maintenance: "Khu vực bảo trì",
        broken: "Khu vực thiết bị hỏng",
      };
      if (
        !device ||
        !Object.hasOwn(validLocations, device.status) ||
        device.userId != null ||
        device.departmentId != null ||
        device.location !== validLocations[device.status]
      ) {
        throw handoverError(
          "Khi trả phải cập nhật thiết bị, xóa người giữ/phòng ban và chuyển về đúng vị trí theo trạng thái.",
        );
      }
    }
  }
};

// ---------------------------------------------------------------------------
// Ghi theo từng dòng thay đổi (upsert) thay vì TRUNCATE + insert lại toàn bộ.
// Tên bảng/cột lấy từ hằng số bên dưới, không bao giờ từ dữ liệu người dùng.
// ---------------------------------------------------------------------------

const TABLES = {
  departments: {
    columns: [
      ["id", "text"],
      ["name", "text"],
      ["code", "text"],
      ["manager", "text"],
      ["room", "text"],
    ],
    toRow: (r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      manager: cleanText(r.manager),
      room: cleanText(r.room),
    }),
  },
  users: {
    columns: [
      ["id", "text"],
      ["code", "text"],
      ["name", "text"],
      ["email", "text"],
      ["phone", "text"],
      ["department_id", "text"],
      ["position", "text"],
      ["avatar", "text"],
    ],
    toRow: (r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      email: cleanText(r.email),
      phone: cleanText(r.phone),
      department_id: cleanText(r.departmentId),
      position: cleanText(r.position),
      avatar: cleanText(r.avatar),
    }),
  },
  devices: {
    columns: [
      ["id", "text"],
      ["code", "text"],
      ["name", "text"],
      ["category", "text"],
      ["brand", "text"],
      ["model", "text"],
      ["serial", "text"],
      ["specs", "text"],
      ["status", "text"],
      ["user_id", "text"],
      ["department_id", "text"],
      ["purchase_date", "date"],
      ["purchase_cost", "numeric"],
      ["warranty_until", "date"],
      ["location", "text"],
      ["notes", "text"],
    ],
    toRow: (r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      category: r.category,
      brand: cleanText(r.brand),
      model: cleanText(r.model),
      serial: cleanText(r.serial),
      specs: cleanText(r.specs),
      status: r.status || "available",
      user_id: cleanText(r.userId),
      department_id: cleanText(r.departmentId),
      purchase_date: dateValue(r.purchaseDate),
      purchase_cost: r.purchaseCost ?? null,
      warranty_until: dateValue(r.warrantyUntil),
      location: cleanText(r.location),
      notes: cleanText(r.notes),
    }),
  },
  handovers: {
    columns: [
      ["id", "text"],
      ["code", "text"],
      ["type", "text"],
      ["device_id", "text"],
      ["user_id", "text"],
      ["department_id", "text"],
      ["handover_date", "date"],
      ["expected_return_date", "date"],
      ["actual_return_date", "date"],
      ["status", "text"],
      ["giver_id", "text"],
      ["giver_name", "text"],
      ["device_condition", "text"],
      ["notes", "text"],
    ],
    toRow: (r) => ({
      id: r.id,
      code: r.code,
      type: r.type,
      device_id: cleanText(r.deviceId),
      user_id: cleanText(r.userId),
      department_id: cleanText(r.departmentId),
      handover_date: dateValue(r.handoverDate),
      expected_return_date: dateValue(r.expectedReturnDate),
      actual_return_date: dateValue(r.actualReturnDate),
      status: r.status || "active",
      giver_id: cleanText(r.giverId),
      giver_name: cleanText(r.giverName),
      device_condition: cleanText(r.condition),
      notes: cleanText(r.notes),
    }),
  },
  maintenance: {
    columns: [
      ["id", "text"],
      ["code", "text"],
      ["device_id", "text"],
      ["issue", "text"],
      ["solution", "text"],
      ["cost", "numeric"],
      ["vendor", "text"],
      ["status", "text"],
      ["start_date", "date"],
      ["completed_date", "date"],
      ["technician", "text"],
      ["notes", "text"],
    ],
    toRow: (r) => ({
      id: r.id,
      code: r.code,
      device_id: cleanText(r.deviceId),
      issue: r.issue,
      solution: cleanText(r.solution),
      cost: r.cost ?? 0,
      vendor: cleanText(r.vendor),
      status: r.status,
      start_date: dateValue(r.startDate),
      completed_date: dateValue(r.completedDate),
      technician: cleanText(r.technician),
      notes: cleanText(r.notes),
    }),
  },
};

// Thứ tự thêm/sửa theo khóa ngoại; thứ tự xóa là ngược lại.
const UPSERT_ORDER = [
  "departments",
  "users",
  "devices",
  "handovers",
  "maintenance",
];

const upsertTable = async (client, table, rows) => {
  if (rows.length === 0) return;
  const { columns, toRow } = TABLES[table];
  const names = columns.map(([name]) => name);
  const dataNames = names.filter((name) => name !== "id");
  const definitions = columns
    .map(([name, type]) => `${name} ${type}`)
    .join(", ");
  const assignments = dataNames
    .map((name) => `${name} = EXCLUDED.${name}`)
    .join(", ");
  const current = dataNames.map((name) => `${table}.${name}`).join(", ");
  const incoming = dataNames.map((name) => `EXCLUDED.${name}`).join(", ");
  // Chỉ ghi dòng thật sự khác; dòng không đổi bị bỏ qua.
  await client.query(
    `INSERT INTO ${table} (${names.join(", ")})
     SELECT ${names.join(", ")} FROM jsonb_to_recordset($1::jsonb) AS r(${definitions})
     ON CONFLICT (id) DO UPDATE SET ${assignments}
     WHERE (${current}) IS DISTINCT FROM (${incoming})`,
    [JSON.stringify(rows.map(toRow))],
  );
};

const deleteMissing = async (client, table, rows) => {
  await client.query(`DELETE FROM ${table} WHERE id <> ALL($1::text[])`, [
    rows.map((row) => row.id),
  ]);
};

export const replaceSnapshot = async (input, expectedVersion, options = {}) => {
  if (
    expectedVersion === undefined ||
    expectedVersion === null ||
    expectedVersion === ""
  ) {
    const error = new Error(
      "Thiếu phiên bản dữ liệu. Hãy tải lại dữ liệu trước khi lưu.",
    );
    error.status = 428;
    throw error;
  }

  // Kiểm kê (audits) đã tách ra API riêng nên không còn nằm trong snapshot.
  const snapshot = {
    departments: input.departments || [],
    users: input.users || [],
    devices: input.devices || [],
    handovers: input.handovers || [],
    maintenance: input.maintenance || [],
  };
  for (const key of UPSERT_ORDER) {
    if (!Array.isArray(snapshot[key]))
      throw new Error(`Danh sách ${key} phải là một mảng.`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const versionResult = await client.query(
      "SELECT value FROM app_metadata WHERE key = 'dataVersion' FOR UPDATE",
    );
    const currentVersion = Number(versionResult.rows[0]?.value ?? 0);
    if (
      !Number.isSafeInteger(currentVersion) ||
      String(currentVersion) !== String(expectedVersion)
    ) {
      const error = new Error(
        "Dữ liệu đã được người khác cập nhật. Hãy tải lại dữ liệu rồi thực hiện lại thay đổi.",
      );
      error.status = 409;
      throw error;
    }

    await validateHandoverTransitions(client, snapshot, options);

    for (const table of UPSERT_ORDER)
      await upsertTable(client, table, snapshot[table]);
    for (const table of [...UPSERT_ORDER].reverse())
      await deleteMissing(client, table, snapshot[table]);

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
    await client.query("COMMIT");
    return { ...snapshot, updatedAt, revision: nextVersion };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// Kiểm kê: ghi từng dòng, không dùng phiên bản chung nên nhiều người quét
// các thiết bị khác nhau cùng lúc không xung đột.
// ---------------------------------------------------------------------------

const AUDIT_COLUMNS =
  'id, code, title, audit_date AS "auditDate", auditor, status, notes, total_checked AS "totalChecked", matched_count AS "matchedCount", discrepancy_count AS "discrepancyCount"';
const RECORD_COLUMNS =
  'device_id AS "deviceId", status, note, found_at AS "foundAt", found_by AS "foundBy", checked_at AS "checkedAt", checked_by AS "checkedBy", discrepancies, system_snapshot AS "systemSnapshot"';

const mapRecord = (record) => ({
  ...record,
  discrepancies: record.discrepancies || [],
  systemSnapshot: record.systemSnapshot || {},
});

const loadAudit = async (db, auditId) => {
  const auditResult = await db.query(
    `SELECT ${AUDIT_COLUMNS} FROM audits WHERE id = $1`,
    [auditId],
  );
  if (!auditResult.rows[0]) return null;
  const records = await db.query(
    `SELECT ${RECORD_COLUMNS} FROM audit_records WHERE audit_id = $1 ORDER BY device_id`,
    [auditId],
  );
  return { ...auditResult.rows[0], records: records.rows.map(mapRecord) };
};

const recomputeAuditCounts = (client, auditId) =>
  client.query(
    `UPDATE audits SET
     total_checked = (SELECT COUNT(*) FROM audit_records WHERE audit_id = $1 AND status IN ('found', 'confirmed', 'discrepancy')),
     matched_count = (SELECT COUNT(*) FROM audit_records WHERE audit_id = $1 AND status = 'confirmed'),
     discrepancy_count = (SELECT COUNT(*) FROM audit_records WHERE audit_id = $1 AND status = 'discrepancy')
   WHERE id = $1`,
    [auditId],
  );

const inTransaction = async (work) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const createAudit = async (input) => {
  if (
    !input?.id ||
    !String(input.code || "").trim() ||
    !String(input.title || "").trim()
  ) {
    throw httpError(422, "Đợt kiểm kê cần có mã và tên.");
  }
  await pool.query(
    `INSERT INTO audits (id, code, title, audit_date, auditor, status, notes, total_checked, matched_count, discrepancy_count)
     VALUES ($1, $2, $3, $4, $5, 'in_progress', $6, 0, 0, 0)`,
    [
      input.id,
      input.code,
      input.title,
      dateValue(input.auditDate),
      cleanText(input.auditor),
      cleanText(input.notes),
    ],
  );
  return loadAudit(pool, input.id);
};

export const saveAuditRecord = async (auditId, deviceId, input) => {
  if (!["found", "confirmed", "discrepancy"].includes(input?.status)) {
    throw httpError(422, "Trạng thái dòng kiểm kê không hợp lệ.");
  }
  await inTransaction(async (client) => {
    const audit = await client.query(
      "SELECT status FROM audits WHERE id = $1 FOR UPDATE",
      [auditId],
    );
    if (!audit.rows[0]) throw httpError(404, "Không tìm thấy đợt kiểm kê.");
    if (audit.rows[0].status === "completed")
      throw httpError(409, "Đợt kiểm kê đã chốt, không thể ghi nhận thêm.");
    const device = await client.query("SELECT 1 FROM devices WHERE id = $1", [
      deviceId,
    ]);
    if (!device.rowCount)
      throw httpError(404, "Không tìm thấy thiết bị trong hệ thống.");

    await client.query(
      `INSERT INTO audit_records (audit_id, device_id, status, note, found_at, found_by, checked_at, checked_by, discrepancies, system_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb)
       ON CONFLICT (audit_id, device_id) DO UPDATE SET
         status = EXCLUDED.status, note = EXCLUDED.note,
         found_at = EXCLUDED.found_at, found_by = EXCLUDED.found_by,
         checked_at = EXCLUDED.checked_at, checked_by = EXCLUDED.checked_by,
         discrepancies = EXCLUDED.discrepancies, system_snapshot = EXCLUDED.system_snapshot`,
      [
        auditId,
        deviceId,
        input.status,
        cleanText(input.note),
        dateValue(input.foundAt),
        cleanText(input.foundBy),
        dateValue(input.checkedAt),
        cleanText(input.checkedBy),
        JSON.stringify(
          Array.isArray(input.discrepancies) ? input.discrepancies : [],
        ),
        JSON.stringify(
          input.systemSnapshot && typeof input.systemSnapshot === "object"
            ? input.systemSnapshot
            : {},
        ),
      ],
    );
    await recomputeAuditCounts(client, auditId);
  });
  return loadAudit(pool, auditId);
};

export const finishAudit = async (auditId) => {
  await inTransaction(async (client) => {
    const audit = await client.query(
      "SELECT status FROM audits WHERE id = $1 FOR UPDATE",
      [auditId],
    );
    if (!audit.rows[0]) throw httpError(404, "Không tìm thấy đợt kiểm kê.");
    if (audit.rows[0].status === "completed") return;
    // Thiết bị chưa được quét trong đợt này chuyển thành "chưa xác minh".
    await client.query(
      `INSERT INTO audit_records (audit_id, device_id, status)
       SELECT $1, d.id, 'unverified' FROM devices d
       WHERE NOT EXISTS (SELECT 1 FROM audit_records r WHERE r.audit_id = $1 AND r.device_id = d.id)`,
      [auditId],
    );
    await recomputeAuditCounts(client, auditId);
    await client.query("UPDATE audits SET status = 'completed' WHERE id = $1", [
      auditId,
    ]);
  });
  return loadAudit(pool, auditId);
};

export const getSnapshot = async () => {
  const [
    departments,
    users,
    devices,
    handovers,
    maintenance,
    audits,
    records,
    metadata,
  ] = await Promise.all([
    pool.query(
      "SELECT id, name, code, manager, room FROM departments ORDER BY id",
    ),
    pool.query(
      'SELECT id, code, name, email, phone, department_id AS "departmentId", position, avatar FROM users ORDER BY id',
    ),
    pool.query(
      'SELECT id, code, name, category, brand, model, serial, specs, status, user_id AS "userId", department_id AS "departmentId", purchase_date AS "purchaseDate", purchase_cost::float8 AS "purchaseCost", warranty_until AS "warrantyUntil", location, notes FROM devices ORDER BY id',
    ),
    pool.query(
      'SELECT id, code, type, device_id AS "deviceId", user_id AS "userId", department_id AS "departmentId", handover_date AS "handoverDate", expected_return_date AS "expectedReturnDate", actual_return_date AS "actualReturnDate", status, giver_id AS "giverId", giver_name AS "giverName", device_condition AS condition, notes FROM handovers ORDER BY handover_date DESC NULLS LAST, id',
    ),
    pool.query(
      'SELECT id, code, device_id AS "deviceId", issue, solution, cost::float8 AS cost, vendor, status, start_date AS "startDate", completed_date AS "completedDate", technician, notes FROM maintenance ORDER BY start_date DESC NULLS LAST, id',
    ),
    pool.query(
      `SELECT ${AUDIT_COLUMNS} FROM audits ORDER BY audit_date DESC NULLS LAST, id`,
    ),
    pool.query(
      `SELECT audit_id AS "auditId", ${RECORD_COLUMNS} FROM audit_records ORDER BY audit_id, device_id`,
    ),
    pool.query(
      "SELECT key, value FROM app_metadata WHERE key IN ('updatedAt', 'dataVersion')",
    ),
  ]);

  const recordsByAudit = new Map();
  for (const { auditId, ...record } of records.rows) {
    const group = recordsByAudit.get(auditId) || [];
    group.push(mapRecord(record));
    recordsByAudit.set(auditId, group);
  }
  const metadataByKey = Object.fromEntries(
    metadata.rows.map(({ key, value }) => [key, value]),
  );
  return {
    departments: departments.rows,
    users: users.rows,
    devices: devices.rows,
    handovers: handovers.rows,
    maintenance: maintenance.rows,
    audits: audits.rows.map((audit) => ({
      ...audit,
      records: recordsByAudit.get(audit.id) || [],
    })),
    updatedAt: metadataByKey.updatedAt || null,
    revision: Number(metadataByKey.dataVersion ?? 0),
  };
};

export const closePool = () => pool.end();
