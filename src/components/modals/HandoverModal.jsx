import React, { useState, useEffect } from 'react';
import { X, Save, Send, Calendar, User, Laptop } from 'lucide-react';

export const HandoverModal = ({
  isOpen,
  onClose,
  onSave,
  preselectedDevice,
  devices,
  users,
  departments,
}) => {
  const [formData, setFormData] = useState({
    code: '',
    type: 'handover', // 'handover' | 'borrow'
    deviceId: '',
    userId: '',
    departmentId: '',
    handoverDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    giverName: 'Nguyễn Văn Hùng (Bộ phận IT)',
    condition: 'Thiết bị hoạt động tốt 100%, đầy đủ phụ kiện sạc zin đi kèm.',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const isBorrow = formData.type === 'borrow';
      const prefix = isBorrow ? 'PM' : 'BG';
      const year = new Date().getFullYear();
      const randomNum = String(Math.floor(Math.random() * 900) + 100);

      setFormData((prev) => ({
        ...prev,
        code: `${prefix}-${year}-${randomNum}`,
        deviceId: preselectedDevice?.status === 'available'
          ? preselectedDevice.id
          : devices.find((device) => device.status === 'available')?.id || '',
        userId: prev.userId || (users[0]?.id || ''),
        handoverDate: new Date().toISOString().split('T')[0],
      }));
    }
  }, [isOpen, preselectedDevice]);

  // When user changes, auto select department
  const handleUserChange = (selectedUserId) => {
    const selectedUser = users.find((u) => u.id === selectedUserId);
    setFormData((prev) => ({
      ...prev,
      userId: selectedUserId,
      departmentId: selectedUser?.departmentId || '',
    }));
  };

  // Switch type and code
  const handleTypeChange = (newType) => {
    const prefix = newType === 'borrow' ? 'PM' : 'BG';
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(Math.random() * 900) + 100);
    setFormData((prev) => ({
      ...prev,
      type: newType,
      code: `${prefix}-${year}-${randomNum}`,
      expectedReturnDate: newType === 'borrow' ? prev.expectedReturnDate : '',
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.deviceId || !formData.userId) {
      alert('Vui lòng chọn thiết bị và nhân viên tiếp nhận!');
      return;
    }

    const selectedDevice = devices.find((device) => device.id === formData.deviceId);
    if (!selectedDevice || selectedDevice.status !== 'available') {
      alert('Thiết bị này không còn sẵn sàng cấp phát. Hãy chọn thiết bị khác.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await onSave({
        ...formData,
        departmentId: formData.departmentId || users.find((user) => user.id === formData.userId)?.departmentId || null,
        status: 'active',
        actualReturnDate: null,
      });
      if (saved) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Handover creation is limited to devices ready for assignment.
  const availableDevices = devices.filter((d) => d.status === 'available');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Tạo Phiếu Bàn Giao / Mượn Thiết Bị</h3>
              <p className="text-xs text-slate-500">Cấp phát tài sản cho nhân viên và ghi nhận thời hạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          {/* Handover Type selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('handover')}
              className={`py-2 px-3 rounded-lg font-semibold text-xs transition ${
                formData.type === 'handover'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bàn giao chính thức (Làm việc lâu dài)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('borrow')}
              className={`py-2 px-3 rounded-lg font-semibold text-xs transition ${
                formData.type === 'borrow'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cho mượn ngắn hạn (Sự kiện / Công tác)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ticket Code */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã phiếu</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono focus:bg-white outline-none"
              />
            </div>

            {/* Handover Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày giao máy</label>
              <input
                type="date"
                required
                value={formData.handoverDate}
                onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Select Device */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Thiết bị bàn giao <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              required
            >
              <option value="">-- Chọn thiết bị cần bàn giao --</option>
              {availableDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.code}] {d.name} {d.serial ? `(S/N: ${d.serial})` : ''} - Trạng thái: {d.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Select User */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nhân viên tiếp nhận <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.userId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
                required
              >
                <option value="">-- Chọn nhân viên --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} - {u.position} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Department */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phòng ban sử dụng</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="">-- Chưa gán --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expected Return Date (If Borrow) */}
          {formData.type === 'borrow' && (
            <div>
              <label className="block font-semibold text-amber-800 mb-1">
                Hạn trả dự kiến <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-amber-50/50 border border-amber-200 focus:bg-white outline-none"
              />
            </div>
          )}

          {/* Condition */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tình trạng thiết bị khi bàn giao</label>
            <input
              type="text"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              placeholder="Mới 100%, máy đẹp, nguyên vẹn tem bảo hành..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
            />
          </div>

          {/* Giver Name & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người bàn giao (IT)</label>
              <input
                type="text"
                value={formData.giverName}
                onChange={(e) => setFormData({ ...formData, giverName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mục đích / Ghi chú</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Cấp máy làm việc, mượn đi công tác..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving || availableDevices.length === 0}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu…' : availableDevices.length === 0 ? 'Không có thiết bị sẵn sàng' : 'Xác nhận & Lưu phiếu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
