import React, { useState, useEffect } from "react";
import { X, Save, User, Upload, Image as ImageIcon } from "lucide-react";

export const UserModal = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  departments,
  users,
}) => {
  const [imageError, setImageError] = useState("");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    position: "",
    avatar: "",
  });

  useEffect(() => {
    setImageError("");
    if (userToEdit) {
      setFormData(userToEdit);
    } else {
      const maxCode = (users || []).reduce((max, user) => {
        const match = /^NV(\d+)$/i.exec(user.code || "");
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      setFormData({
        code: `NV${String(maxCode + 1).padStart(3, "0")}`,
        name: "",
        email: "",
        phone: "",
        departmentId: departments[0]?.id || "",
        position: "Nhân viên",
        avatar: "",
      });
    }
  }, [userToEdit, isOpen, departments, users]);

  if (!isOpen) return null;

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Vui lòng chọn một tệp hình ảnh.");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError("Ảnh gốc cần nhỏ hơn 10 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 320;
        const scale = Math.min(
          1,
          maxSide / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          setImageError("Không thể xử lý ảnh trên trình duyệt này.");
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setFormData((current) => ({
          ...current,
          avatar: canvas.toDataURL("image/jpeg", 0.75),
        }));
        setImageError("");
      };
      image.onerror = () =>
        setImageError("Không đọc được nội dung ảnh đã chọn.");
      image.src = String(reader.result);
    };
    reader.onerror = () => setImageError("Không thể đọc tệp ảnh.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert("Vui lòng nhập Tên nhân viên và Mã nhân viên!");
      return;
    }

    onSave({
      ...formData,
      avatar:
        formData.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {userToEdit ? "Chỉnh Sửa Nhân Viên" : "Thêm Nhân Viên Mới"}
              </h3>
              <p className="text-xs text-slate-500">
                Thông tin nhân sự tiếp nhận và sử dụng thiết bị
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 text-xs sm:text-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mã nhân viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                readOnly
                title="Mã nhân viên được hệ thống tự tạo theo số tiếp theo"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email công việc
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="ten.nv@company.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0912345678"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phòng ban
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chức vụ
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="Lập trình viên, Kế toán..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Ảnh đại diện
            </label>
            <div className="flex items-center gap-4">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Xem trước ảnh đại diện"
                  className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  <span>Chọn ảnh từ thiết bị</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-500">
                  Có thể chọn ảnh trên máy tính hoặc điện thoại; ảnh sẽ được thu
                  nhỏ trước khi lưu.
                </p>
              </div>
            </div>
            {imageError && (
              <p role="alert" className="mt-2 text-xs text-rose-600">
                {imageError}
              </p>
            )}
            {formData.avatar && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                onClick={() =>
                  setFormData((current) => ({ ...current, avatar: "" }))
                }
              >
                Xóa ảnh đã chọn
              </button>
            )}
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>{userToEdit ? "Lưu thay đổi" : "Thêm nhân sự"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
