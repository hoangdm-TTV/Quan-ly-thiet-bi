import React, { useState } from "react";
import {
  Server,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Bell,
  Search,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import {
  backupToJsonFile,
  restoreFromJsonFile,
  exportDevicesToExcel,
} from "../services/storage";
import { formatDate, getLocalDateInputValue, getLocalDateOffsetValue } from "../utils/formatters";

export const Navbar = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenNewDevice,
  onOpenNewHandover,
  onDataRefresh,
  devices,
  users,
  departments,
  handovers,
  maintenance,
}) => {
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  // Compute alerts
  const today = getLocalDateInputValue();
  const overdueHandovers = handovers.filter(
    (h) =>
      h.status === "active" &&
      h.type === "borrow" &&
      h.expectedReturnDate &&
      h.expectedReturnDate < today,
  );
  const urgentMaintenance = maintenance.filter(
    (m) => m.status === "in_progress",
  );
  const nextSevenDays = getLocalDateOffsetValue(7);
  const scheduledMaintenance = maintenance.filter(
    (m) => m.status === "scheduled" && m.startDate,
  );
  const maintenanceDueGroups = [
    { label: "Quá hạn", items: scheduledMaintenance.filter((m) => m.startDate < today), tone: "text-rose-900 bg-rose-50 border-rose-200" },
    { label: "Đến hạn hôm nay", items: scheduledMaintenance.filter((m) => m.startDate === today), tone: "text-amber-900 bg-amber-50 border-amber-200" },
    { label: "Trong 7 ngày tới", items: scheduledMaintenance.filter((m) => m.startDate > today && m.startDate <= nextSevenDays), tone: "text-blue-900 bg-blue-50 border-blue-200" },
  ];
  const scheduledDueCount = maintenanceDueGroups.reduce((sum, group) => sum + group.items.length, 0);

  const totalAlerts = overdueHandovers.length + urgentMaintenance.length + scheduledDueCount;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await restoreFromJsonFile(file);
      setImportStatus({
        success: true,
        message: "Khôi phục dữ liệu thành công!",
      });
      onDataRefresh();
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      setImportStatus({ success: false, message: "Lỗi: " + err.message });
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 py-2 md:py-0 min-h-16 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                IT AssetMaster
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                v2.5 Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Hệ thống Quản lý Thiết bị & Tài sản Doanh nghiệp
            </p>
          </div>
        </div>

        {/* Center: Quick Search */}
        <div
          className={`${activeTab === "devices" ? "hidden" : "order-3 w-full md:order-none md:block md:flex-1 md:max-w-md"}`}
        >
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nhanh mã tài sản, tên thiết bị, serial, người dùng..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "devices" && e.target.value) {
                  setActiveTab("devices");
                }
              }}
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Create Buttons */}
          <button
            onClick={onOpenNewDevice}
            className={`${activeTab === "devices" ? "hidden" : "flex"} items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg shadow-sm shadow-blue-500/25 transition-colors`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm thiết bị</span>
            <span className="sm:hidden">Thiết bị</span>
          </button>

          <button
            onClick={onOpenNewHandover}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo bàn giao</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Thông báo & Nhắc nhở"
            >
              <Bell className="w-5 h-5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {totalAlerts}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Thông báo cảnh báo ({totalAlerts})
                  </h4>
                  <button
                    onClick={() => setShowNotifMenu(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Đóng
                  </button>
                </div>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {overdueHandovers.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-amber-900 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Có {overdueHandovers.length} phiếu mượn quá hạn trả:
                      </div>
                      <ul className="list-disc list-inside text-amber-800 space-y-0.5">
                        {overdueHandovers.map((h) => (
                          <li key={h.id}>
                            {h.code} (Hạn: {h.expectedReturnDate})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {urgentMaintenance.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-orange-900 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                        Có {urgentMaintenance.length} thiết bị đang bảo trì sửa
                        chữa
                      </div>
                    </div>
                  )}

                  {maintenanceDueGroups.map((group) => group.items.length > 0 && (
                    <div key={group.label} className={`p-2.5 rounded-lg border text-xs ${group.tone}`}>
                      <div className="flex items-center gap-1.5 font-medium mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {group.label}: {group.items.length} lịch bảo trì
                      </div>
                      <ul className="space-y-1">
                        {group.items.slice(0, 5).map((item) => (
                          <li key={item.id}>
                            <button onClick={() => { setActiveTab("maintenance"); setShowNotifMenu(false); }} className="w-full text-left hover:underline">
                              {item.code} · {formatDate(item.startDate)}
                            </button>
                          </li>
                        ))}
                        {group.items.length > 5 && <li>và {group.items.length - 5} lịch khác…</li>}
                      </ul>
                    </div>
                  ))}

                  {totalAlerts === 0 && (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-80" />
                      Hệ thống hoạt động ổn định, không có cảnh báo tồn đọng.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Backup & Excel Menu */}
          <div className="relative">
            <button
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Sao lưu & Xuất dữ liệu"
            >
              <Download className="w-5 h-5" />
            </button>

            {showBackupMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                <div className="text-xs font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Dữ liệu & Báo cáo
                </div>
                <button
                  onClick={() => {
                    exportDevicesToExcel(devices, users, departments);
                    setShowBackupMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất danh sách thiết bị (.xlsx)</span>
                </button>

                <button
                  onClick={() => {
                    backupToJsonFile();
                    setShowBackupMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition-colors"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Sao lưu toàn bộ dữ liệu (JSON)</span>
                </button>

                <label className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Khôi phục từ file JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      handleFileUpload(e);
                      setShowBackupMenu(false);
                    }}
                    className="hidden"
                  />
                </label>

                {import.meta.env.DEV && (
                  <>
                    <div className="my-1 border-t border-slate-100"></div>
                    <button
                      onClick={() => {
                        setShowBackupMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg text-left transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Đặt lại dữ liệu mẫu Demo</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global alert toast */}
      {importStatus && (
        <div
          className={`px-4 py-2 text-xs font-medium text-center ${
            importStatus.success
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white"
          }`}
        >
          {importStatus.message}
        </div>
      )}
    </header>
  );
};
