import React, { useEffect, useState } from "react";
import { Building2, Save, X } from "lucide-react";
import { getNextCode } from "../../utils/formatters";

export const DepartmentModal = ({
  isOpen,
  onClose,
  onSave,
  departmentToEdit,
  departments = [],
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    manager: "",
    room: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    if (departmentToEdit) {
      setFormData({
        code: departmentToEdit.code || "",
        name: departmentToEdit.name || "",
        manager: departmentToEdit.manager || "",
        room: departmentToEdit.room || "",
      });
      return;
    }
    setFormData({
      code: getNextCode(departments.map((item) => item.code), "PB"),
      name: "",
      manager: "",
      room: "",
    });
  }, [departmentToEdit, departments, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();
    if (!name || !code) {
      window.alert("Vui lòng nhập mã và tên phòng ban.");
      return;
    }
    onSave({
      ...formData,
      code,
      name,
      manager: formData.manager.trim(),
      room: formData.room.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-rose-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-2 text-brand-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {departmentToEdit ? "Chỉnh sửa phòng ban" : "Thêm phòng ban"}
              </h3>
              <p className="text-xs text-slate-500">Thông tin đơn vị quản lý tài sản</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-rose-100 hover:text-brand-800" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block font-semibold text-slate-700">
              Mã phòng ban
              <input
                required
                value={formData.code}
                onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono outline-none focus:border-brand-500 focus:ring-2 focus:ring-rose-100"
                placeholder="PB-001"
              />
            </label>
            <label className="block font-semibold text-slate-700">
              Tên phòng ban
              <input
                required
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-rose-100"
                placeholder="Phòng Công nghệ thông tin"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block font-semibold text-slate-700">
              Trưởng bộ phận
              <input
                value={formData.manager}
                onChange={(event) => setFormData({ ...formData, manager: event.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-rose-100"
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label className="block font-semibold text-slate-700">
              Vị trí / Phòng
              <input
                value={formData.room}
                onChange={(event) => setFormData({ ...formData, room: event.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-rose-100"
                placeholder="Tầng 3 - Phòng 301"
              />
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50">Hủy</button>
            <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-5 py-2 font-semibold text-white shadow-sm hover:bg-brand-800">
              <Save className="h-4 w-4" />
              {departmentToEdit ? "Lưu thay đổi" : "Thêm phòng ban"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
