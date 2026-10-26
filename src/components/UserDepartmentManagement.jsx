import React, { useState } from 'react';
import {
  Users,
  Building,
  Plus,
  Mail,
  Phone,
  Laptop,
  Search,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const UserDepartmentManagement = ({
  users,
  departments,
  devices,
  handovers,
  onOpenNewUser,
  onEditUser,
  onDeleteUser,
  onOpenNewDepartment,
  onEditDepartment,
  onDeleteDepartment,
  onOpenDeviceDetail,
}) => {
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'departments'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    if (selectedDeptFilter !== 'all' && u.departmentId !== selectedDeptFilter) return false;
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchCode = (u.code || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchPos = (u.position || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchEmail && !matchPos) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản Lý Nhân Viên & Phòng Ban
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi người sử dụng, phòng ban và tài sản được giao theo từng nhân sự
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'users'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nhân viên ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('departments')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'departments'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Phòng ban ({departments.length})</span>
            </button>
          </div>

          {activeSubTab === 'users' && (
            <button
              onClick={onOpenNewUser}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhân viên</span>
            </button>
          )}
          {activeSubTab === 'departments' && (
            <button
              onClick={onOpenNewDepartment}
              className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm phòng ban</span>
            </button>
          )}
        </div>
      </div>

      {/* USERS TAB */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Dept Filter */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhân viên theo tên, mã NV, email, vị trí..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-700"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const dept = departments.find((d) => d.id === user.departmentId);
              // Devices currently assigned to this user
              const userDevices = devices.filter((d) => d.userId === user.id);
              // Total value of equipment assigned
              const totalEquipValue = userDevices.reduce((sum, d) => sum + (Number(d.purchaseCost) || 0), 0);

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* User Profile Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={user.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {user.code}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 font-medium">{user.position}</p>
                          <p className="text-[11px] text-slate-500">{dept ? dept.name : 'Chưa xếp phòng'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditUser(user)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Sửa nhân viên"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa nhân viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-3 py-2 border-y border-slate-100 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{user.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.phone || '—'}</span>
                      </div>
                    </div>

                    {/* Assigned Devices Section */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Laptop className="w-3.5 h-3.5 text-blue-600" />
                          Thiết bị đang nắm giữ ({userDevices.length}):
                        </span>
                        {totalEquipValue > 0 && (
                          <span className="text-[11px] font-medium text-slate-500">
                            {formatCurrency(totalEquipValue)}
                          </span>
                        )}
                      </div>

                      {userDevices.length === 0 ? (
                        <div className="p-2 rounded-lg bg-slate-50 text-[11px] text-slate-400 text-center italic">
                          Chưa được cấp phát thiết bị nào
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {userDevices.map((d) => (
                            <div
                              key={d.id}
                              onClick={() => onOpenDeviceDetail(d)}
                              className="p-2 rounded-lg bg-blue-50/50 hover:bg-blue-100/60 border border-blue-100 cursor-pointer transition flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{d.name}</p>
                                <p className="font-mono text-[10px] text-blue-700">{d.code} • {d.serial}</p>
                              </div>
                              <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DEPARTMENTS TAB */}
      {activeSubTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const deptUsers = users.filter((u) => u.departmentId === dept.id);
            const deptDevices = devices.filter((d) => d.departmentId === dept.id);
            const totalValue = deptDevices.reduce((sum, d) => sum + (Number(d.purchaseCost) || 0), 0);

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition space-y-4"
              >
                  <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      {dept.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2">{dept.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Vị trí: {dept.room || 'Tòa nhà văn phòng'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-brand-700">
                      <Building className="h-5 w-5" />
                    </div>
                    <button
                      onClick={() => onEditDepartment(dept)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-brand-700"
                      title="Sửa phòng ban"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDepartment(dept)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Xóa phòng ban"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Trưởng bộ phận:</span>
                    <span className="font-semibold text-slate-800">{dept.manager || 'Chưa chỉ định'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Số lượng nhân sự:</span>
                    <span className="font-semibold text-slate-800">{deptUsers.length} người</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Số thiết bị bàn giao:</span>
                    <span className="font-semibold text-blue-600">{deptDevices.length} thiết bị</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Tổng giá trị thiết bị:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(totalValue)}</span>
                  </div>
                </div>

                {/* Member avatars */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Nhân viên thuộc bộ phận:</p>
                  <div className="flex -space-x-2 overflow-hidden">
                    {deptUsers.slice(0, 5).map((u) => (
                      <img
                        key={u.id}
                        src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                        alt={u.name}
                        title={u.name}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                      />
                    ))}
                    {deptUsers.length > 5 && (
                      <span className="h-7 w-7 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        +{deptUsers.length - 5}
                      </span>
                    )}
                    {deptUsers.length === 0 && (
                      <span className="text-xs text-slate-400 italic">Chưa có nhân viên</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
