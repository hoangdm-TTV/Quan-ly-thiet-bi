import * as XLSX from "xlsx";
import { getLocalDateInputValue } from "../utils/formatters";
import { CATEGORIES, STATUS_MAP } from "../data/mockData";

const STORAGE_KEY = "IT_ASSET_MASTER_V1";
const API_URL = "/api";
let currentRevision = null;

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    if (
      response.status === 401 &&
      !["/auth/login", "/auth/status"].includes(path) &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("it-asset-auth-expired"));
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(
        body.error ||
          body.message ||
          `Backend trả về lỗi HTTP ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }
    const message =
      response.status === 404 && path.startsWith("/auth/")
        ? "Backend đang chạy chưa có API đăng nhập mới. Hãy dừng backend bằng Ctrl+C, chạy lại `npm run server`, rồi tải lại trang."
        : `Backend trả về HTTP ${response.status} nhưng không có phản hồi JSON.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

export const getCurrentUser = () => request("/auth/me");
export const getAuthStatus = () => request("/auth/status");

export const login = (credentials) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

export const logout = async () => {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    currentRevision = null;
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const changePassword = (passwords) =>
  request("/auth/password", {
    method: "POST",
    body: JSON.stringify(passwords),
  });

// Backend API là nguồn dữ liệu chính; không fallback ngầm sang dữ liệu mẫu.
export const fetchInitialData = async () => {
  const data = await request("/data");
  if (!data || !Array.isArray(data.devices) || !Array.isArray(data.users)) {
    throw new Error("Database trả về dữ liệu không đúng định dạng.");
  }
  currentRevision = data.revision;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return { data, isBackend: true };
};

// Cache chỉ phục vụ sao lưu/xuất khi cần, không dùng thay thế database.
export const getLocalStoredData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.devices && parsed.users) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load storage, fallback to initial data:", e);
  }

  throw new Error("Không có dữ liệu đã lưu trong trình duyệt để sao lưu.");
};

// Lưu backend trước; chỉ cập nhật cache sau khi database xác nhận thành công.
export const saveStoredData = async (data) => {
  if (currentRevision === null || currentRevision === undefined) {
    throw new Error(
      "Chưa có phiên bản dữ liệu từ database. Hãy tải lại trang trước khi lưu.",
    );
  }
  const result = await request("/data", {
    method: "POST",
    headers: { "If-Match": String(currentRevision) },
    body: JSON.stringify(data),
  });
  currentRevision = result.db.revision;
  const toSave = {
    ...data,
    updatedAt: result.db.updatedAt,
    revision: currentRevision,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  return { success: true, isBackend: true };
};

export const resetToSampleData = async () => {
  if (currentRevision === null || currentRevision === undefined) {
    throw new Error(
      "Chưa có phiên bản dữ liệu từ database. Hãy tải lại trang trước khi khôi phục.",
    );
  }
  const result = await request("/reset", {
    method: "POST",
    headers: { "If-Match": String(currentRevision) },
  });
  const defaultData = result.db;
  currentRevision = defaultData.revision;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

export const backupToJsonFile = () => {
  const data = getLocalStoredData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = getLocalDateInputValue();
  a.href = url;
  a.download = `Backup_QuanLyThietBi_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const restoreFromJsonFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.devices || !parsed.users || !parsed.departments) {
          throw new Error(
            "Dữ liệu JSON không hợp lệ (thiếu danh sách thiết bị/nhân viên/phòng ban).",
          );
        }
        await saveStoredData(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc tập tin."));
    reader.readAsText(file);
  });
};

export const exportDevicesToExcel = (devices, users, departments) => {
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const rows = devices.map((dev, idx) => ({
    STT: idx + 1,
    "Mã tài sản": dev.code,
    "Tên thiết bị": dev.name,
    Loại: CATEGORIES.find((c) => c.id === dev.category)?.name || dev.category,
    "Hãng sản xuất": dev.brand,
    Model: dev.model,
    "Số Serial": dev.serial,
    "Cấu hình chi tiết": dev.specs,
    "Trạng thái": STATUS_MAP[dev.status]?.label || dev.status,
    "Người sử dụng": dev.userId
      ? userMap[dev.userId] || "Chưa rõ"
      : "Chưa cấp phát",
    "Phòng ban": dev.departmentId
      ? deptMap[dev.departmentId] || "Chưa rõ"
      : "Chưa gán",
    "Vị trí lưu trữ": dev.location || "",
    "Giá mua (VNĐ)": dev.purchaseCost
      ? Number(dev.purchaseCost).toLocaleString("vi-VN")
      : 0,
    "Ngày mua": dev.purchaseDate || "",
    "Hạn bảo hành": dev.warrantyUntil || "",
    "Ghi chú": dev.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách thiết bị");

  const dateStr = getLocalDateInputValue();
  XLSX.writeFile(workbook, `Danh_Sach_Thiet_Bi_${dateStr}.xlsx`);
};

export const exportHandoversToExcel = (
  handovers,
  devices,
  users,
  departments,
) => {
  const devMap = Object.fromEntries(devices.map((d) => [d.id, d]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const rows = handovers.map((h, idx) => {
    const dev = devMap[h.deviceId] || {};
    return {
      STT: idx + 1,
      "Mã phiếu": h.code,
      "Hình thức": h.type === "handover" ? "Bàn giao" : "Cho mượn",
      "Mã thiết bị": dev.code || "",
      "Tên thiết bị": dev.name || "",
      "Người nhận": userMap[h.userId] || "",
      "Phòng ban": deptMap[h.departmentId] || "",
      "Ngày bàn giao/mượn": h.handoverDate || "",
      "Hạn trả dự kiến": h.expectedReturnDate || "Vô thời hạn",
      "Ngày trả thực tế":
        h.actualReturnDate || (h.status === "returned" ? "Đã trả" : "Chưa trả"),
      "Trạng thái":
        h.status === "returned" ? "Đã hoàn trả" : "Đang sử dụng/mượn",
      "Người bàn giao": h.giverName || "",
      "Tình trạng thiết bị": h.condition || "",
      "Ghi chú": h.notes || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "BanGiao_MuonTra");

  const dateStr = getLocalDateInputValue();
  XLSX.writeFile(workbook, `Lich_Su_Ban_Giao_Muon_Tra_${dateStr}.xlsx`);
};

export const exportAuditsToExcel = (
  audit,
  devices,
  users = [],
  departments = [],
) => {
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const recordMap = new Map(
    (audit.records || []).map((record) => [record.deviceId, record]),
  );
  const rows = devices.map((dev, idx) => {
    const rec = recordMap.get(dev.id) || { status: "not_checked" };
    const baseline = {
      ...{
        holder: userMap[dev.userId]?.name || "Không có người giữ",
        department: deptMap[dev.departmentId] || "Chưa gán phòng ban",
        location: dev.location || "Chưa ghi vị trí",
        status: STATUS_MAP[dev.status]?.label || dev.status || "",
      },
      ...(rec.systemSnapshot || {}),
    };
    const discrepancyText = (rec.discrepancies || [])
      .map((item) => `${item.label}: ${item.expected} → ${item.actual}`)
      .join("; ");
    return {
      STT: idx + 1,
      "Mã tài sản": dev.code || "",
      "Tên thiết bị": dev.name || "",
      Serial: dev.serial || "",
      "Người giữ theo hệ thống": baseline.holder,
      "Phòng ban theo hệ thống": baseline.department,
      "Vị trí theo hệ thống": baseline.location,
      "Trạng thái thiết bị": baseline.status,
      "Trạng thái kiểm kê":
        {
          found: "Đã tìm thấy - chờ xác nhận",
          confirmed: "Đã xác nhận đúng",
          matched: "Đã xác nhận đúng",
          discrepancy: "Có chênh lệch",
          unverified: "Chưa xác minh",
          not_checked: "Chưa kiểm",
        }[rec.status] || "Chưa kiểm",
      "Chi tiết chênh lệch (hệ thống → thực tế)": discrepancyText,
      "Ghi chú kiểm kê": rec.note || "",
      "Thời điểm tìm thấy": rec.foundAt || "",
      "Người ghi nhận tìm thấy": rec.foundBy || "",
      "Thời điểm đối chiếu": rec.checkedAt || "",
      "Người đối chiếu": rec.checkedBy || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "KetQuaKiemKe");

  XLSX.writeFile(workbook, `Ket_Qua_Kiem_Ke_${audit.code || "BaoCao"}.xlsx`);
};
