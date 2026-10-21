import React, { useState } from "react";
import {
  Repeat,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Calendar,
  UserCheck,
  Building,
  Laptop,
} from "lucide-react";
import { formatDate, getLocalDateInputValue } from "../utils/formatters";
import { exportHandoversToExcel } from "../services/storage";

export const HandoverManagement = ({
  handovers,
  devices,
  users,
  departments,
  onOpenNewHandover,
  onReturnDevice,
  onPrintVoucher,
}) => {
  const [filterType, setFilterType] = useState("all"); // 'all' | 'handover' | 'borrow'
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'returned'
  const [searchQuery, setSearchQuery] = useState("");

  const today = getLocalDateInputValue();

  const filteredHandovers = handovers.filter((h) => {
    if (filterType !== "all" && h.type !== filterType) return false;
    if (filterStatus !== "all" && h.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = (h.code || "").toLowerCase().includes(q);
      const notesMatch = (h.notes || "").toLowerCase().includes(q);

      const dev = devices.find((d) => d.id === h.deviceId);
      const devMatch =
        dev &&
        (dev.name.toLowerCase().includes(q) ||
          dev.code.toLowerCase().includes(q));

      const user = users.find((u) => u.id === h.userId);
      const userMatch = user && user.name.toLowerCase().includes(q);

      if (!codeMatch && !notesMatch && !devMatch && !userMatch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quản Lý Bàn Giao & Mượn Trả Thiết Bị</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
              {filteredHandovers.length} phiếu
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu bàn giao, theo dõi hạn trả, xuất biên bản in A4 và ghi
            nhận hoàn trả
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportHandoversToExcel(
                filteredHandovers,
                devices,
                users,
                departments,
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={onOpenNewHandover}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo phiếu mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm mã phiếu, người nhận, tên thiết bị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-700"
          >
            <option value="all">Tất cả hình thức</option>
            <option value="handover">Bàn giao dài hạn</option>
            <option value="borrow">Cho mượn ngắn hạn</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang sử dụng / Đang mượn</option>
            <option value="returned">Đã hoàn trả</option>
          </select>
        </div>
      </div>

      {/* Handovers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã Phiếu</th>
                <th className="py-3 px-4">Hình thức</th>
                <th className="py-3 px-4">Thiết bị</th>
                <th className="py-3 px-4">Người nhận & Bộ phận</th>
                <th className="py-3 px-4">Ngày giao / Hạn trả</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Tình trạng máy & Ghi chú</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHandovers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không có phiếu bàn giao hoặc mượn trả nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredHandovers.map((h) => {
                  const dev = devices.find((d) => d.id === h.deviceId);
                  const user = users.find((u) => u.id === h.userId);
                  const dept = departments.find((d) => d.id === h.departmentId);

                  const isOverdue =
                    h.status === "active" &&
                    h.type === "borrow" &&
                    h.expectedReturnDate &&
                    h.expectedReturnDate < today;

                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-indigo-50/30 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {h.code}
                      </td>

                      {/* Type badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            h.type === "handover"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {h.type === "handover" ? "Bàn giao" : "Cho mượn"}
                        </span>
                      </td>

                      {/* Device */}
                      <td className="py-3 px-4 max-w-xs">
                        {dev ? (
                          <div>
                            <p className="font-semibold text-slate-900 truncate">
                              {dev.name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {dev.code} • S/N: {dev.serial}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Thiết bị không tồn tại
                          </span>
                        )}
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">
                          {user ? user.name : "—"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {dept ? dept.name : "—"}
                        </p>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-700">
                          Giao: {formatDate(h.handoverDate)}
                        </div>
                        {h.type === "borrow" && (
                          <div
                            className={`text-[11px] font-medium flex items-center gap-1 ${
                              isOverdue
                                ? "text-rose-600 font-bold"
                                : "text-slate-500"
                            }`}
                          >
                            Hạn trả: {formatDate(h.expectedReturnDate)}
                            {isOverdue && (
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {h.status === "returned" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            <CheckCircle className="w-3 h-3 text-slate-500" />
                            Đã trả ({formatDate(h.actualReturnDate)})
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3 text-rose-500" />
                            Quá hạn trả
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Đang sử dụng
                          </span>
                        )}
                      </td>

                      {/* Condition & Notes */}
                      <td className="py-3 px-4 max-w-xs">
                        <p
                          className="text-slate-700 truncate"
                          title={h.condition}
                        >
                          {h.condition || "Bình thường"}
                        </p>
                        <p
                          className="text-[11px] text-slate-400 truncate"
                          title={h.notes}
                        >
                          {h.notes}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print voucher button */}
                          <button
                            onClick={() => onPrintVoucher(h)}
                            title="In biên bản bàn giao (A4)"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Return button if active */}
                          {h.status === "active" && (
                            <button
                              onClick={() => onReturnDevice(h)}
                              title="Thu hồi / Hoàn trả thiết bị"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Thu hồi</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
