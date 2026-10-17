import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DeviceManagement } from './components/DeviceManagement';
import { UserDepartmentManagement } from './components/UserDepartmentManagement';
import { HandoverManagement } from './components/HandoverManagement';
import { MaintenanceManagement } from './components/MaintenanceManagement';
import { AuditManagement } from './components/AuditManagement';
import { ReportManagement } from './components/ReportManagement';

// Modals
import { DeviceModal } from './components/modals/DeviceModal';
import { DeviceDetailModal } from './components/modals/DeviceDetailModal';
import { HandoverModal } from './components/modals/HandoverModal';
import { ReturnModal } from './components/modals/ReturnModal';
import { MaintenanceModal } from './components/modals/MaintenanceModal';
import { AuditModal } from './components/modals/AuditModal';
import { UserModal } from './components/modals/UserModal';
import { PrintVoucherModal } from './components/modals/PrintVoucherModal';

import { fetchInitialData, saveStoredData, resetToSampleData } from './services/storage';

export default function App() {
  // Main data state
  const [data, setData] = useState({ devices: [], users: [], departments: [], handovers: [], maintenance: [], audits: [] });
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [databaseError, setDatabaseError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Load from backend on startup
  useEffect(() => {
    fetchInitialData()
      .then(({ data: remoteData }) => {
        setData(remoteData);
        setIsBackendConnected(true);
        setDatabaseError('');
      })
      .catch((error) => setDatabaseError(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  // Modals state
  const [deviceModal, setDeviceModal] = useState({ open: false, editItem: null });
  const [detailModal, setDetailModal] = useState({ open: false, device: null });
  const [handoverModal, setHandoverModal] = useState({ open: false, preselectedDevice: null });
  const [returnModal, setReturnModal] = useState({ open: false, handover: null });
  const [maintenanceModal, setMaintenanceModal] = useState({ open: false, preselectedDevice: null });
  const [auditModal, setAuditModal] = useState({ open: false });
  const [userModal, setUserModal] = useState({ open: false, editItem: null });
  const [printModal, setPrintModal] = useState({ open: false, handover: null });

  // Save changes to storage whenever data changes
  const updateData = async (newData) => {
    try {
      await saveStoredData(newData);
      setData(newData);
      setIsBackendConnected(true);
      setDatabaseError('');
    } catch (error) {
      setIsBackendConnected(false);
      setDatabaseError(error.message);
      window.alert(`Không thể lưu vào database: ${error.message}`);
    }
  };

  const handleRefresh = async () => {
    try {
      const { data: latestData } = await fetchInitialData();
      setData(latestData);
      setIsBackendConnected(true);
      setDatabaseError('');
    } catch (error) {
      setDatabaseError(error.message);
      window.alert(`Không thể tải dữ liệu từ database: ${error.message}`);
    }
  };

  // --- Handlers for Devices ---
  const handleSaveDevice = (deviceData) => {
    let updatedDevices;
    if (deviceModal.editItem) {
      updatedDevices = data.devices.map((d) =>
        d.id === deviceModal.editItem.id ? { ...d, ...deviceData } : d
      );
    } else {
      const newDevice = {
        ...deviceData,
        id: `dev-${Date.now()}`,
      };
      updatedDevices = [newDevice, ...data.devices];
    }
    updateData({ ...data, devices: updatedDevices });
  };

  const handleDeleteDevice = (device) => {
    if (window.confirm(`Bạn có chắc muốn xóa thiết bị "${device.name}" (${device.code})?`)) {
      const updatedDevices = data.devices.filter((d) => d.id !== device.id);
      updateData({ ...data, devices: updatedDevices });
    }
  };

  // --- Handlers for Handover & Borrow ---
  const handleSaveHandover = (handoverFormData) => {
    const newHandover = {
      ...handoverFormData,
      id: `ho-${Date.now()}`,
    };

    // Update target device status and assigned user
    const updatedDevices = data.devices.map((d) => {
      if (d.id === handoverFormData.deviceId) {
        return {
          ...d,
          status: handoverFormData.type === 'borrow' ? 'borrowed' : 'in_use',
          userId: handoverFormData.userId,
          departmentId: handoverFormData.departmentId || d.departmentId,
        };
      }
      return d;
    });

    updateData({
      ...data,
      devices: updatedDevices,
      handovers: [newHandover, ...data.handovers],
    });
  };

  const handleConfirmReturn = ({ handoverId, deviceId, returnDate, condition, nextDeviceStatus, returnNotes }) => {
    // 1. Update handover record
    const updatedHandovers = data.handovers.map((h) => {
      if (h.id === handoverId) {
        return {
          ...h,
          status: 'returned',
          actualReturnDate: returnDate,
          notes: returnNotes ? `${h.notes || ''} [Trả ngày ${returnDate}: ${returnNotes}]` : h.notes,
        };
      }
      return h;
    });

    // 2. Update device status and unassign user if now available
    const updatedDevices = data.devices.map((d) => {
      if (d.id === deviceId) {
        return {
          ...d,
          status: nextDeviceStatus,
          userId: nextDeviceStatus === 'available' ? null : d.userId,
          location: nextDeviceStatus === 'available' ? 'Kho IT' : d.location,
        };
      }
      return d;
    });

    updateData({
      ...data,
      devices: updatedDevices,
      handovers: updatedHandovers,
    });
  };

  // --- Handlers for Maintenance ---
  const handleSaveMaintenance = (maintenanceData) => {
    const newRecord = {
      ...maintenanceData,
      id: `maint-${Date.now()}`,
    };

    // If status is in_progress, mark device as maintenance
    const updatedDevices = data.devices.map((d) => {
      if (d.id === maintenanceData.deviceId) {
        if (maintenanceData.status === 'in_progress') {
          return { ...d, status: 'maintenance' };
        }
      }
      return d;
    });

    updateData({
      ...data,
      devices: updatedDevices,
      maintenance: [newRecord, ...data.maintenance],
    });
  };

  const handleCompleteMaintenance = (maintenanceItem) => {
    const completeDate = new Date().toISOString().split('T')[0];
    const costInput = window.prompt(
      'Xác nhận nghiệm thu bảo trì xong. Nhập chi phí thực tế (VNĐ):',
      String(maintenanceItem.cost || 0)
    );
    if (costInput === null) return;

    const actualCost = Number(costInput) || 0;

    const updatedMaintenance = data.maintenance.map((m) => {
      if (m.id === maintenanceItem.id) {
        return {
          ...m,
          status: 'completed',
          cost: actualCost,
          completedDate: completeDate,
        };
      }
      return m;
    });

    // Device returns to 'available' or keep previous user
    const targetDev = data.devices.find((d) => d.id === maintenanceItem.deviceId);
    const updatedDevices = data.devices.map((d) => {
      if (d.id === maintenanceItem.deviceId) {
        return {
          ...d,
          status: d.userId ? 'in_use' : 'available',
        };
      }
      return d;
    });

    updateData({
      ...data,
      devices: updatedDevices,
      maintenance: updatedMaintenance,
    });
  };

  // --- Handlers for Audits ---
  const handleSaveAudit = (auditData) => {
    const newAudit = {
      ...auditData,
      id: `audit-${Date.now()}`,
    };
    updateData({
      ...data,
      audits: [newAudit, ...data.audits],
    });
  };

  const handleUpdateAuditItem = (auditId, deviceId, status, note) => {
    const updatedAudits = data.audits.map((a) => {
      if (a.id === auditId) {
        const existingRecords = [...(a.records || [])];
        const recordIndex = existingRecords.findIndex((r) => r.deviceId === deviceId);

        if (recordIndex >= 0) {
          existingRecords[recordIndex] = { deviceId, status, note };
        } else {
          existingRecords.push({ deviceId, status, note });
        }

        const matchedCount = existingRecords.filter((r) => r.status === 'matched').length;
        const discrepancyCount = existingRecords.filter((r) => r.status === 'discrepancy').length;

        return {
          ...a,
          records: existingRecords,
          matchedCount,
          discrepancyCount,
        };
      }
      return a;
    });

    updateData({ ...data, audits: updatedAudits });
  };

  const handleFinishAudit = (auditId) => {
    if (window.confirm('Bạn có chắc muốn chốt đợt kiểm kê này thành trạng thái Đã Hoàn Thành?')) {
      const updatedAudits = data.audits.map((a) =>
        a.id === auditId ? { ...a, status: 'completed' } : a
      );
      updateData({ ...data, audits: updatedAudits });
    }
  };

  // --- Handlers for Users ---
  const handleSaveUser = (userData) => {
    let updatedUsers;
    if (userModal.editItem) {
      updatedUsers = data.users.map((u) =>
        u.id === userModal.editItem.id ? { ...u, ...userData } : u
      );
    } else {
      const newUser = {
        ...userData,
        id: `user-${Date.now()}`,
      };
      updatedUsers = [newUser, ...data.users];
    }
    updateData({ ...data, users: updatedUsers });
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Bạn có chắc muốn xóa nhân sự "${user.name}"?`)) {
      const updatedUsers = data.users.filter((u) => u.id !== user.id);
      updateData({ ...data, users: updatedUsers });
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Khôi phục toàn bộ CSDL về dữ liệu mẫu mặc định?')) {
      try {
        const fresh = await resetToSampleData();
        setData(fresh);
        setDatabaseError('');
        alert('Đã thiết lập lại dữ liệu thành công!');
      } catch (error) {
        setDatabaseError(error.message);
        alert(`Không thể khôi phục dữ liệu: ${error.message}`);
      }
    }
  };

  if (isLoading || databaseError && !isBackendConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold text-slate-900">{isLoading ? 'Đang kết nối database…' : 'Không thể kết nối database'}</h1>
          <p className="mt-3 text-sm text-slate-600">{isLoading ? 'Đang tải dữ liệu từ backend.' : databaseError}</p>
          {!isLoading && <p className="mt-2 text-sm text-slate-500">Hãy chạy backend bằng <code>npm run server</code>, sau đó tải lại trang. Ứng dụng không dùng dữ liệu mẫu khi database không khả dụng.</p>}
          {!isLoading && <button className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => window.location.reload()}>Thử lại</button>}
        </div>
      </div>
    );
  }

  // Compute counts for sidebar
  const activeHandoversCount = data.handovers.filter((h) => h.status === 'active').length;
  const inMaintenanceCount = data.maintenance.filter((m) => m.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNewDevice={() => setDeviceModal({ open: true, editItem: null })}
        onOpenNewHandover={() => setHandoverModal({ open: true, preselectedDevice: null })}
        onDataRefresh={handleRefresh}
        devices={data.devices}
        users={data.users}
        departments={data.departments}
        handovers={data.handovers}
        maintenance={data.maintenance}
      />

      {/* Main Layout Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          devicesCount={data.devices.length}
          activeHandoversCount={activeHandoversCount}
          inMaintenanceCount={inMaintenanceCount}
          isBackendConnected={isBackendConnected}
        />

        {/* Center Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              devices={data.devices}
              users={data.users}
              departments={data.departments}
              handovers={data.handovers}
              maintenance={data.maintenance}
              setActiveTab={setActiveTab}
              onOpenDeviceDetail={(dev) => setDetailModal({ open: true, device: dev })}
            />
          )}

          {activeTab === 'devices' && (
            <DeviceManagement
              devices={data.devices}
              users={data.users}
              departments={data.departments}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenNewDevice={() => setDeviceModal({ open: true, editItem: null })}
              onEditDevice={(dev) => setDeviceModal({ open: true, editItem: dev })}
              onDeleteDevice={handleDeleteDevice}
              onOpenDeviceDetail={(dev) => setDetailModal({ open: true, device: dev })}
              onHandoverDevice={(dev) => setHandoverModal({ open: true, preselectedDevice: dev })}
              onMaintainDevice={(dev) => setMaintenanceModal({ open: true, preselectedDevice: dev })}
            />
          )}

          {activeTab === 'users' && (
            <UserDepartmentManagement
              users={data.users}
              departments={data.departments}
              devices={data.devices}
              handovers={data.handovers}
              onOpenNewUser={() => setUserModal({ open: true, editItem: null })}
              onEditUser={(u) => setUserModal({ open: true, editItem: u })}
              onDeleteUser={handleDeleteUser}
              onOpenDeviceDetail={(dev) => setDetailModal({ open: true, device: dev })}
            />
          )}

          {activeTab === 'handovers' && (
            <HandoverManagement
              handovers={data.handovers}
              devices={data.devices}
              users={data.users}
              departments={data.departments}
              onOpenNewHandover={() => setHandoverModal({ open: true, preselectedDevice: null })}
              onReturnDevice={(h) => setReturnModal({ open: true, handover: h })}
              onPrintVoucher={(h) => setPrintModal({ open: true, handover: h })}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceManagement
              maintenance={data.maintenance}
              devices={data.devices}
              onOpenNewMaintenance={() => setMaintenanceModal({ open: true, preselectedDevice: null })}
              onCompleteMaintenance={handleCompleteMaintenance}
            />
          )}

          {activeTab === 'audits' && (
            <AuditManagement
              audits={data.audits}
              devices={data.devices}
              onOpenNewAudit={() => setAuditModal({ open: true })}
              onUpdateAuditItem={handleUpdateAuditItem}
              onFinishAudit={handleFinishAudit}
            />
          )}

          {activeTab === 'reports' && (
            <ReportManagement
              devices={data.devices}
              users={data.users}
              departments={data.departments}
              handovers={data.handovers}
              maintenance={data.maintenance}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      <DeviceModal
        isOpen={deviceModal.open}
        onClose={() => setDeviceModal({ open: false, editItem: null })}
        onSave={handleSaveDevice}
        deviceToEdit={deviceModal.editItem}
        departments={data.departments}
        users={data.users}
      />

      <DeviceDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, device: null })}
        device={detailModal.device}
        users={data.users}
        departments={data.departments}
        handovers={data.handovers}
        maintenance={data.maintenance}
        onEdit={(dev) => setDeviceModal({ open: true, editItem: dev })}
        onHandover={(dev) => setHandoverModal({ open: true, preselectedDevice: dev })}
        onMaintain={(dev) => setMaintenanceModal({ open: true, preselectedDevice: dev })}
      />

      <HandoverModal
        isOpen={handoverModal.open}
        onClose={() => setHandoverModal({ open: false, preselectedDevice: null })}
        onSave={handleSaveHandover}
        preselectedDevice={handoverModal.preselectedDevice}
        devices={data.devices}
        users={data.users}
        departments={data.departments}
      />

      <ReturnModal
        isOpen={returnModal.open}
        onClose={() => setReturnModal({ open: false, handover: null })}
        handover={returnModal.handover}
        device={data.devices.find((d) => d.id === returnModal.handover?.deviceId)}
        user={data.users.find((u) => u.id === returnModal.handover?.userId)}
        onConfirmReturn={handleConfirmReturn}
      />

      <MaintenanceModal
        isOpen={maintenanceModal.open}
        onClose={() => setMaintenanceModal({ open: false, preselectedDevice: null })}
        onSave={handleSaveMaintenance}
        preselectedDevice={maintenanceModal.preselectedDevice}
        devices={data.devices}
      />

      <AuditModal
        isOpen={auditModal.open}
        onClose={() => setAuditModal({ open: false })}
        onSave={handleSaveAudit}
      />

      <UserModal
        isOpen={userModal.open}
        onClose={() => setUserModal({ open: false, editItem: null })}
        onSave={handleSaveUser}
        userToEdit={userModal.editItem}
        departments={data.departments}
      />

      <PrintVoucherModal
        isOpen={printModal.open}
        onClose={() => setPrintModal({ open: false, handover: null })}
        handover={printModal.handover}
        device={data.devices.find((d) => d.id === printModal.handover?.deviceId)}
        user={data.users.find((u) => u.id === printModal.handover?.userId)}
        department={data.departments.find((dep) => dep.id === printModal.handover?.departmentId)}
      />
    </div>
  );
}
