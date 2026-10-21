import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CATEGORIES, STATUS_MAP } from '../../data/mockData';

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
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'handovers' | 'maintenance' | 'sticker'

  if (!isOpen || !device) return null;

  const user = users.find((u) => u.id === device.userId);
  const dept = departments.find((d) => d.id === device.departmentId);
  const statusMeta = STATUS_MAP[device.status] || STATUS_MAP.available;
  const categoryInfo = CATEGORIES.find((c) => c.id === device.category);
  const hasOpenMaintenance = maintenance.some((item) => item.deviceId === device.id && ['scheduled', 'in_progress'].includes(item.status));

  // Device-specific histories
  const deviceHandovers = handovers.filter((h) => h.deviceId === device.id);
  const deviceMaintenance = maintenance.filter((m) => m.deviceId === device.id);

  const handlePrintSticker = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-blue-700 bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl">
              {device.code}
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base line-clamp-1">{device.name}</h3>
              <p className="text-xs text-slate-500">
                {device.brand} {device.model ? `• ${device.model}` : ''} • Serial: {device.serial || '—'}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Hồ sơ & Cấu hình
          </button>
          <button
            onClick={() => setActiveTab('handovers')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'handovers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Lịch sử Bàn giao</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
              {deviceHandovers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'maintenance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Lịch sử Bảo trì</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
              {deviceMaintenance.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sticker')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'sticker'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Tem Nhãn Tài Sản</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm">
          {/* TAB: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              {/* Status and Assignment Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-xs block mb-1">Trạng thái thiết bị</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                    {statusMeta.label}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-xs block mb-1">Người đang sử dụng</span>
                  <div className="font-semibold text-slate-800">
                    {user ? (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{user.name} ({user.code})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Chưa cấp phát (Kho IT)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-xs block mb-1">Phòng ban quản lý</span>
                  <div className="font-semibold text-slate-800">
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  Cấu hình phần cứng & Thông số
                </h4>
                <p className="text-slate-700 leading-relaxed font-mono text-xs">
                  {device.specs || 'Chưa cập nhật thông tin cấu hình chi tiết.'}
                </p>
              </div>

              {/* Grid Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-xs block">Nguyên giá đầu tư</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {formatCurrency(device.purchaseCost)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Ngày mua</span>
                  <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                    {formatDate(device.purchaseDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Hạn bảo hành</span>
                  <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                    {formatDate(device.warrantyUntil)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Vị trí hiện tại</span>
                  <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                    {device.location || 'Kho IT'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {device.notes && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
                  <strong>Ghi chú tài sản:</strong> {device.notes}
                </div>
              )}
            </div>
          )}

          {/* TAB: HANDOVERS */}
          {activeTab === 'handovers' && (
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
                            {h.type === 'handover' ? 'Bàn giao chính thức' : 'Cho mượn'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            h.status === 'returned'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {h.status === 'returned' ? 'Đã hoàn trả' : 'Đang sử dụng'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Người nhận: <strong>{recipient ? recipient.name : '—'}</strong> • Ngày giao:{' '}
                        {formatDate(h.handoverDate)}
                      </div>
                      {h.notes && <div className="text-[11px] text-slate-400 italic">Ghi chú: {h.notes}</div>}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: MAINTENANCE */}
          {activeTab === 'maintenance' && (
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
                        <span className="text-xs text-slate-500">Bắt đầu: {formatDate(m.startDate)}</span>
                      </div>
                      <span className="font-bold text-xs text-slate-900">{formatCurrency(m.cost)}</span>
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
          {activeTab === 'sticker' && (
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

                <div className="text-xs font-semibold text-slate-800 line-clamp-1">{device.name}</div>
                <div className="font-mono text-[11px] text-slate-500">S/N: {device.serial || 'N/A'}</div>
                <div className="text-[10px] text-slate-400 mt-1">IT ASSET MASTER • DO NOT REMOVE</div>
              </div>

              <p className="text-xs text-slate-500 text-center max-w-sm">
                Tem tài sản có thể in bằng máy in tem nhiệt hoặc in decal giấy để dán trực tiếp lên thiết bị IT.
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
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => {
              onClose();
              onEdit(device);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Sửa thông tin</span>
          </button>

          <div className="flex items-center gap-2">
            {device.status === 'available'
              && !maintenance.some((item) => item.deviceId === device.id && item.status === 'in_progress') && (
              <button
                onClick={() => {
                  onClose();
                  onHandover(device);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Bàn giao máy</span>
              </button>
            )}

            {['available', 'in_use', 'borrowed', 'broken'].includes(device.status) && !hasOpenMaintenance && (
              <button
                onClick={() => {
                  onClose();
                  onMaintain(device);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-xs transition"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{device.status === 'broken' ? 'Lập phiếu sửa chữa' : 'Lên lịch bảo trì'}</span>
              </button>
            )}

            {['available', 'broken'].includes(device.status) && !hasOpenMaintenance
              && !deviceHandovers.some((handover) => handover.status === 'active') && (
              <button
                onClick={() => onLiquidate(device)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
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
