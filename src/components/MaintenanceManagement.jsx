import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Coins,
  AlertCircle,
  Building2,
  User,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const MaintenanceManagement = ({
  maintenance,
  devices,
  onOpenNewMaintenance,
  onCompleteMaintenance,
}) => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'scheduled' | 'in_progress' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const totalCost = maintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
  const activeCount = maintenance.filter((m) => m.status === 'in_progress').length;
  const scheduledCount = maintenance.filter((m) => m.status === 'scheduled').length;
  const completedCount = maintenance.filter((m) => m.status === 'completed').length;

  const filtered = maintenance.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = (m.code || '').toLowerCase().includes(q);
      const issueMatch = (m.issue || '').toLowerCase().includes(q);
      const solutionMatch = (m.solution || '').toLowerCase().includes(q);
      const vendorMatch = (m.vendor || '').toLowerCase().includes(q);
      const dev = devices.find((d) => d.id === m.deviceId);
      const devMatch = dev && (dev.name.toLowerCase().includes(q) || dev.code.toLowerCase().includes(q));

      if (!codeMatch && !issueMatch && !solutionMatch && !vendorMatch && !devMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quản Lý Bảo Trì & Sửa Chữa Thiết Bị</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
              {maintenance.length} lượt
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lịch sử khắc phục sự cố, quản lý chi phí, bảo hành đối tác và kế hoạch bảo trì định kỳ
          </p>
        </div>

        <button
          onClick={onOpenNewMaintenance}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lập phiếu bảo trì</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>TỔNG CHI PHÍ</span>
            <Coins className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 truncate" title={formatCurrency(totalCost)}>
            {formatCurrency(totalCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đã chi cho sửa chữa</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ĐANG XỬ LÝ</span>
            <Wrench className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Tại TTBH hoặc kỹ thuật</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ĐÃ LÊN LỊCH</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{scheduledCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Kế hoạch bảo dưỡng tới</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>HOÀN THÀNH</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đã kiểm tra hoạt động tốt</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm mã phiếu, nội dung hỏng, đơn vị sửa, thiết bị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="scheduled">Đã lên lịch</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="completed">Đã hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Maintenance List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
            Không tìm thấy phiếu bảo trì nào phù hợp.
          </div>
        ) : (
          filtered.map((item) => {
            const dev = devices.find((d) => d.id === item.deviceId);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
                      {item.code}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {dev ? `${dev.name} (${dev.code})` : 'Thiết bị'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Bắt đầu: {formatDate(item.startDate)} • Kỹ thuật viên: {item.technician || 'Nội bộ'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'in_progress'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {item.status === 'completed'
                        ? 'Đã hoàn thành'
                        : item.status === 'in_progress'
                        ? 'Đang xử lý'
                        : 'Lên lịch trước'}
                    </span>

                    {/* Cost */}
                    <span className="font-bold text-sm text-slate-900">
                      {formatCurrency(item.cost)}
                    </span>

                    {/* Complete button */}
                    {item.status !== 'completed' && (
                      <button
                        onClick={() => onCompleteMaintenance(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                      >
                        Nghiệm thu hoàn tất
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="font-semibold text-slate-700 block mb-1">Hiện trạng sự cố:</span>
                    <p className="text-slate-600">{item.issue}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="font-semibold text-slate-700 block mb-1">Phương án xử lý:</span>
                    <p className="text-slate-600">{item.solution || 'Đang chẩn đoán kỹ thuật...'}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Đơn vị thực hiện: <strong className="text-slate-700">{item.vendor || 'Nội bộ công ty'}</strong></span>
                  </div>
                  {item.completedDate && (
                    <div className="text-emerald-600 font-medium">
                      Ngày nghiệm thu: {formatDate(item.completedDate)}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-slate-500 italic max-w-lg truncate">
                      Ghi chú: {item.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
