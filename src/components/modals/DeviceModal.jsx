import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Laptop,
  Tag,
  Maximize2,
  Minimize2,
  Sparkles,
  AlignLeft,
  Copy,
  Check,
  RotateCcw,
  Monitor,
  Server,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { CATEGORIES } from "../../data/assetMetadata";
import { getLocalDateInputValue } from "../../utils/formatters";
import { getNextCode } from "../../utils/formatters";
import { useFeedback } from "../../context/FeedbackContext";

// Các mẫu cấu hình thông dụng
const SPECS_TEMPLATES = {
  laptop_pc: `CPU: Intel Core i7 / AMD Ryzen 7 (Thế hệ mới)
RAM: 16GB / 32GB DDR5 Bus 5200MHz
Ổ cứng: SSD 512GB / 1TB M.2 PCIe NVMe
Màn hình: 14 inch / 15.6 inch FHD IPS Chống chói
Đồ họa: Intel Iris Xe Graphics / NVIDIA GeForce RTX
Hệ điều hành: Windows 11 Pro Bản quyền`,

  monitor: `Kích thước: 24 inch / 27 inch
Tấm nền: IPS cao cấp, Góc nhìn 178°/178°
Độ phân giải: Full HD (1920x1080) @ 75Hz - 100Hz
Độ sáng: 250 - 300 nits, 99% sRGB
Cổng kết nối: 1x HDMI, 1x DisplayPort, 1x Audio Out
Chân đế: Điều chỉnh độ nghiêng, xoay linh hoạt`,

  server: `CPU: 2x Intel Xeon Silver 4314 (16C/32T)
RAM: 64GB (2x32GB) DDR4-3200MHz ECC RDIMM
Lưu trữ: 4x 1.2TB SAS 10K 2.5in Hot-plug (RAID 5)
RAID Controller: PERC H750 with 8GB Cache
Nguồn: 2x 800W Titanium Redundant Hot-plug
Cạc mạng: Quad-Port 1GbE + Dual-Port 10GbE SFP+`,
};

// Hàm tự động ngắt dòng thông minh khi dán đoạn văn bản dài
const formatSpecsText = (rawText) => {
  if (!rawText) return "";
  return rawText
    // Thay thế các dấu phân cách trước các từ khóa linh kiện thành dấu xuống dòng
    .replace(
      /(?:,\s*|\s*;\s*|\s*\|\s*|\s+)(CPU|Bộ vi xử lý|Processor|RAM|Bộ nhớ|Memory|Ổ cứng|SSD|HDD|Ổ đĩa|Lưu trữ|Storage|VGA|Card đồ họa|GPU|Đồ họa|Màn hình|Display|Screen|Độ phân giải|Resolution|HĐH|Hệ điều hành|OS|Pin|Battery|Trọng lượng|Weight|Cổng kết nối|Ports|Bàn phím|Keyboard|Tấm nền|Panel|Nguồn|PSU|Khay giấy):/gi,
      "\n$1:"
    )
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
};

export const DeviceModal = ({
  isOpen,
  onClose,
  onSave,
  deviceToEdit,
  departments,
  users,
  devices = [],
}) => {
  const { toast, confirm } = useFeedback();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "laptop",
    brand: "",
    model: "",
    serial: "",
    specs: "",
    status: "available",
    userId: "",
    departmentId: "",
    purchaseDate: "",
    purchaseCost: "",
    warrantyUntil: "",
    location: "",
    notes: "",
  });

  // State quản lý cửa sổ phóng to cấu hình
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [tempSpecs, setTempSpecs] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Mở popup soạn thảo phóng to
  const handleOpenSpecsModal = () => {
    setTempSpecs(formData.specs || "");
    setIsSpecsModalOpen(true);
  };

  // Áp dụng cấu hình từ popup phóng to về form
  const handleApplySpecsModal = () => {
    setFormData((prev) => ({ ...prev, specs: tempSpecs }));
    setIsSpecsModalOpen(false);
  };

  // Tự động ngắt dòng thông minh
  const handleAutoFormatSpecs = (isInsideModal = false) => {
    if (isInsideModal) {
      setTempSpecs((prev) => formatSpecsText(prev));
    } else {
      setFormData((prev) => ({ ...prev, specs: formatSpecsText(prev.specs) }));
    }
  };

  // Chèn mẫu cấu hình
  const handleInsertTemplate = async (type, isInsideModal = false) => {
    const template = SPECS_TEMPLATES[type] || "";
    const currentText = isInsideModal ? tempSpecs : formData.specs;
    let shouldOverwrite = false;
    if (currentText.trim()) {
      shouldOverwrite = await confirm({
        title: "Ghi đè cấu hình",
        message: "Bạn có muốn ghi đè cấu hình hiện tại bằng mẫu này không? (Chọn Hủy để nối tiếp vào cuối)",
        confirmText: "Ghi đè",
        cancelText: "Nối tiếp",
        variant: "primary",
      });
    } else {
      shouldOverwrite = true;
    }

    if (isInsideModal) {
      setTempSpecs((prev) => (shouldOverwrite || !prev.trim() ? template : prev + "\n" + template));
    } else {
      setFormData((prev) => ({ ...prev, specs: shouldOverwrite || !prev.specs.trim() ? template : prev.specs + "\n" + template }));
    }
  };

  // Sao chép cấu hình
  const handleCopySpecs = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    if (deviceToEdit) {
      setFormData({
        ...deviceToEdit,
        userId: deviceToEdit.userId || "",
        departmentId: deviceToEdit.departmentId || "",
        purchaseCost: deviceToEdit.purchaseCost || "",
      });
    } else {
      // Mã tài sản tuần tự: TS-015, TS-016...
      const nextCode = getNextCode(
        devices.map((d) => d.code),
        "TS",
      );
      setFormData({
        code: nextCode,
        name: "",
        category: "laptop",
        brand: "",
        model: "",
        serial: "",
        specs: "",
        status: "available",
        userId: "",
        departmentId: "",
        purchaseDate: getLocalDateInputValue(),
        purchaseCost: "",
        warrantyUntil: "",
        location: "Kho IT Tầng 4",
        notes: "",
      });
    }
  }, [deviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.warning("Vui lòng nhập Mã tài sản và Tên thiết bị!");
      return;
    }
    const duplicated = devices.some(
      (d) =>
        d.id !== deviceToEdit?.id &&
        d.code.trim().toLowerCase() === formData.code.trim().toLowerCase(),
    );
    if (duplicated) {
      toast.warning(
        `Mã tài sản "${formData.code.trim()}" đã tồn tại. Hãy nhập mã khác.`,
      );
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
                {deviceToEdit ? "Chỉnh Sửa Thiết Bị" : "Thêm Thiết Bị Mới"}
              </h3>
              <p className="text-xs text-slate-500">
                Cập nhật hồ sơ tài sản và thông số kỹ thuật
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

        {/* Modal Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm"
        >
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
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="TS-001"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none font-mono"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Loại thiết bị
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="VD: MacBook Pro 14 M3, Dell Latitude 5440..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Brand */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hãng sản xuất
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                placeholder="Apple, Dell, HP..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Model / Dòng máy
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="Latitude 5440"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số Serial (S/N)
              </label>
              <input
                type="text"
                value={formData.serial}
                onChange={(e) =>
                  setFormData({ ...formData, serial: e.target.value })
                }
                placeholder="Số serial tem máy"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block font-semibold text-slate-700">
                Cấu hình chi tiết
              </label>

              <div className="flex items-center gap-1.5">
                {/* Nút tự động ngắt dòng */}
                {formData.specs?.length > 20 && (
                  <button
                    type="button"
                    onClick={() => handleAutoFormatSpecs(false)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition"
                    title="Tự động chia nhỏ thành từng dòng (CPU, RAM, Ổ cứng...)"
                  >
                    <AlignLeft className="w-3 h-3 text-slate-500" />
                    <span>Ngắt dòng đẹp</span>
                  </button>
                )}

                {/* Nút phóng to toàn màn hình */}
                <button
                  type="button"
                  onClick={handleOpenSpecsModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 hover:bg-blue-100 hover:border-blue-300 transition shadow-2xs"
                  title="Mở trình soạn thảo toàn cảnh để xem và nhập cả đoạn dài"
                >
                  <Maximize2 className="w-3 h-3 text-blue-600" />
                  <span>Phóng to xem cả đoạn</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={formData.specs}
                onChange={(e) =>
                  setFormData({ ...formData, specs: e.target.value })
                }
                placeholder="Nhập cấu hình hoặc bấm 'Phóng to xem cả đoạn' để soạn thảo dễ dàng.&#10;Ví dụ:&#10;CPU: Intel Core i7 240H&#10;RAM: 16GB DDR5&#10;Ổ cứng: SSD 512GB PCIe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none font-mono text-xs leading-relaxed transition resize-y min-h-[105px]"
              />

              {/* Thanh footer nhỏ bên dưới textarea */}
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  💡 Nhấn <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-700 font-sans text-[10px]">Enter</kbd> để xuống dòng từng linh kiện hoặc kéo góc phải để mở rộng
                </span>
                <span className="font-mono text-slate-400">
                  {formData.specs ? formData.specs.split('\n').filter(Boolean).length : 0} dòng • {formData.specs ? formData.specs.length : 0} ký tự
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              Trạng thái, người giữ và phòng ban được cập nhật theo phiếu bàn
              giao, trả thiết bị và bảo trì để giữ đúng lịch sử tài sản.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Purchase Cost */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Giá mua (VNĐ)
              </label>
              <input
                type="number"
                value={formData.purchaseCost}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseCost: e.target.value })
                }
                placeholder="25000000"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ngày mua
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Warranty Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hạn bảo hành
              </label>
              <input
                type="date"
                value={formData.warrantyUntil}
                onChange={(e) =>
                  setFormData({ ...formData, warrantyUntil: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vị trí lưu trữ / Làm việc
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="P.402 Bàn Kỹ thuật, Kho IT Tầng 4..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ghi chú phụ kiện kèm theo
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
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
              <span>{deviceToEdit ? "Lưu thay đổi" : "Tạo thiết bị"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal phóng to xem và soạn thảo cấu hình chi tiết */}
      {isSpecsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[90vh] max-h-[820px] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-white to-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-500/20">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>Soạn Thảo Cấu Hình Chi Tiết</span>
                    {formData.code && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                        {formData.code}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {formData.name ? formData.name : "Xem toàn cảnh, ngắt dòng thông minh và xem trước hiển thị"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSpecsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Đóng (Không lưu thay đổi trong popup)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="px-6 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Mẫu nhanh:
                </span>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("laptop_pc", true)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 font-medium transition flex items-center gap-1 shadow-2xs"
                >
                  <Laptop className="w-3 h-3" />
                  <span>PC / Laptop</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("monitor", true)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 font-medium transition flex items-center gap-1 shadow-2xs"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Màn hình</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("server", true)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 font-medium transition flex items-center gap-1 shadow-2xs"
                >
                  <Server className="w-3 h-3" />
                  <span>Máy chủ / Server</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAutoFormatSpecs(true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium transition flex items-center gap-1"
                  title="Tách các mục CPU, RAM, SSD... thành từng dòng riêng biệt"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tự động ngắt dòng</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopySpecs(tempSpecs)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition flex items-center gap-1"
                  title="Sao chép toàn bộ cấu hình"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Xóa cấu hình",
                      message: "Bạn có chắc chắn muốn xóa toàn bộ nội dung cấu hình này?",
                      confirmText: "Xóa cấu hình",
                      variant: "danger",
                    });
                    if (ok) {
                      setTempSpecs("");
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                  title="Xóa trắng"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Split Editor: Left Input & Right Live Preview */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
              {/* Cột trái: Soạn thảo */}
              <div className="flex flex-col h-full min-h-0 p-4">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-blue-600" />
                    Khung nhập văn bản cấu hình
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {tempSpecs ? tempSpecs.split("\n").filter(Boolean).length : 0} dòng • {tempSpecs.length} ký tự
                  </span>
                </div>
                <textarea
                  value={tempSpecs}
                  onChange={(e) => setTempSpecs(e.target.value)}
                  placeholder="Nhập hoặc dán thông số kỹ thuật thiết bị tại đây...&#10;&#10;Ví dụ:&#10;CPU: Intel Core i7 240H, 10C (6P + 4E) / 16T&#10;RAM: 16GB SODIMM DDR5-5200MHz&#10;Ổ cứng: SSD 512GB M.2 2280 PCIe 4.0x4&#10;Màn hình: 24 inch FHD (1920x1080) IPS 250nits&#10;Hệ điều hành: Windows 11 Pro 64-bit"
                  className="flex-1 w-full p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none font-mono text-xs sm:text-sm leading-relaxed text-slate-800 transition resize-none overflow-y-auto"
                />
              </div>

              {/* Cột phải: Xem trước hiển thị thực tế (Live Preview) */}
              <div className="flex flex-col h-full min-h-0 p-4 bg-slate-50/50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    Xem trước thực tế (Hồ sơ thiết bị)
                  </span>
                  <span className="text-[11px] text-slate-400">Trực quan khi lưu</span>
                </div>

                <div className="flex-1 overflow-y-auto rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/80 p-4 shadow-inner">
                  {tempSpecs.trim() ? (
                    <div className="space-y-2">
                      {tempSpecs.split("\n").map((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        const colonIdx = trimmed.indexOf(":");
                        const hasColon = colonIdx > 0 && colonIdx < 30;
                        const label = hasColon ? trimmed.slice(0, colonIdx) : "";
                        const value = hasColon ? trimmed.slice(colonIdx + 1).trim() : trimmed;

                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-2 rounded-xl bg-white/90 border border-slate-200/60 shadow-2xs hover:border-blue-200 transition"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                            <div className="min-w-0 flex-1 text-xs">
                              {hasColon ? (
                                <>
                                  <span className="font-bold text-slate-800 mr-1.5">{label}:</span>
                                  <span className="font-mono text-slate-700 leading-relaxed">{value}</span>
                                </>
                              ) : (
                                <span className="font-mono text-slate-700 leading-relaxed">{trimmed}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Laptop className="w-10 h-10 mb-2 text-slate-300 stroke-[1.5]" />
                      <p className="font-medium text-xs text-slate-600">Chưa có thông số cấu hình</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                        Hãy nhập ở khung bên trái hoặc chọn một trong các Mẫu nhanh ở trên.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 hidden sm:inline">
                💡 Cấu hình được chia thành từng dòng sẽ hiển thị rất rõ ràng trên hồ sơ tài sản.
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsSpecsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleApplySpecsModal}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Áp dụng cấu hình</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
