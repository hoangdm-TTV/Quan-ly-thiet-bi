const TABLES = {
  departments: { columns: ["id", "name", "code", "manager", "room"], map: (r) => [r.id, r.name, r.code, r.manager ?? null, r.room ?? null] },
  users: { columns: ["id", "code", "name", "email", "phone", "department_id", "position", "avatar"], map: (r) => [r.id, r.code, r.name, r.email ?? null, r.phone ?? null, r.departmentId ?? null, r.position ?? null, r.avatar ?? null] },
  devices: { columns: ["id", "code", "name", "category", "brand", "model", "serial", "specs", "status", "user_id", "department_id", "purchase_date", "purchase_cost", "warranty_until", "location", "notes"], map: (r) => [r.id, r.code, r.name, r.category, r.brand ?? null, r.model ?? null, r.serial ?? null, r.specs ?? null, r.status || "available", r.userId ?? null, r.departmentId ?? null, r.purchaseDate ?? null, r.purchaseCost ?? null, r.warrantyUntil ?? null, r.location ?? null, r.notes ?? null] },
  handovers: { columns: ["id", "code", "type", "device_id", "user_id", "department_id", "handover_date", "expected_return_date", "actual_return_date", "status", "giver_id", "giver_name", "device_condition", "notes"], map: (r) => [r.id, r.code, r.type, r.deviceId ?? null, r.userId ?? null, r.departmentId ?? null, r.handoverDate ?? null, r.expectedReturnDate ?? null, r.actualReturnDate ?? null, r.status || "active", r.giverId ?? null, r.giverName ?? null, r.condition ?? null, r.notes ?? null] },
  maintenance: { columns: ["id", "code", "device_id", "issue", "solution", "cost", "vendor", "status", "start_date", "completed_date", "technician", "notes"], map: (r) => [r.id, r.code, r.deviceId ?? null, r.issue, r.solution ?? null, r.cost ?? 0, r.vendor ?? null, r.status, r.startDate ?? null, r.completedDate ?? null, r.technician ?? null, r.notes ?? null] },
};
const ORDER = ["departments", "users", "devices", "handovers", "maintenance"];
const fail = (status, message) => Object.assign(new Error(message), { status });
const same = (a, b) => (a ?? null) === (b ?? null);
const dateOnly = (value) => typeof value === "string" ? value.slice(0, 10) : null;
const runRows = async (db, sql) => (await db.prepare(sql).all()).results || [];

export const getSnapshot = async (db) => {
  const results = await db.batch([
    db.prepare("SELECT id, name, code, manager, room FROM departments ORDER BY id"),
    db.prepare('SELECT id, code, name, email, phone, department_id AS "departmentId", position, avatar FROM users ORDER BY id'),
    db.prepare('SELECT id, code, name, category, brand, model, serial, specs, status, user_id AS "userId", department_id AS "departmentId", purchase_date AS "purchaseDate", purchase_cost AS "purchaseCost", warranty_until AS "warrantyUntil", location, notes FROM devices ORDER BY id'),
    db.prepare('SELECT id, code, type, device_id AS "deviceId", user_id AS "userId", department_id AS "departmentId", handover_date AS "handoverDate", expected_return_date AS "expectedReturnDate", actual_return_date AS "actualReturnDate", status, giver_id AS "giverId", giver_name AS "giverName", device_condition AS condition, notes FROM handovers ORDER BY handover_date DESC, id'),
    db.prepare('SELECT id, code, device_id AS "deviceId", issue, solution, cost, vendor, status, start_date AS "startDate", completed_date AS "completedDate", technician, notes FROM maintenance ORDER BY start_date DESC, id'),
    db.prepare('SELECT id, code, title, audit_date AS "auditDate", auditor, status, notes, total_checked AS "totalChecked", matched_count AS "matchedCount", discrepancy_count AS "discrepancyCount" FROM audits ORDER BY audit_date DESC, id'),
    db.prepare('SELECT audit_id AS "auditId", device_id AS "deviceId", status, note, found_at AS "foundAt", found_by AS "foundBy", checked_at AS "checkedAt", checked_by AS "checkedBy", discrepancies, system_snapshot AS "systemSnapshot" FROM audit_records ORDER BY audit_id, device_id'),
    db.prepare("SELECT key, value FROM app_metadata WHERE key IN ('updatedAt','dataVersion')"),
  ]);
  const [departments, users, devices, handovers, maintenance, audits, records, metadata] = results.map((result) => result.results || []);
  const byAudit = new Map();
  for (const row of records) {
    const group = byAudit.get(row.auditId) || [];
    group.push({ ...row, discrepancies: JSON.parse(row.discrepancies || "[]"), systemSnapshot: JSON.parse(row.systemSnapshot || "{}") });
    byAudit.set(row.auditId, group);
  }
  const meta = Object.fromEntries(metadata.map(({ key, value }) => [key, value]));
  return { departments, users, devices, handovers, maintenance, audits: audits.map((audit) => ({ ...audit, records: byAudit.get(audit.id) || [] })), updatedAt: meta.updatedAt || null, revision: Number(meta.dataVersion || 0) };
};

const validateTransitions = async (db, snapshot) => {
  const [oldHandovers, oldDevices, oldMaintenance] = await Promise.all([
    runRows(db, "SELECT id, code, type, device_id, user_id, department_id, handover_date, status FROM handovers"),
    runRows(db, "SELECT id, status, user_id, department_id FROM devices"),
    runRows(db, "SELECT id, code, device_id, status FROM maintenance"),
  ]);
  const oldH = new Map(oldHandovers.map((r) => [r.id, r]));
  const oldD = new Map(oldDevices.map((r) => [r.id, r]));
  const oldM = new Map(oldMaintenance.map((r) => [r.id, r]));
  const inH = new Map(snapshot.handovers.map((r) => [r.id, r]));
  const inD = new Map(snapshot.devices.map((r) => [r.id, r]));
  const inM = new Map(snapshot.maintenance.map((r) => [r.id, r]));
  const inU = new Map(snapshot.users.map((r) => [r.id, r]));

  for (const previous of oldH.values()) {
    const next = inH.get(previous.id);
    if (!next) throw fail(422, `Không thể xóa phiếu bàn giao ${previous.code}; hãy giữ lại lịch sử phiếu.`);
    if (previous.code !== next.code || previous.type !== next.type || !same(previous.device_id, next.deviceId) || !same(previous.user_id, next.userId)) throw fail(422, `Không thể đổi mã, loại phiếu, thiết bị hoặc người nhận của phiếu ${previous.code}.`);
    if (previous.status === "returned" && next.status !== "returned") throw fail(422, `Phiếu ${previous.code} đã hoàn trả và không thể mở lại.`);
    if (next.status === "returned" && previous.status !== "returned" && previous.status !== "active") throw fail(422, "Chỉ có thể đóng phiếu đang hoạt động.");
  }
  for (const previous of oldM.values()) {
    const next = inM.get(previous.id);
    if (!next) throw fail(422, `Không thể xóa phiếu bảo trì ${previous.code}; hãy giữ lại lịch sử.`);
    if (previous.code !== next.code || !same(previous.device_id, next.deviceId)) throw fail(422, `Không thể đổi mã hoặc thiết bị của phiếu bảo trì ${previous.code}.`);
    if ((previous.status === "completed" && next.status !== "completed") || (previous.status === "in_progress" && next.status === "scheduled") || (previous.status === "scheduled" && next.status === "completed")) throw fail(422, `Trạng thái phiếu bảo trì ${previous.code} không theo đúng thứ tự.`);
  }
  for (const previous of oldD.values()) {
    if (inD.has(previous.id)) continue;
    if (oldHandovers.some((h) => h.device_id === previous.id) || oldMaintenance.some((m) => m.device_id === previous.id)) throw fail(422, "Không thể xóa thiết bị đã có lịch sử; hãy ghi nhận thanh lý.");
  }

  const activeDeviceIds = new Set();
  for (const h of snapshot.handovers) {
    const previous = oldH.get(h.id);
    if (h.status === "returned" && !previous) throw fail(422, "Chỉ có thể đánh dấu đã trả cho phiếu bàn giao đang hoạt động.");
    if (previous?.status === "active" && h.status === "returned") {
      const actual = dateOnly(h.actualReturnDate);
      const start = dateOnly(previous.handover_date);
      const returnedDevice = inD.get(h.deviceId);
      const locations = { available: "Kho IT", maintenance: "Khu vực bảo trì", broken: "Khu vực thiết bị hỏng" };
      if (!actual || (start && actual < start)) throw fail(422, "Ngày trả phải được ghi nhận và không được trước ngày bàn giao.");
      if (!returnedDevice || !Object.hasOwn(locations, returnedDevice.status) || returnedDevice.userId != null || returnedDevice.departmentId != null || returnedDevice.location !== locations[returnedDevice.status]) throw fail(422, "Khi trả phải bỏ gán người/phòng ban và cập nhật đúng trạng thái/vị trí thiết bị.");
      continue;
    }
    if (h.status !== "active") continue;
    if (!h.deviceId || !inD.has(h.deviceId)) throw fail(422, `Phiếu ${h.code} phải tham chiếu thiết bị đang tồn tại.`);
    if (activeDeviceIds.has(h.deviceId)) throw fail(422, "Thiết bị đang có nhiều hơn một phiếu sử dụng chưa trả.");
    activeDeviceIds.add(h.deviceId);
    const device = inD.get(h.deviceId);
    if (snapshot.maintenance.some((m) => m.deviceId === h.deviceId && m.status === "in_progress")) throw fail(422, `Thiết bị trong phiếu ${h.code} đang sửa chữa.`);
    const expectedStatus = h.type === "borrow" ? "borrowed" : "in_use";
    if (device.status !== expectedStatus || !same(device.userId, h.userId) || !same(device.departmentId, h.departmentId)) throw fail(422, `Thiết bị trong phiếu ${h.code} phải khớp trạng thái/người giữ/phòng ban.`);
    if (!previous || previous.status !== "active") {
      const old = oldD.get(h.deviceId);
      if (!old || old.status !== "available" || oldHandovers.some((row) => row.device_id === h.deviceId && row.status === "active")) throw fail(422, "Chỉ bàn giao thiết bị đang sẵn sàng và chưa có phiếu chưa trả.");
      const user = inU.get(h.userId);
      if (!user || !same(user.departmentId, h.departmentId)) throw fail(422, "Phòng ban trên phiếu phải khớp phòng ban của nhân viên nhận.");
    }
  }
};

const upsertStatement = (db, table, row, guard) => {
  const { columns, map } = TABLES[table];
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns.filter((column) => column !== "id").map((column) => `${column}=excluded.${column}`).join(", ");
  const sql = `INSERT INTO ${table}(${columns.join(",")}) SELECT ${placeholders} WHERE (SELECT value FROM app_metadata WHERE key='writeGuard')=? ON CONFLICT(id) DO UPDATE SET ${updates}`;
  return db.prepare(sql).bind(...map(row), guard);
};

export const saveSnapshot = async (db, input, expectedVersion) => {
  if (expectedVersion === undefined || expectedVersion === null || expectedVersion === "") throw fail(428, "Thiếu phiên bản dữ liệu. Hãy tải lại dữ liệu trước khi lưu.");
  const snapshot = Object.fromEntries(ORDER.map((key) => [key, input?.[key] ?? []]));
  for (const key of ORDER) {
    if (!Array.isArray(snapshot[key]) || snapshot[key].length > 5000) throw fail(400, `Danh sách ${key} không hợp lệ hoặc vượt quá 5.000 bản ghi.`);
  }
  const current = await db.prepare("SELECT value FROM app_metadata WHERE key='dataVersion'").first();
  if (String(Number(current?.value || 0)) !== String(expectedVersion)) throw fail(409, "Dữ liệu đã được cập nhật. Hãy tải lại rồi thử lại.");
  await validateTransitions(db, snapshot);

  const expected = String(Number(expectedVersion));
  const next = String(Number(expectedVersion) + 1);
  const guard = crypto.randomUUID();
  const statements = [
    db.prepare("UPDATE app_metadata SET value=? WHERE key='dataVersion' AND value=?").bind(next, expected),
    db.prepare("UPDATE app_metadata SET value=? WHERE key='writeGuard' AND changes()=1").bind(guard),
  ];
  for (const table of ORDER) for (const row of snapshot[table]) statements.push(upsertStatement(db, table, row, guard));
  for (const table of [...ORDER].reverse()) {
    statements.push(db.prepare(`DELETE FROM ${table} WHERE NOT EXISTS (SELECT 1 FROM json_each(?) WHERE value=${table}.id) AND (SELECT value FROM app_metadata WHERE key='writeGuard')=?`).bind(JSON.stringify(snapshot[table].map((row) => row.id)), guard));
  }
  statements.push(db.prepare("UPDATE app_metadata SET value=? WHERE key='updatedAt' AND (SELECT value FROM app_metadata WHERE key='writeGuard')=?").bind(new Date().toISOString(), guard));
  const results = await db.batch(statements);
  if (!results[0]?.meta?.changes) throw fail(409, "Dữ liệu đã được người khác cập nhật. Hãy tải lại dữ liệu rồi thử lại.");
  return getSnapshot(db);
};

const AUDIT_SELECT = 'id, code, title, audit_date AS "auditDate", auditor, status, notes, total_checked AS "totalChecked", matched_count AS "matchedCount", discrepancy_count AS "discrepancyCount"';
const loadAudit = async (db, auditId) => {
  const [auditResult, recordResult] = await db.batch([
    db.prepare(`SELECT ${AUDIT_SELECT} FROM audits WHERE id=?`).bind(auditId),
    db.prepare('SELECT device_id AS "deviceId", status, note, found_at AS "foundAt", found_by AS "foundBy", checked_at AS "checkedAt", checked_by AS "checkedBy", discrepancies, system_snapshot AS "systemSnapshot" FROM audit_records WHERE audit_id=? ORDER BY device_id').bind(auditId),
  ]);
  const audit = auditResult.results?.[0] || null;
  if (!audit) return null;
  const safeRecords = recordResult.results || [];
  return { ...audit, records: safeRecords.map((row) => ({ ...row, discrepancies: JSON.parse(row.discrepancies || "[]"), systemSnapshot: JSON.parse(row.systemSnapshot || "{}") })) };
};

export const createAudit = async (db, input) => {
  if (!input?.id || !String(input.code || "").trim() || !String(input.title || "").trim()) throw fail(422, "Đợt kiểm kê cần có mã và tên.");
  await db.prepare("INSERT INTO audits(id,code,title,audit_date,auditor,status,notes) VALUES(?,?,?,?,?,'in_progress',?)")
    .bind(input.id, input.code, input.title, input.auditDate ?? null, input.auditor ?? null, input.notes ?? null).run();
  return loadAudit(db, input.id);
};

export const updateAudit = async (db, auditId, input) => {
  if (!String(input?.code || "").trim() || !String(input?.title || "").trim()) throw fail(422, "Đợt kiểm kê cần có mã và tên.");
  const result = await db.prepare("UPDATE audits SET code=?,title=?,audit_date=?,auditor=?,notes=? WHERE id=? AND status!='completed'")
    .bind(String(input.code).trim(), String(input.title).trim(), input.auditDate ?? null, input.auditor ?? null, input.notes ?? null, auditId).run();
  if (!result.meta?.changes) {
    const existing = await db.prepare("SELECT status FROM audits WHERE id=?").bind(auditId).first();
    if (!existing) throw fail(404, "Không tìm thấy đợt kiểm kê.");
    throw fail(409, "Đợt kiểm kê đã chốt, không thể sửa.");
  }
  return loadAudit(db, auditId);
};

export const deleteAudit = async (db, auditId) => {
  const audit = await db.prepare("SELECT status, code FROM audits WHERE id=?").bind(auditId).first();
  if (!audit) throw fail(404, "Không tìm thấy đợt kiểm kê.");
  if (audit.status === "completed") throw fail(409, "Đợt kiểm kê đã chốt, không thể xóa.");
  await db.prepare("DELETE FROM audits WHERE id=?").bind(auditId).run();
  return { success: true, message: `Đã xóa đợt kiểm kê ${audit.code}.` };
};

export const saveAuditRecord = async (db, auditId, deviceId, input) => {
  if (!["found", "confirmed", "discrepancy"].includes(input?.status)) throw fail(422, "Trạng thái dòng kiểm kê không hợp lệ.");
  const [audit, device] = await Promise.all([
    db.prepare("SELECT status FROM audits WHERE id=?").bind(auditId).first(),
    db.prepare("SELECT 1 AS found FROM devices WHERE id=?").bind(deviceId).first(),
  ]);
  if (!audit) throw fail(404, "Không tìm thấy đợt kiểm kê.");
  if (audit.status === "completed") throw fail(409, "Đợt kiểm kê đã chốt, không thể ghi nhận thêm.");
  if (!device) throw fail(404, "Không tìm thấy thiết bị trong hệ thống.");
  await db.batch([
    db.prepare(`INSERT INTO audit_records(audit_id,device_id,status,note,found_at,found_by,checked_at,checked_by,discrepancies,system_snapshot)
      VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(audit_id,device_id) DO UPDATE SET status=excluded.status,note=excluded.note,found_at=excluded.found_at,found_by=excluded.found_by,checked_at=excluded.checked_at,checked_by=excluded.checked_by,discrepancies=excluded.discrepancies,system_snapshot=excluded.system_snapshot`)
      .bind(auditId, deviceId, input.status, input.note ?? null, input.foundAt ?? null, input.foundBy ?? null, input.checkedAt ?? null, input.checkedBy ?? null, JSON.stringify(Array.isArray(input.discrepancies) ? input.discrepancies : []), JSON.stringify(input.systemSnapshot && typeof input.systemSnapshot === "object" ? input.systemSnapshot : {})),
    db.prepare(`UPDATE audits SET total_checked=(SELECT COUNT(*) FROM audit_records WHERE audit_id=? AND status IN ('found','confirmed','discrepancy')), matched_count=(SELECT COUNT(*) FROM audit_records WHERE audit_id=? AND status='confirmed'), discrepancy_count=(SELECT COUNT(*) FROM audit_records WHERE audit_id=? AND status='discrepancy') WHERE id=?`).bind(auditId, auditId, auditId, auditId),
  ]);
  return loadAudit(db, auditId);
};

export const finishAudit = async (db, auditId) => {
  const audit = await db.prepare("SELECT status FROM audits WHERE id=?").bind(auditId).first();
  if (!audit) throw fail(404, "Không tìm thấy đợt kiểm kê.");
  if (audit.status !== "completed") {
    await db.batch([
      db.prepare("INSERT OR IGNORE INTO audit_records(audit_id,device_id,status) SELECT ?,d.id,'unverified' FROM devices d").bind(auditId),
      db.prepare("UPDATE audits SET total_checked=(SELECT COUNT(*) FROM audit_records WHERE audit_id=? AND status IN ('found','confirmed','discrepancy')), matched_count=(SELECT COUNT(*) FROM audit_records WHERE audit_id=? AND status='confirmed'), discrepancy_count=(SELECT COUNT(*) FROM audit_records WHERE audit_id=? AND status='discrepancy'), status='completed' WHERE id=?").bind(auditId, auditId, auditId, auditId),
    ]);
  }
  return loadAudit(db, auditId);
};
