import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  QrCode,
  Tag,
  Laptop,
  Calendar,
  Building,
  User,
  Shield,
  Coins,
  MapPin,
  Clock,
  Printer,
  Wrench,
  Send,
  Edit2,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { CATEGORIES, STATUS_MAP } from "../../data/assetMetadata";

export const DeviceDetailModal = ({
  isOpen,
  onClose,
  device,
  users,
  departments,
  handovers,
  maintenance,
  onEdit,
  onHandover,
  onMaintain,
  onLiquidate,
}) => {
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'handovers' | 'maintenance' | 'sticker'

  useEffect(() => {
    if (isOpen && device?.id) setActiveTab("info");
  }, [device?.id, isOpen]);

  if (!isOpen || !device) return null;

  const user = users.find((u) => u.id === device.userId);
  const dept = departments.find((d) => d.id === device.departmentId);
  const statusMeta = STATUS_MAP[device.status] || STATUS_MAP.available;
  const categoryInfo = CATEGORIES.find((c) => c.id === device.category);
  const hasOpenMaintenance = maintenance.some(
    (item) =>
      item.deviceId === device.id &&
      ["scheduled", "in_progress"].includes(item.status),
  );

  // Device-specific histories
  const deviceHandovers = handovers.filter((h) => h.deviceId === device.id);
  const deviceMaintenance = maintenance.filter((m) => m.deviceId === device.id);

  const handlePrintSticker = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 sm:px-7 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-br from-slate-50 via-white to-blue-50/60">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
              <Laptop className="mb-0.5 h-4 w-4" />
              <span className="font-mono text-[11px] font-bold leading-none">
                {device.code}
              </span>
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {categoryInfo?.name || "Thiết bị"}
                </span>
                <span className="text-[11px] text-slate-400">
                  Mã tài sản: {device.code}
                </span>
              </div>
              <h3 className="max-w-2xl text-base font-bold leading-snug text-slate-900 sm:text-lg">
                {device.name}
              </h3>
              <p className="mt-1 truncate text-xs text-slate-500">
                {device.brand || "Chưa rõ hãng"}{" "}
                {device.model ? `• ${device.model}` : ""}{" "}
                <span className="text-slate-300">•</span> Serial:{" "}
                {device.serial || "Chưa cập nhật"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng thông tin thiết bị"
            className="ml-3 shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 hover:shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 bg-white px-4 text-xs font-semibold sm:px-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`whitespace-nowrap border-b-2 px-2 py-3 transition ${
              activeTab === "info"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Hồ sơ & Cấu hình
          </button>
          <button
            onClick={() => setActiveTab("handovers")}
            className={`flex whitespace-nowrap items-center gap-1.5 border-b-2 px-2 py-3 transition ${
              activeTab === "handovers"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Lịch sử Bàn giao</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
              {deviceHandovers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`flex whitespace-nowrap items-center gap-1.5 border-b-2 px-2 py-3 transition ${
              activeTab === "maintenance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Lịch sử Bảo trì</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
              {deviceMaintenance.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("sticker")}
            className={`flex whitespace-nowrap items-center gap-1.5 border-b-2 px-2 py-3 transition ${
              activeTab === "sticker"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Tem Nhãn Tài Sản</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4 text-xs sm:p-6 sm:text-sm">
          {/* TAB: INFO */}
          {activeTab === "info" && (
            <div className="space-y-4 sm:space-y-5">
              {/* Status and Assignment Card */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Trạng thái thiết bị
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.color}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}
                    ></span>
                    {statusMeta.label}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Người đang sử dụng
                  </span>
                  <div className="min-h-6 font-semibold text-slate-800">
                    {user ? (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {user.name} ({user.code})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        Chưa cấp phát (Kho IT)
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phòng ban quản lý
                  </span>
                  <div className="min-h-6 font-semibold text-slate-800">
                    {dept ? (
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{dept.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Chưa gán</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="space-y-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4 shadow-sm sm:p-5">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  Cấu hình phần cứng & Thông số
                </h4>
                <p className="break-words whitespace-pre-wrap rounded-xl border border-white/80 bg-white/70 p-3 font-mono text-[11px] leading-6 text-slate-700 sm:text-xs">
                  {device.specs || "Chưa cập nhật thông tin cấu hình chi tiết."}
                </p>
              </div>

              {/* Grid Attributes */}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-4">
                <div className="bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nguyên giá đầu tư
                  </span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {formatCurrency(device.purchaseCost)}
                  </span>
                </div>
                <div className="bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ngày mua
                  </span>
                  <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                    {formatDate(device.purchaseDate)}
                  </span>
                </div>
                <div className="bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hạn bảo hành
                  </span>
                  <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                    {formatDate(device.warrantyUntil)}
                  </span>
                </div>
                <div className="bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Vị trí hiện tại
                  </span>
                  <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                    {device.location || "Kho IT"}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {device.notes && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-5 text-amber-900">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Ghi chú tài sản
                  </div>
                  <div>{device.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* TAB: HANDOVERS */}
          {activeTab === "handovers" && (
            <div className="space-y-3">
              {deviceHandovers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Chưa có lịch sử bàn giao nào được ghi nhận cho thiết bị này.
                </div>
              ) : (
                deviceHandovers.map((h) => {
                  const recipient = users.find((u) => u.id === h.userId);
                  return (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {h.code}
                          </span>
                          <span className="font-semibold text-slate-800 text-xs">
                            {h.type === "handover"
                              ? "Bàn giao chính thức"
                              : "Cho mượn"}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            h.status === "returned"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {h.status === "returned"
                            ? "Đã hoàn trả"
                            : "Đang sử dụng"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Người nhận:{" "}
                        <strong>{recipient ? recipient.name : "—"}</strong> •
                        Ngày giao: {formatDate(h.handoverDate)}
                      </div>
                      {h.notes && (
                        <div className="text-[11px] text-slate-400 italic">
                          Ghi chú: {h.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: MAINTENANCE */}
          {activeTab === "maintenance" && (
            <div className="space-y-3">
              {deviceMaintenance.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Chưa có lịch sử bảo trì hoặc sửa chữa nào cho thiết bị này.
                </div>
              ) : (
                deviceMaintenance.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                          {m.code}
                        </span>
                        <span className="text-xs text-slate-500">
                          Bắt đầu: {formatDate(m.startDate)}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-slate-900">
                        {formatCurrency(m.cost)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      <strong>Sự cố:</strong> {m.issue}
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Xử lý:</strong> {m.solution}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: STICKER / QR */}
          {activeTab === "sticker" && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              {/* Asset Tag Sticker Preview Box */}
              <div className="w-80 p-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center shadow-xs flex flex-col items-center">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  TÀI SẢN DOANH NGHIỆP
                </div>
                <div className="mb-2 rounded-lg border border-slate-200 bg-white p-2">
                  <QRCodeSVG
                    value={device.code}
                    size={144}
                    level="M"
                    includeMargin
                    title={`Mã QR tài sản ${device.code}`}
                  />
                  <div className="mt-1 font-mono text-xs font-bold tracking-widest text-slate-900">
                    {device.code}
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {device.name}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  S/N: {device.serial || "N/A"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  IT ASSET MASTER • DO NOT REMOVE
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center max-w-sm">
                Tem tài sản có thể in bằng máy in tem nhiệt hoặc in decal giấy
                để dán trực tiếp lên thiết bị IT.
              </p>

              <button
                onClick={handlePrintSticker}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                <Printer className="w-4 h-4" />
                <span>In Tem Tài Sản</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            onClick={() => {
              onClose();
              onEdit(device);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Sửa thông tin</span>
          </button>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {device.status === "available" &&
              !maintenance.some(
                (item) =>
                  item.deviceId === device.id && item.status === "in_progress",
              ) && (
                <button
                  onClick={() => {
                    onClose();
                    onHandover(device);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:flex-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Bàn giao máy</span>
                </button>
              )}

            {["available", "in_use", "borrowed", "broken"].includes(
              device.status,
            ) &&
              !hasOpenMaintenance && (
                <button
                  onClick={() => {
                    onClose();
                    onMaintain(device);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 sm:flex-none"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>
                    {device.status === "broken"
                      ? "Lập phiếu sửa chữa"
                      : "Lên lịch bảo trì"}
                  </span>
                </button>
              )}

            {["available", "broken"].includes(device.status) &&
              !hasOpenMaintenance &&
              !deviceHandovers.some(
                (handover) => handover.status === "active",
              ) && (
                <button
                  onClick={() => onLiquidate(device)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 sm:flex-none"
                >
                  Ghi nhận thanh lý
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
