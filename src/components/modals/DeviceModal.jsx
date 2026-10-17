import React, { useState, useEffect } from 'react';
import { X, Save, Laptop, Tag } from 'lucide-react';
import { CATEGORIES, STATUS_MAP } from '../../data/mockData';

export const DeviceModal = ({
  isOpen,
  onClose,
  onSave,
  deviceToEdit,
  departments,
  users,
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'laptop',
    brand: '',
    model: '',
    serial: '',
    specs: '',
    status: 'available',
    userId: '',
    departmentId: '',
    purchaseDate: '',
    purchaseCost: '',
    warrantyUntil: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (deviceToEdit) {
      setFormData({
        ...deviceToEdit,
        userId: deviceToEdit.userId || '',
        departmentId: deviceToEdit.departmentId || '',
        purchaseCost: deviceToEdit.purchaseCost || '',
      });
    } else {
      // Auto generate code TS-xxx
      const randomCode = `TS-${String(Math.floor(Math.random() * 900) + 100)}`;
      setFormData({
        code: randomCode,
        name: '',
        category: 'laptop',
        brand: '',
        model: '',
        serial: '',
        specs: '',
        status: 'available',
        userId: '',
        departmentId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: '',
        warrantyUntil: '',
        location: 'Kho IT Tầng 4',
        notes: '',
      });
    }
  }, [deviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      alert('Vui lòng nhập Mã tài sản và Tên thiết bị!');
      return;
    }

    onSave({
      ...formData,
      purchaseCost: Number(formData.purchaseCost) || 0,
      userId: formData.userId || null,
      departmentId: formData.departmentId || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {deviceToEdit ? 'Chỉnh Sửa Thiết Bị' : 'Thêm Thiết Bị Mới'}
              </h3>
              <p className="text-xs text-slate-500">Cập nhật hồ sơ tài sản và thông số kỹ thuật</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Asset Code */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mã tài sản <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="TS-001"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none font-mono"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loại thiết bị</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên thiết bị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: MacBook Pro 14 M3, Dell Latitude 5440..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Brand */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hãng sản xuất</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Apple, Dell, HP..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Model / Dòng máy</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Latitude 5440"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Serial (S/N)</label>
              <input
                type="text"
                value={formData.serial}
                onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                placeholder="Số serial tem máy"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Specs */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cấu hình chi tiết</label>
            <textarea
              rows={2}
              value={formData.specs}
              onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
              placeholder="CPU Intel Core i7, RAM 16GB, SSD 512GB, Màn hình 14 FHD..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none font-medium"
              >
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* User */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gán người dùng</label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="">-- Chưa cấp phát (Lưu kho) --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phòng ban</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="">-- Chưa gán phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Purchase Cost */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá mua (VNĐ)</label>
              <input
                type="number"
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                placeholder="25000000"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày mua</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Warranty Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hạn bảo hành</label>
              <input
                type="date"
                value={formData.warrantyUntil}
                onChange={(e) => setFormData({ ...formData, warrantyUntil: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vị trí lưu trữ / Làm việc</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="P.402 Bàn Kỹ thuật, Kho IT Tầng 4..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ghi chú phụ kiện kèm theo</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Kèm adapter sạc 65W, bao da..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>{deviceToEdit ? 'Lưu thay đổi' : 'Tạo thiết bị'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
