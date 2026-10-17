import * as XLSX from 'xlsx';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_USERS,
  INITIAL_DEVICES,
  INITIAL_HANDOVERS,
  INITIAL_MAINTENANCE,
  INITIAL_AUDITS,
} from '../data/mockData';

const STORAGE_KEY = 'IT_ASSET_MASTER_V1';
const API_URL = '/api';

// Fetch from backend server with fallback to LocalStorage
export const fetchInitialData = async () => {
  try {
    const res = await fetch(`${API_URL}/data`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.devices && data.users) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return { data, isBackend: true };
      }
    }
  } catch (err) {
    console.warn('[Storage] Backend chua bat, chuyen sang LocalStorage:', err);
  }

  // Fallback to LocalStorage
  return { data: getLocalStoredData(), isBackend: false };
};

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
    console.error('Failed to load storage, fallback to initial data:', e);
  }

  const defaultData = {
    devices: INITIAL_DEVICES,
    users: INITIAL_USERS,
    departments: INITIAL_DEPARTMENTS,
    handovers: INITIAL_HANDOVERS,
    maintenance: INITIAL_MAINTENANCE,
    audits: INITIAL_AUDITS,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

// Save data to both Backend and LocalStorage
export const saveStoredData = async (data) => {
  const toSave = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to LocalStorage immediately
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Loi luu LocalStorage:', e);
  }

  // 2. Sync to Backend Physical File
  try {
    const res = await fetch(`${API_URL}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave),
    });
    if (res.ok) {
      return { success: true, isBackend: true };
    }
  } catch (e) {
    // Backend offline, LocalStorage already cached
  }

  return { success: true, isBackend: false };
};

export const resetToSampleData = async () => {
  const defaultData = {
    devices: INITIAL_DEVICES,
    users: INITIAL_USERS,
    departments: INITIAL_DEPARTMENTS,
    handovers: INITIAL_HANDOVERS,
    maintenance: INITIAL_MAINTENANCE,
    audits: INITIAL_AUDITS,
    updatedAt: new Date().toISOString(),
  };

  try {
    await fetch(`${API_URL}/reset`, { method: 'POST' });
  } catch (e) {
    // fallback
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

export const backupToJsonFile = () => {
  const data = getLocalStoredData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
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
          throw new Error('Dữ liệu JSON không hợp lệ (thiếu danh sách thiết bị/nhân viên/phòng ban).');
        }
        await saveStoredData(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc tập tin.'));
    reader.readAsText(file);
  });
};

export const exportDevicesToExcel = (devices, users, departments) => {
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const rows = devices.map((dev, idx) => ({
    'STT': idx + 1,
    'Mã tài sản': dev.code,
    'Tên thiết bị': dev.name,
    'Loại': dev.category,
    'Hãng sản xuất': dev.brand,
    'Model': dev.model,
    'Số Serial': dev.serial,
    'Cấu hình chi tiết': dev.specs,
    'Trạng thái': dev.status,
    'Người sử dụng': dev.userId ? userMap[dev.userId] || 'Chưa rõ' : 'Chưa cấp phát',
    'Phòng ban': dev.departmentId ? deptMap[dev.departmentId] || 'Chưa rõ' : 'Chưa gán',
    'Vị trí lưu trữ': dev.location || '',
    'Giá mua (VNĐ)': dev.purchaseCost ? Number(dev.purchaseCost).toLocaleString('vi-VN') : 0,
    'Ngày mua': dev.purchaseDate || '',
    'Hạn bảo hành': dev.warrantyUntil || '',
    'Ghi chú': dev.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách thiết bị');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Danh_Sach_Thiet_Bi_${dateStr}.xlsx`);
};

export const exportHandoversToExcel = (handovers, devices, users, departments) => {
  const devMap = Object.fromEntries(devices.map((d) => [d.id, d]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const rows = handovers.map((h, idx) => {
    const dev = devMap[h.deviceId] || {};
    return {
      'STT': idx + 1,
      'Mã phiếu': h.code,
      'Hình thức': h.type === 'handover' ? 'Bàn giao' : 'Cho mượn',
      'Mã thiết bị': dev.code || '',
      'Tên thiết bị': dev.name || '',
      'Người nhận': userMap[h.userId] || '',
      'Phòng ban': deptMap[h.departmentId] || '',
      'Ngày bàn giao/mượn': h.handoverDate || '',
      'Hạn trả dự kiến': h.expectedReturnDate || 'Vô thời hạn',
      'Ngày trả thực tế': h.actualReturnDate || (h.status === 'returned' ? 'Đã trả' : 'Chưa trả'),
      'Trạng thái': h.status === 'returned' ? 'Đã hoàn trả' : 'Đang sử dụng/mượn',
      'Người bàn giao': h.giverName || '',
      'Tình trạng thiết bị': h.condition || '',
      'Ghi chú': h.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BanGiao_MuonTra');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Lich_Su_Ban_Giao_Muon_Tra_${dateStr}.xlsx`);
};

export const exportAuditsToExcel = (audit, devices) => {
  const devMap = Object.fromEntries(devices.map((d) => [d.id, d]));
  const rows = (audit.records || []).map((rec, idx) => {
    const dev = devMap[rec.deviceId] || {};
    return {
      'STT': idx + 1,
      'Mã tài sản': dev.code || '',
      'Tên thiết bị': dev.name || '',
      'Serial': dev.serial || '',
      'Vị trí hệ thống': dev.location || '',
      'Trạng thái kiểm kê': rec.status === 'matched' ? 'Khớp tài sản' : 'Có chênh lệch / Lỗi',
      'Ghi chú kiểm kê': rec.note || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KetQuaKiemKe');

  XLSX.writeFile(workbook, `Ket_Qua_Kiem_Ke_${audit.code || 'BaoCao'}.xlsx`);
};
