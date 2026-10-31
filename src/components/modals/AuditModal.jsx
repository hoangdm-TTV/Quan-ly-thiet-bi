import React, { useState, useEffect } from "react";
import { X, Save, ClipboardCheck } from "lucide-react";
import { getLocalDateInputValue, getUniqueCode } from "../../utils/formatters";
import { useFeedback } from "../../context/FeedbackContext";

export const AuditModal = ({ isOpen, onClose, onSave, auditToEdit, audits = [] }) => {
  const { toast } = useFeedback();
  const [formData, setFormData] = useState({
    code: `KK-${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
    title: `Kiểm kê tài sản thiết bị IT Quý ${Math.floor(new Date().getMonth() / 3) + 1}/${new Date().getFullYear()}`,
    auditDate: getLocalDateInputValue(),
    auditor: "Tổ Kiểm kê Tài sản Công nghệ Thông tin",
    notes:
      "Kiểm kê định kỳ hiện trạng tài sản, rà soát thất thoát và lập kế hoạch bảo trì.",
  });

  useEffect(() => {
    if (!isOpen) return;
    if (auditToEdit) {
      setFormData({
        code: auditToEdit.code || "",
        title: auditToEdit.title || "",
        auditDate: auditToEdit.auditDate || getLocalDateInputValue(),
        auditor: auditToEdit.auditor || "",
        notes: auditToEdit.notes || "",
      });
      return;
    }
    const baseCode = `KK-${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`;
    setFormData((prev) => ({
      ...prev,
      code: getUniqueCode(baseCode, audits.map((a) => a.code)),
      auditDate: getLocalDateInputValue(),
    }));
  }, [auditToEdit, isOpen, audits]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning("Vui lòng nhập tên đợt kiểm kê!");
      return;
    }

    onSave({
      ...formData,
      status: "in_progress",
      records: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {auditToEdit ? "Chỉnh Sửa Đợt Kiểm Kê" : "Khởi Tạo Đợt Kiểm Kê Mới"}
              </h3>
              <p className="text-xs text-slate-500">
                Đối chiếu danh sách tài sản với thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 text-xs sm:text-sm"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mã đợt kiểm kê
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên đợt kiểm kê <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="VD: Kiểm kê tài sản IT Quý 4..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Ngày thực hiện
            </label>
            <input
              type="date"
              required
              value={formData.auditDate}
              onChange={(e) =>
                setFormData({ ...formData, auditDate: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tổ / Cán bộ kiểm kê
            </label>
            <input
              type="text"
              value={formData.auditor}
              onChange={(e) =>
                setFormData({ ...formData, auditor: e.target.value })
              }
              placeholder="Nguyễn Văn A (IT) & Trần Thị B (Kế toán)"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mục đích & Ghi chú
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>{auditToEdit ? "Lưu thay đổi" : "Bắt đầu kiểm kê"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
