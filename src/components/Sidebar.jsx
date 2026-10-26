import React from "react";
import {
  LayoutDashboard,
  Laptop2,
  Users,
  Repeat,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Building2,
  KeyRound,
  LogOut,
} from "lucide-react";

export const Sidebar = ({
  activeTab,
  setActiveTab,
  devicesCount,
  activeHandoversCount,
  inMaintenanceCount,
  isBackendConnected,
  currentUser,
  onLogout,
  onChangePassword,
}) => {
  const navItems = [
    {
      id: "dashboard",
      label: "Tổng quan",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "devices",
      label: "Quản lý thiết bị",
      icon: Laptop2,
      badge: devicesCount,
    },
    {
      id: "users",
      label: "Người dùng & Phòng ban",
      icon: Users,
      badge: null,
    },
    {
      id: "handovers",
      label: "Bàn giao & Mượn trả",
      icon: Repeat,
      badge: activeHandoversCount > 0 ? activeHandoversCount : null,
      badgeColor: "bg-indigo-100 text-indigo-700",
    },
    {
      id: "maintenance",
      label: "Quản lý bảo trì",
      icon: Wrench,
      badge: inMaintenanceCount > 0 ? inMaintenanceCount : null,
      badgeColor: "bg-amber-100 text-amber-700",
    },
    {
      id: "audits",
      label: "Kiểm kê tài sản",
      icon: ClipboardCheck,
      badge: null,
    },
    {
      id: "reports",
      label: "Báo cáo & Xuất file",
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 p-2 sm:p-3 lg:w-72 lg:justify-between lg:border-b-0 lg:border-r lg:p-4">
      <div className="lg:space-y-4">
        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm lg:flex">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
            <img
              src="/tri-thuc-viet-logo.jpg"
              alt="Logo Tri Thức Việt"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 leading-none">
            <div className="whitespace-nowrap text-[15px] font-extrabold tracking-[0.08em]">
              <span className="text-[#006454]">TRI THỨC</span>{" "}
              <span className="text-[#a30f18]">VIỆT</span>
            </div>
            <p className="mt-2 text-[10px] font-semibold tracking-[0.12em] text-slate-500">
              QUẢN LÝ THIẾT BỊ
            </p>
          </div>
        </div>

      <div className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        <div className="hidden lg:block px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Menu Quản Trị
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-auto lg:w-full shrink-0 flex items-center justify-between px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-700 text-white shadow-sm shadow-brand-600/25"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-3 whitespace-nowrap">
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : item.badgeColor || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </div>

      <div className="mt-2 lg:mt-8 flex flex-col sm:flex-row lg:flex-col gap-2 lg:gap-0 lg:space-y-3">
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
          <p className="truncate text-sm font-semibold text-slate-800">
            {currentUser?.email}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Quản trị viên</p>
          <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={onChangePassword}
              className="flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-1.5 sm:px-2 py-2 text-[11px] sm:text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              <KeyRound className="h-3.5 w-3.5" /> Đổi mật khẩu
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-1.5 sm:px-2 py-2 text-[11px] sm:text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-brand-900 to-brand-800 p-2 sm:p-3 text-white shadow-sm sm:flex-1 lg:flex-none">
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={`w-2 h-2 rounded-full ${isBackendConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
            ></div>
            <span className="text-xs font-semibold text-slate-200">
              {isBackendConnected ? "Cloudflare D1" : "Database Offline"}
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-300">
            {isBackendConnected
              ? "Đang lưu trực tiếp vào D1"
              : "Không thể lưu dữ liệu. Hãy chạy lại ứng dụng local."}
          </p>
        </div>
      </div>
    </aside>
  );
};
