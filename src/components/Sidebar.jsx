import React from 'react';
import {
  LayoutDashboard,
  Laptop2,
  Users,
  Repeat,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Building2,
} from 'lucide-react';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  devicesCount,
  activeHandoversCount,
  inMaintenanceCount,
  isBackendConnected,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'devices',
      label: 'Quản lý thiết bị',
      icon: Laptop2,
      badge: devicesCount,
    },
    {
      id: 'users',
      label: 'Người dùng & Phòng ban',
      icon: Users,
      badge: null,
    },
    {
      id: 'handovers',
      label: 'Bàn giao & Mượn trả',
      icon: Repeat,
      badge: activeHandoversCount > 0 ? activeHandoversCount : null,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'maintenance',
      label: 'Quản lý bảo trì',
      icon: Wrench,
      badge: inMaintenanceCount > 0 ? inMaintenanceCount : null,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'audits',
      label: 'Kiểm kê tài sản',
      icon: ClipboardCheck,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Báo cáo & Xuất file',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200/80 p-4 shrink-0 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Menu Quản Trị
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mini status box at the bottom */}
      <div className="mt-8 p-3 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
          <span className="text-xs font-semibold text-slate-200">
            {isBackendConnected ? 'Backend Server (File CSDL)' : 'Bộ nhớ Trình duyệt (Offline)'}
          </span>
        </div>
        <p className="text-[11px] text-slate-300">
          {isBackendConnected
            ? 'Đang lưu trực tiếp vào file: data/database.json'
            : 'Đang lưu tại LocalStorage trình duyệt'}
        </p>
      </div>
    </aside>
  );
};
