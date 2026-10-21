import React from "react";
import {
  Download,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  AlertCircle,
  Database,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "../utils/formatters";
import {
  backupToJsonFile,
  exportDevicesToExcel,
  exportHandoversToExcel,
} from "../services/storage";

export const ReportManagement = ({
  devices,
  users,
  departments,
  handovers,
  maintenance,
  onResetData,
}) => {
  // Aggregate statistics
  const totalValue = devices.reduce(
    (sum, d) => sum + (Number(d.purchaseCost) || 0),
    0,
  );
  const totalMaintenanceCost = maintenance.reduce(
    (sum, m) => sum + (Number(m.cost) || 0),
    0,
  );

  // Department report breakdown
  const deptReports = departments.map((dept) => {
    const deptDevices = devices.filter((d) => d.departmentId === dept.id);
    const value = deptDevices.reduce(
      (sum, d) => sum + (Number(d.purchaseCost) || 0),
      0,
    );
    const inUse = deptDevices.filter((d) => d.status === "in_use").length;
    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      totalDevices: deptDevices.length,
      inUse,
      value,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Trung Tâm Báo Cáo & Xuất Dữ Liệu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu thiết bị, chi phí, xuất báo cáo Excel và công cụ
            sao lưu / phục hồi
          </p>
        </div>

        {/* Quick export actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDevicesToExcel(devices, users, departments)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất toàn bộ thiết bị (Excel)</span>
          </button>
          <button
            onClick={backupToJsonFile}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Sao lưu CSDL (JSON)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Tổng giá trị thiết bị IT
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Đã ghi nhận trên hệ thống
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Tổng chi phí sửa chữa / bảo trì
            </p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {formatCurrency(totalMaintenanceCost)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Qua {maintenance.length} lượt bảo trì
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Tỷ lệ thiết bị đang khai thác
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {devices.length
                ? Math.round(
                    (devices.filter((d) => d.status === "in_use").length /
                      devices.length) *
                      100,
                  )
                : 0}
              %
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hiệu suất sử dụng tài sản
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Báo Cáo Phân Bổ Tài Sản Theo Phòng Ban
            </h3>
            <p className="text-xs text-slate-500">
              Chi tiết số lượng và định mức giá trị sử dụng
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã PB</th>
                <th className="py-3 px-4">Tên Phòng Ban</th>
                <th className="py-3 px-4">Số thiết bị giao</th>
                <th className="py-3 px-4">Đang sử dụng</th>
                <th className="py-3 px-4">Tổng nguyên giá (VNĐ)</th>
                <th className="py-3 px-4 text-right">Tỷ trọng tài sản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptReports.map((row) => {
                const ratio = totalValue
                  ? Math.round((row.value / totalValue) * 100)
                  : 0;
                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {row.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {row.totalDevices} máy
                    </td>
                    <td className="py-3 px-4 text-emerald-600 font-medium">
                      {row.inUse} máy
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {formatCurrency(row.value)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium text-slate-700">
                          {ratio}%
                        </span>
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${ratio}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup and Restore Utilities Box */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-indigo-400" />
          <div>
            <h3 className="font-bold text-base">
              An Toàn & Sao Lưu CSDL (Backup & Restore)
            </h3>
            <p className="text-xs text-slate-300">
              Dữ liệu được lưu trong cơ sở dữ liệu PostgreSQL của hệ thống. Bạn
              có thể xuất file JSON để lưu một bản sao dự phòng hoặc chuyển sang
              máy khác.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={backupToJsonFile}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>Tải file Sao lưu (Backup .json)</span>
          </button>

          <button
            onClick={() =>
              exportHandoversToExcel(handovers, devices, users, departments)
            }
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất toàn bộ Lịch sử mượn trả (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Danger zone: chỉ hiện khi chạy chế độ phát triển */}
      {import.meta.env.DEV && onResetData && (
        <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-rose-900">
                Khu vực nguy hiểm (chỉ dành cho phát triển)
              </h3>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                Thao tác bên dưới sẽ{" "}
                <strong>xóa toàn bộ dữ liệu hiện có</strong> trong PostgreSQL và
                thay bằng dữ liệu mẫu. Hãy bấm "Tải file Sao lưu" ở trên trước.
                Không dùng trên hệ thống đang chứa dữ liệu thật.
              </p>
            </div>
          </div>
          <button
            onClick={onResetData}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Khôi phục Dữ liệu Demo</span>
          </button>
        </div>
      )}
    </div>
  );
};
