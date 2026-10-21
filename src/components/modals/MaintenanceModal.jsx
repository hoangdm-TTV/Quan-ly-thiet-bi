import React, { useState, useEffect } from "react";
import { getLocalDateInputValue, getNextCode } from "../../utils/formatters";
import { STATUS_MAP } from "../../data/mockData";

export const MaintenanceModal = ({
  isOpen,
  onClose,
  onSave,
  preselectedDevice,
  devices,
  maintenance = [],
  handovers = [],
}) => {
  const [formData, setFormData] = useState({
    code: "",
    deviceId: "",
    issue: "",
    solution: "",
    cost: "",
    vendor: "Trung tâm Bảo hành Chính hãng",
    status: "scheduled", // 'scheduled' | 'in_progress'
    startDate: getLocalDateInputValue(),
    technician: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      const year = new Date().getFullYear();
      const selectableDevices = devices.filter(
        (device) =>
          ["available", "in_use", "borrowed", "broken"].includes(
            device.status,
          ) &&
          !maintenance.some(
            (item) =>
              item.deviceId === device.id &&
              ["scheduled", "in_progress"].includes(item.status),
          ),
      );
      const selectedDevice =
        selectableDevices.find(
          (device) => device.id === preselectedDevice?.id,
        ) || selectableDevices[0];
      const selectedHasActiveHandover = handovers.some(
        (item) =>
          item.deviceId === selectedDevice?.id && item.status === "active",
      );
      setFormData({
        code: getNextCode(
          maintenance.map((m) => m.code),
          "BT",
          { year },
        ),
        deviceId: selectedDevice?.id || "",
        issue: "",
        solution: "",
        cost: "0",
        vendor: "Trung tâm Bảo hành Chính hãng",
        status:
          selectedDevice?.status === "broken" && !selectedHasActiveHandover
            ? "in_progress"
            : "scheduled",
        startDate: getLocalDateInputValue(),
        technician: "Kỹ thuật viên IT",
        notes: "",
      });
    }
  }, [isOpen, preselectedDevice, devices, maintenance, handovers]);

  if (!isOpen) return null;

  const eligibleDevices = devices.filter(
    (device) =>
      ["available", "in_use", "borrowed", "broken"].includes(device.status) &&
      !maintenance.some(
        (item) =>
          item.deviceId === device.id &&
          ["scheduled", "in_progress"].includes(item.status),
      ),
  );

  const selectedDevice = devices.find(
    (device) => device.id === formData.deviceId,
  );
  const selectedHasActiveHandover = handovers.some(
    (item) => item.deviceId === formData.deviceId && item.status === "active",
  );
  const canStartRepairNow =
    selectedDevice?.status === "broken" && !selectedHasActiveHandover;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.deviceId || !formData.issue.trim()) {
      alert("Vui lòng chọn thiết bị và mô tả hiện trạng sự cố!");
      return;
    }
    if (formData.status === "in_progress" && !canStartRepairNow) {
      alert(
        "Chỉ được bắt đầu sửa chữa khi thiết bị đã được thu hồi và ghi nhận đang hỏng. Thiết bị đang dùng chỉ có thể lên lịch bảo trì.",
      );
      return;
    }

    const saved = await onSave({
      ...formData,
      cost: Number(formData.cost) || 0,
      completedDate: null,
    });
    if (saved) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-orange-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Lên Lịch Bảo Trì / Sửa Chữa
              </h3>
              <p className="text-xs text-slate-500">
                Thiết bị đang dùng chỉ được lên lịch; sửa chữa bắt đầu sau khi
                thu hồi máy hỏng
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
          className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mã phiếu bảo trì
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
                Ngày dự kiến / tiếp nhận
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Select Device */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Thiết bị bảo trì / sửa chữa{" "}
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.deviceId}
              onChange={(e) => {
                const device = devices.find(
                  (item) => item.id === e.target.value,
                );
                const hasActive = handovers.some(
                  (item) =>
                    item.deviceId === e.target.value &&
                    item.status === "active",
                );
                setFormData({
                  ...formData,
                  deviceId: e.target.value,
                  status:
                    device?.status === "broken" && !hasActive
                      ? "in_progress"
                      : "scheduled",
                });
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-orange-500 outline-none"
              required
            >
              <option value="">-- Chọn thiết bị --</option>
              {eligibleDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.code}] {d.name} {d.serial ? `(S/N: ${d.serial})` : ""} -
                  Hiện tại: {STATUS_MAP[d.status]?.label || d.status}
                </option>
              ))}
            </select>
          </div>

          {/* Issue */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {formData.status === "scheduled"
                ? "Nội dung bảo trì dự kiến"
                : "Mô tả hiện trạng sự cố"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={formData.issue}
              onChange={(e) =>
                setFormData({ ...formData, issue: e.target.value })
              }
              placeholder={
                formData.status === "scheduled"
                  ? "VD: Vệ sinh định kỳ, kiểm tra pin, cập nhật hệ điều hành..."
                  : "VD: Không lên nguồn, quạt kêu to, sọc màn hình, bàn phím liệt..."
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
            />
          </div>

          {/* Solution */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Phương án xử lý / Linh kiện thay thế
            </label>
            <textarea
              rows={2}
              value={formData.solution}
              onChange={(e) =>
                setFormData({ ...formData, solution: e.target.value })
              }
              placeholder="VD: Thay cáp màn hình, tra keo tản nhiệt, bảo hành đổi nguồn mới..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cost */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chi phí sửa chữa (VNĐ)
              </label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
              />
            </div>

            {/* Start repair only for a device that has been returned as broken. */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quy trình
              </label>
              {canStartRepairNow ? (
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none font-medium text-slate-800"
                >
                  <option value="in_progress">Bắt đầu sửa chữa ngay</option>
                  <option value="scheduled">Lên lịch sửa chữa</option>
                </select>
              ) : (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-800">
                  Chỉ tạo lịch. Muốn bắt đầu sửa chữa, hãy thu hồi thiết bị và
                  ghi nhận tình trạng hỏng.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vendor */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Đơn vị sửa chữa / Đối tác
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                placeholder="Trung tâm BH Hãng, Cty sửa chữa Á Châu..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
              />
            </div>

            {/* Technician */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kỹ thuật viên phụ trách
              </label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) =>
                  setFormData({ ...formData, technician: e.target.value })
                }
                placeholder="Tên kỹ thuật viên"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white outline-none"
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
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu phiếu bảo trì</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
