import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Laptop,
  Monitor,
  Tv,
  Server,
  Wifi,
  Printer,
  Cpu,
  Eye,
  Edit2,
  Trash2,
  Send,
  Wrench,
  Download,
  QrCode,
  Tag,
  Building,
  User,
  CheckCircle,
} from 'lucide-react';
import { CATEGORIES, STATUS_MAP } from '../data/assetMetadata';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportDevicesToExcel } from '../services/storage';
import { Pagination } from './common/Pagination';

export const DeviceManagement = ({
  devices,
  maintenance = [],
  users,
  departments,
  searchQuery,
  setSearchQuery,
  onOpenNewDevice,
  onEditDevice,
  onDeleteDevice,
  onOpenDeviceDetail,
  onHandoverDevice,
  onMaintainDevice,
}) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus, selectedDept, searchQuery]);

  const deviceTableScrollRef = useRef(null);
  const dragStartRef = useRef(null);
  const didDragRef = useRef(false);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const hasOpenMaintenance = (deviceId) => maintenance.some(
    (item) => item.deviceId === deviceId && ['scheduled', 'in_progress'].includes(item.status)
  );
  const hasInProgressMaintenance = (deviceId) => maintenance.some(
    (item) => item.deviceId === deviceId && item.status === 'in_progress'
  );

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!dragStartRef.current || event.pointerType !== 'mouse') return;
      const deltaX = event.clientX - dragStartRef.current.x;
      if (Math.abs(deltaX) > 4) {
        didDragRef.current = true;
        setIsDraggingTable(true);
        if (deviceTableScrollRef.current) {
          deviceTableScrollRef.current.scrollLeft = dragStartRef.current.scrollLeft - deltaX;
        }
        event.preventDefault();
      }
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
      setIsDraggingTable(false);
      if (didDragRef.current) {
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const handleTablePointerDown = (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (event.target.closest('button, a, input, select, textarea')) return;
    dragStartRef.current = {
      x: event.clientX,
      scrollLeft: deviceTableScrollRef.current?.scrollLeft || 0,
    };
  };

  const handleTableClickCapture = (event) => {
    if (!didDragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  };

  // Filter logic
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      // Category filter
      if (selectedCategory !== 'all' && dev.category !== selectedCategory) return false;

      // Status filter
      if (selectedStatus !== 'all' && dev.status !== selectedStatus) return false;

      // Department filter
      if (selectedDept !== 'all' && dev.departmentId !== selectedDept) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = (dev.code || '').toLowerCase().includes(q);
        const nameMatch = (dev.name || '').toLowerCase().includes(q);
        const serialMatch = (dev.serial || '').toLowerCase().includes(q);
        const modelMatch = (dev.model || '').toLowerCase().includes(q);
        const specsMatch = (dev.specs || '').toLowerCase().includes(q);
        const locationMatch = (dev.location || '').toLowerCase().includes(q);

        const assignedUser = users.find((u) => u.id === dev.userId);
        const userMatch = assignedUser && assignedUser.name.toLowerCase().includes(q);

        if (!codeMatch && !nameMatch && !serialMatch && !modelMatch && !specsMatch && !locationMatch && !userMatch) {
          return false;
        }
      }

      return true;
    });
  }, [devices, selectedCategory, selectedStatus, selectedDept, searchQuery, users]);

  // Helper icon lookup
  const getCategoryIconComponent = (cat) => {
    switch (cat) {
      case 'laptop':
        return Laptop;
      case 'pc':
        return Monitor;
      case 'monitor':
        return Tv;
      case 'server':
        return Server;
      case 'network':
        return Wifi;
      case 'printer':
        return Printer;
      default:
        return Cpu;
    }
  };

  const getUserName = (userId) => {
    if (!userId) return null;
    const u = users.find((item) => item.id === userId);
    return u ? u.name : null;
  };

  const getDeptName = (deptId) => {
    if (!deptId) return null;
    const d = departments.find((item) => item.id === deptId);
    return d ? d.name : null;
  };

  // Tổng nguyên giá của các thiết bị đang lọc
  const totalPurchaseCost = useMemo(() => {
    return filteredDevices.reduce((sum, dev) => sum + (Number(dev.purchaseCost) || 0), 0);
  }, [filteredDevices]);

  // Danh sách thiết bị đã phân trang
  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDevices.slice(start, start + pageSize);
  }, [filteredDevices, currentPage, pageSize]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-base leading-tight sm:text-xl font-bold text-slate-900 tracking-tight">
            <span>Danh Sách Thiết Bị & Tài Sản IT</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-bold">
              {filteredDevices.length} / {devices.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý chi tiết cấu hình, số serial, vị trí và vòng đời sử dụng tài sản
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Toggle Grid/Table view */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dạng bảng chi tiết"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dạng thẻ lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Export button */}
          <button
            onClick={() => exportDevicesToExcel(filteredDevices, users, departments)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100/90 hover:border-emerald-300 shadow-xs sm:flex-none"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          {/* Add Device button */}
          <button
            onClick={onOpenNewDevice}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:bg-blue-700 active:scale-[0.99] sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thiết bị</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm mã TS, tên, serial, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-4 h-4 rounded-full flex items-center justify-center text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-slate-700 transition"
          >
            <option value="all">Tất cả loại thiết bị</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-slate-700 transition"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-slate-700 transition"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filter Tags */}
        {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedDept !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Đang lọc theo:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium border border-blue-200/60">
                Loại: {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-blue-900 ml-1 font-bold">
                  ×
                </button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium border border-amber-200/60">
                Trạng thái: {STATUS_MAP[selectedStatus]?.label}
                <button onClick={() => setSelectedStatus('all')} className="hover:text-amber-900 ml-1 font-bold">
                  ×
                </button>
              </span>
            )}
            {selectedDept !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-medium border border-indigo-200/60">
                Phòng ban: {departments.find((d) => d.id === selectedDept)?.name}
                <button onClick={() => setSelectedDept('all')} className="hover:text-indigo-900 ml-1 font-bold">
                  ×
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium border border-slate-200/60">
                Từ khóa: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-slate-900 ml-1 font-bold">
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedDept('all');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-medium ml-1"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Table or Grid */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Không tìm thấy thiết bị nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Không có thiết bị nào phù hợp với điều kiện tìm kiếm và bộ lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc thêm mới.
          </p>
          <button
            onClick={onOpenNewDevice}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            Thêm thiết bị mới
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'table' && (
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div
                ref={deviceTableScrollRef}
                onPointerDown={handleTablePointerDown}
                onClickCapture={handleTableClickCapture}
                className="overflow-x-auto"
              >
                <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
                  <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                    <tr>
                      <th className="sticky left-0 z-20 w-[110px] min-w-[110px] bg-slate-50 py-3.5 px-4 whitespace-nowrap">
                        Mã tài sản
                      </th>
                      <th className="w-[280px] min-w-[240px] py-3.5 px-4">
                        Thiết bị & Model
                      </th>
                      <th className="w-[140px] min-w-[130px] py-3.5 px-4">
                        Số Serial
                      </th>
                      <th className="w-[170px] min-w-[150px] py-3.5 px-4">
                        Trạng thái
                      </th>
                      <th className="w-[180px] min-w-[160px] py-3.5 px-4">
                        Người sử dụng
                      </th>
                      <th className="w-[220px] min-w-[190px] py-3.5 px-4">
                        Phòng ban
                      </th>
                      <th className="w-[140px] min-w-[130px] py-3.5 px-4 text-right">
                        Nguyên giá
                      </th>
                      <th className="w-[160px] min-w-[150px] py-3.5 px-4 text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedDevices.map((dev) => {
                      const Icon = getCategoryIconComponent(dev.category);
                      const statusMeta = STATUS_MAP[dev.status] || STATUS_MAP.available;
                      const userName = getUserName(dev.userId);
                      const deptName = getDeptName(dev.departmentId);

                      return (
                        <tr
                          key={dev.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Asset Code */}
                          <td className="sticky left-0 z-10 bg-white py-3.5 px-4 whitespace-nowrap group-hover:bg-slate-50/80 transition-colors">
                            <button
                              onClick={() => onOpenDeviceDetail(dev)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/90 hover:bg-blue-100 text-blue-700 font-mono font-bold text-xs border border-blue-200/60 transition-colors"
                              title="Xem chi tiết thiết bị"
                            >
                              <Tag className="w-3.5 h-3.5 text-blue-500" />
                              <span>{dev.code}</span>
                            </button>
                          </td>

                          {/* Device Name & Specs */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200/60 transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 max-w-[240px]">
                                <p
                                  onClick={() => onOpenDeviceDetail(dev)}
                                  className="font-semibold text-slate-900 truncate hover:text-blue-600 cursor-pointer text-[13px] leading-tight"
                                  title={dev.name}
                                >
                                  {dev.name}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5" title={`${dev.brand || ''} ${dev.model ? `• ${dev.model}` : ''}`}>
                                  <span className="font-medium text-slate-600">{dev.brand}</span> {dev.model ? `• ${dev.model}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Serial */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {dev.serial ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200/70"
                                title={dev.serial}
                              >
                                {dev.serial}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusMeta.color}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                              {statusMeta.label}
                            </span>
                          </td>

                          {/* User */}
                          <td className="py-3.5 px-4">
                            {userName ? (
                              <div className="flex items-center gap-2 max-w-[170px]" title={userName}>
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {userName.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate font-medium text-slate-800 text-xs">{userName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Chưa cấp</span>
                            )}
                          </td>

                          {/* Department */}
                          <td className="py-3.5 px-4">
                            {deptName ? (
                              <div className="flex items-center gap-1.5 text-slate-600 max-w-[210px]" title={deptName}>
                                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate text-xs font-medium text-slate-700">{deptName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Chưa gán</span>
                            )}
                          </td>

                          {/* Cost */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="font-semibold text-slate-900 tabular-nums text-[13px]">
                              {formatCurrency(dev.purchaseCost)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                              {/* Quick Handover button */}
                              {dev.status === 'available' && !hasInProgressMaintenance(dev.id) && (
                                <button
                                  onClick={() => onHandoverDevice(dev)}
                                  title="Bàn giao / Cấp phát"
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100/70 transition"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Quick Maintenance button */}
                              {['available', 'in_use', 'borrowed', 'broken'].includes(dev.status) && !hasOpenMaintenance(dev.id) && (
                                <button
                                  onClick={() => onMaintainDevice(dev)}
                                  title={dev.status === 'broken' ? 'Lập phiếu sửa chữa' : 'Lên lịch bảo trì định kỳ'}
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100/70 transition"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Detail button */}
                              <button
                                onClick={() => onOpenDeviceDetail(dev)}
                                title="Xem chi tiết"
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100/70 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit button */}
                              <button
                                onClick={() => onEditDevice(dev)}
                                title="Sửa thông tin"
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => onDeleteDevice(dev)}
                                title="Xóa thiết bị"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100/70 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Table Footer: Summary stats */}
                  <tfoot className="bg-slate-50/90 border-t border-slate-200 text-xs font-medium text-slate-600">
                    <tr>
                      <td colSpan={6} className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <span>
                            Hiển thị <strong className="font-semibold text-slate-800">{filteredDevices.length}</strong> thiết bị
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                          Tổng nguyên giá
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums text-sm text-blue-700">
                          {formatCurrency(totalPurchaseCost)}
                        </span>
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          {/* Cards are the mobile layout; desktop can switch between cards and table. */}
          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 ${viewMode === 'table' ? 'lg:hidden' : ''}`}>
          {paginatedDevices.map((dev) => {
            const Icon = getCategoryIconComponent(dev.category);
            const statusMeta = STATUS_MAP[dev.status] || STATUS_MAP.available;
            const userName = getUserName(dev.userId);
            const deptName = getDeptName(dev.departmentId);

            return (
              <div
                key={dev.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Tag & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                      {dev.code}
                    </span>
                    <span
                      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Title and Icon */}
                  <div className="flex items-start gap-3 mt-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h4
                        onClick={() => onOpenDeviceDetail(dev)}
                        className="cursor-pointer break-words text-sm font-bold leading-5 text-slate-900 hover:text-blue-600 line-clamp-2"
                        title={dev.name}
                      >
                        {dev.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {dev.brand} {dev.model ? `• ${dev.model}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Specs & Serial */}
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs">
                    <div className="break-words text-slate-600 line-clamp-3 leading-5">
                      <span className="font-semibold text-slate-700">Cấu hình:</span> {dev.specs || 'Chưa cập nhật'}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      <span className="font-sans font-semibold text-slate-700">Serial:</span> {dev.serial || '—'}
                    </div>
                  </div>

                  {/* Assignment Info */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-3 text-slate-600">
                      <span className="shrink-0 text-slate-400">Người dùng:</span>
                      <span className="min-w-0 text-right font-semibold text-slate-800">
                        {userName || <span className="text-slate-400 italic">Chưa cấp</span>}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-slate-600">
                      <span className="shrink-0 text-slate-400">Phòng ban:</span>
                      <span className="min-w-0 max-w-[65%] text-right text-slate-700 break-words">
                        {deptName || <span className="text-slate-400 italic">Chưa gán</span>}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-slate-600">
                      <span className="shrink-0 text-slate-400">Vị trí:</span>
                      <span className="min-w-0 max-w-[65%] text-right text-slate-700 break-words">{dev.location || 'Kho'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Cost & Action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">
                    {formatCurrency(dev.purchaseCost)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenDeviceDetail(dev)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                      title="Chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditDevice(dev)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {dev.status === 'available' && !hasInProgressMaintenance(dev.id) && (
                      <button
                        onClick={() => onHandoverDevice(dev)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                        title="Bàn giao"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {['available', 'in_use', 'borrowed', 'broken'].includes(dev.status) && !hasOpenMaintenance(dev.id) && (
                      <button
                        onClick={() => onMaintainDevice(dev)}
                        className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition"
                        title={dev.status === 'broken' ? 'Lập phiếu sửa chữa' : 'Lên lịch bảo trì định kỳ'}
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteDevice(dev)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phân trang */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredDevices.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
        </>
      )}
    </div>
  );
};
