import React, { useState, useEffect } from 'react';
import { X, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const ReturnModal = ({
  isOpen,
  onClose,
  handover,
  device,
  user,
  onConfirmReturn,
}) => {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState('Máy nguyên vẹn, hoạt động bình thường, đầy đủ phụ kiện sạc.');
  const [nextDeviceStatus, setNextDeviceStatus] = useState('available'); // 'available' | 'maintenance' | 'broken'
  const [returnNotes, setReturnNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && handover) {
      setReturnDate(new Date().toISOString().split('T')[0]);
      setCondition('Máy nguyên vẹn, hoạt động bình thường, đầy đủ phụ kiện sạc.');
      setNextDeviceStatus('available');
      setReturnNotes('');
    }
  }, [isOpen, handover?.id]);

  if (!isOpen || !handover) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (handover.status !== 'active' || !device) {
      alert('Phiếu này không còn hiệu lực hoặc không tìm thấy thiết bị. Hãy tải lại dữ liệu.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await onConfirmReturn({
        handoverId: handover.id,
        deviceId: handover.deviceId,
        returnDate,
        condition,
        nextDeviceStatus,
        returnNotes,
      });
      if (saved) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Thu Hồi / Nhận Trả Thiết Bị</h3>
              <p className="text-xs text-slate-500">Xác nhận thu hồi máy về kho IT</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Information banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <p>
              Mã phiếu: <strong className="font-mono text-indigo-700">{handover.code}</strong> ({handover.type === 'handover' ? 'Bàn giao' : 'Cho mượn'})
            </p>
            <p>
              Thiết bị: <strong className="text-slate-900">{device ? `${device.code} - ${device.name}` : 'N/A'}</strong>
            </p>
            <p>
              Người hoàn trả: <strong>{user ? `${user.name} (${user.code})` : 'N/A'}</strong>
            </p>
            <p className="text-slate-500">Ngày giao: {formatDate(handover.handoverDate)}</p>
          </div>

          {/* Return Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ngày hoàn trả thực tế</label>
            <input
              type="date"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
            />
          </div>

          {/* Condition on return */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tình trạng kiểm tra khi nhận lại máy</label>
            <input
              type="text"
              required
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="VD: Máy hoạt động bình thường, không trầy xước..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
            />
          </div>

          {/* Next status for device */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chuyển trạng thái thiết bị sang</label>
            <select
              value={nextDeviceStatus}
              onChange={(e) => setNextDeviceStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none font-semibold text-slate-800"
            >
              <option value="available">🟢 Sẵn sàng cấp phát (Nhập kho IT dùng tiếp)</option>
              <option value="maintenance">🟠 Cần bảo dưỡng / Vệ sinh / Sửa chữa</option>
              <option value="broken">🔴 Hỏng hóc / Chờ thanh lý</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
            <textarea
              rows={2}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Ghi chú thêm nếu có..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu…' : 'Xác nhận hoàn trả'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
