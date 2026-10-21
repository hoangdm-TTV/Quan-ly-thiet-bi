import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { DeviceManagement } from "./components/DeviceManagement";
import { UserDepartmentManagement } from "./components/UserDepartmentManagement";
import { HandoverManagement } from "./components/HandoverManagement";
import { MaintenanceManagement } from "./components/MaintenanceManagement";
import { AuditManagement } from "./components/AuditManagement";
import { ReportManagement } from "./components/ReportManagement";

// Modals
import { DeviceModal } from "./components/modals/DeviceModal";
import { DeviceDetailModal } from "./components/modals/DeviceDetailModal";
import { HandoverModal } from "./components/modals/HandoverModal";
import { ReturnModal } from "./components/modals/ReturnModal";
import { MaintenanceModal } from "./components/modals/MaintenanceModal";
import { AuditModal } from "./components/modals/AuditModal";
import { UserModal } from "./components/modals/UserModal";
import { PrintVoucherModal } from "./components/modals/PrintVoucherModal";
import { LoginPage } from "./components/LoginPage";
import { ChangePasswordModal } from "./components/ChangePasswordModal";

import {
  changePassword,
  fetchInitialData,
  getAuthStatus,
  getCurrentUser,
  login,
  logout,
  resetToSampleData,
  saveStoredData,
} from "./services/storage";

export default function App() {
  // Main data state
  const [data, setData] = useState({
    devices: [],
    users: [],
    departments: [],
    handovers: [],
    maintenance: [],
    audits: [],
  });
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [databaseError, setDatabaseError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [authSetupRequired, setAuthSetupRequired] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Restore the authenticated session before loading company data.
  useEffect(() => {
    const initialize = async () => {
      try {
        const { user } = await getCurrentUser();
        setAuthUser(user);
        const { data: remoteData } = await fetchInitialData();
        setData(remoteData);
        setIsBackendConnected(true);
        setDatabaseError("");
      } catch (error) {
        if (error.status === 401) {
          try {
            const { setupRequired } = await getAuthStatus();
            setAuthSetupRequired(setupRequired);
          } catch (statusError) {
            setDatabaseError(statusError.message);
          }
        } else {
          setDatabaseError(error.message);
        }
      } finally {
        setIsLoading(false);
        setIsAuthLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      setAuthUser(null);
      setData({
        devices: [],
        users: [],
        departments: [],
        handovers: [],
        maintenance: [],
        audits: [],
      });
      setIsBackendConnected(false);
    };
    window.addEventListener("it-asset-auth-expired", handleExpiredSession);
    return () =>
      window.removeEventListener("it-asset-auth-expired", handleExpiredSession);
  }, []);

  const handleLogin = async (credentials) => {
    const { user } = await login(credentials);
    setAuthUser(user);
    setAuthSetupRequired(false);
    setIsLoading(true);
    try {
      const { data: remoteData } = await fetchInitialData();
      setData(remoteData);
      setIsBackendConnected(true);
      setDatabaseError("");
    } catch (error) {
      setIsBackendConnected(false);
      setDatabaseError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Clear the local view even if the session has already expired.
    }
    setAuthUser(null);
    setData({
      devices: [],
      users: [],
      departments: [],
      handovers: [],
      maintenance: [],
      audits: [],
    });
    setIsBackendConnected(false);
    setDatabaseError("");
  };

  const handleChangePassword = async (passwords) => {
    await changePassword(passwords);
    setIsPasswordModalOpen(false);
    await handleLogout();
  };

  // Modals state
  const [deviceModal, setDeviceModal] = useState({
    open: false,
    editItem: null,
  });
  const [detailModal, setDetailModal] = useState({ open: false, device: null });
  const [handoverModal, setHandoverModal] = useState({
    open: false,
    preselectedDevice: null,
  });
  const [returnModal, setReturnModal] = useState({
    open: false,
    handover: null,
  });
  const [maintenanceModal, setMaintenanceModal] = useState({
    open: false,
    preselectedDevice: null,
  });
  const [auditModal, setAuditModal] = useState({ open: false });
  const [userModal, setUserModal] = useState({ open: false, editItem: null });
  const [printModal, setPrintModal] = useState({ open: false, handover: null });

  // Save changes to storage whenever data changes
  const updateData = async (newData) => {
    try {
      await saveStoredData(newData);
      setData(newData);
      setIsBackendConnected(true);
      setDatabaseError("");
      return true;
    } catch (error) {
      setIsBackendConnected(false);
      setDatabaseError(error.message);
      window.alert(`Không thể lưu vào database: ${error.message}`);
      return false;
    }
  };

  const handleRefresh = async () => {
    try {
      const { data: latestData } = await fetchInitialData();
      setData(latestData);
      setIsBackendConnected(true);
      setDatabaseError("");
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
        d.id === deviceModal.editItem.id
          ? {
              ...d,
              ...deviceData,
              status: d.status,
              userId: d.userId,
              departmentId: d.departmentId,
            }
          : d,
      );
    } else {
      const newDevice = {
        ...deviceData,
        id: `dev-${Date.now()}`,
        status: "available",
        userId: null,
        departmentId: null,
      };
      updatedDevices = [newDevice, ...data.devices];
    }
    updateData({ ...data, devices: updatedDevices });
  };

  const handleDeleteDevice = (device) => {
    const hasHandoverHistory = data.handovers.some(
      (handover) => handover.deviceId === device.id,
    );
    const hasMaintenanceHistory = data.maintenance.some(
      (item) => item.deviceId === device.id,
    );
    if (hasHandoverHistory || hasMaintenanceHistory) {
      window.alert(
        "Thiết bị đã có lịch sử bàn giao hoặc bảo trì nên không thể xóa. Hãy giữ hồ sơ để bảo toàn vòng đời tài sản.",
      );
      return;
    }
    if (
      window.confirm(
        `Bạn có chắc muốn xóa thiết bị "${device.name}" (${device.code})?`,
      )
    ) {
      const updatedDevices = data.devices.filter((d) => d.id !== device.id);
      updateData({ ...data, devices: updatedDevices });
    }
  };

  const handleLiquidateDevice = async (device) => {
    const reason = window.prompt(
      `Nhập lý do thanh lý thiết bị ${device.code}:`,
    );
    if (reason === null) return;
    if (!reason.trim()) {
      window.alert("Cần ghi lý do thanh lý để lưu dấu vết tài sản.");
      return;
    }
    if (
      !window.confirm(
        `Xác nhận chuyển ${device.code} sang trạng thái Đã thanh lý?`,
      )
    )
      return;

    let latestData;
    try {
      ({ data: latestData } = await fetchInitialData());
      setData(latestData);
    } catch (error) {
      setDatabaseError(error.message);
      window.alert(
        `Không thể kiểm tra trạng thái mới nhất của thiết bị: ${error.message}`,
      );
      return;
    }

    const currentDevice = latestData.devices.find(
      (item) => item.id === device.id,
    );
    const hasActiveHandover = latestData.handovers.some(
      (item) => item.deviceId === device.id && item.status === "active",
    );
    const hasOpenMaintenance = latestData.maintenance.some(
      (item) =>
        item.deviceId === device.id &&
        ["scheduled", "in_progress"].includes(item.status),
    );
    if (
      !currentDevice ||
      !["available", "broken"].includes(currentDevice.status) ||
      hasActiveHandover ||
      hasOpenMaintenance
    ) {
      window.alert(
        "Chỉ có thể thanh lý thiết bị đang ở kho hoặc đang hỏng và không còn phiếu bàn giao/bảo trì mở.",
      );
      return;
    }

    const today = new Date().toLocaleDateString("sv-SE");
    const updatedDevices = latestData.devices.map((item) =>
      item.id === device.id
        ? {
            ...item,
            status: "liquidated",
            userId: null,
            departmentId: null,
            location: "Đã thanh lý",
            notes: `${item.notes || ""}${item.notes ? "\n" : ""}[Thanh lý ${today}] ${reason.trim()}`,
          }
        : item,
    );
    const saved = await updateData({ ...latestData, devices: updatedDevices });
    if (saved) setDetailModal({ open: false, device: null });
  };

  // --- Handlers for Handover & Borrow ---
  const handleSaveHandover = async (handoverFormData) => {
    let latestData;
    try {
      ({ data: latestData } = await fetchInitialData());
      setData(latestData);
    } catch (error) {
      setDatabaseError(error.message);
      window.alert(
        `Không thể kiểm tra trạng thái mới nhất của thiết bị: ${error.message}`,
      );
      return false;
    }

    const device = latestData.devices.find(
      (d) => d.id === handoverFormData.deviceId,
    );
    const hasActiveHandover = latestData.handovers.some(
      (h) => h.deviceId === handoverFormData.deviceId && h.status === "active",
    );
    const hasInProgressMaintenance = latestData.maintenance.some(
      (item) =>
        item.deviceId === handoverFormData.deviceId &&
        item.status === "in_progress",
    );
    if (
      !device ||
      device.status !== "available" ||
      hasActiveHandover ||
      hasInProgressMaintenance
    ) {
      window.alert(
        "Không thể bàn giao: thiết bị chưa sẵn sàng, đang có phiếu chưa trả hoặc đang được sửa chữa. Hãy tải lại dữ liệu và chọn thiết bị khác.",
      );
      return false;
    }

    const newHandover = {
      ...handoverFormData,
      id: `ho-${Date.now()}`,
    };

    // Update target device status and assigned user
    const updatedDevices = latestData.devices.map((d) => {
      if (d.id === handoverFormData.deviceId) {
        return {
          ...d,
          status: handoverFormData.type === "borrow" ? "borrowed" : "in_use",
          userId: handoverFormData.userId,
          departmentId: handoverFormData.departmentId || null,
        };
      }
      return d;
    });

    return updateData({
      ...latestData,
      devices: updatedDevices,
      handovers: [newHandover, ...latestData.handovers],
    });
  };

  const handleConfirmReturn = async ({
    handoverId,
    deviceId,
    returnDate,
    condition,
    nextDeviceStatus,
    returnNotes,
  }) => {
    let latestData;
    try {
      ({ data: latestData } = await fetchInitialData());
      setData(latestData);
    } catch (error) {
      setDatabaseError(error.message);
      window.alert(
        `Không thể kiểm tra trạng thái mới nhất của phiếu trả: ${error.message}`,
      );
      return false;
    }

    const handover = latestData.handovers.find((h) => h.id === handoverId);
    const device = latestData.devices.find((d) => d.id === deviceId);
    const anotherActiveHandover = latestData.handovers.some(
      (h) =>
        h.id !== handoverId && h.deviceId === deviceId && h.status === "active",
    );
    if (
      !handover ||
      handover.status !== "active" ||
      handover.deviceId !== deviceId ||
      !device ||
      anotherActiveHandover
    ) {
      window.alert(
        "Không thể xác nhận trả: phiếu hoặc thiết bị đã thay đổi, hoặc đang có phiếu sử dụng khác. Hãy tải lại dữ liệu rồi thử lại.",
      );
      return false;
    }

    // 1. Update handover record
    const updatedHandovers = latestData.handovers.map((h) => {
      if (h.id === handoverId) {
        return {
          ...h,
          status: "returned",
          actualReturnDate: returnDate,
          notes: `${h.notes || ""}${h.notes ? "\n" : ""}[Trả ngày ${returnDate}] Tình trạng khi nhận lại: ${condition || "Chưa ghi nhận"}.${returnNotes ? ` Ghi chú: ${returnNotes}` : ""}`,
        };
      }
      return h;
    });

    // 2. Update device status and unassign user if now available
    const updatedDevices = latestData.devices.map((d) => {
      if (d.id === deviceId) {
        return {
          ...d,
          status: nextDeviceStatus,
          userId: null,
          departmentId: null,
          location:
            nextDeviceStatus === "available"
              ? "Kho IT"
              : nextDeviceStatus === "maintenance"
                ? "Khu vực bảo trì"
                : "Khu vực thiết bị hỏng",
        };
      }
      return d;
    });

    return updateData({
      ...latestData,
      devices: updatedDevices,
      handovers: updatedHandovers,
    });
  };

  // --- Handlers for Maintenance ---
  const handleSaveMaintenance = async (maintenanceData) => {
    if (!["scheduled", "in_progress"].includes(maintenanceData.status)) {
      window.alert(
        "Phiếu mới chỉ có thể ở trạng thái đã lên lịch hoặc đang xử lý. Hãy nghiệm thu sau khi bắt đầu xử lý.",
      );
      return false;
    }
    let latestData;
    try {
      ({ data: latestData } = await fetchInitialData());
      setData(latestData);
    } catch (error) {
      setDatabaseError(error.message);
      window.alert(
        `Không thể kiểm tra trạng thái mới nhất của thiết bị: ${error.message}`,
      );
      return false;
    }

    const device = latestData.devices.find(
      (item) => item.id === maintenanceData.deviceId,
    );
    const hasActiveHandover = latestData.handovers.some(
      (item) =>
        item.deviceId === maintenanceData.deviceId && item.status === "active",
    );
    const hasOpenMaintenance = latestData.maintenance.some(
      (item) =>
        item.deviceId === maintenanceData.deviceId &&
        ["scheduled", "in_progress"].includes(item.status),
    );
    const canSchedule =
      device &&
      ["available", "in_use", "borrowed", "broken"].includes(device.status);
    const canStartNow = device?.status === "broken" && !hasActiveHandover;
    if (
      !canSchedule ||
      hasOpenMaintenance ||
      (maintenanceData.status === "in_progress" && !canStartNow)
    ) {
      window.alert(
        "Thiết bị đang sử dụng chỉ được lên lịch. Muốn bắt đầu sửa chữa, hãy thu hồi và ghi nhận thiết bị đang hỏng trước.",
      );
      return false;
    }

    const newRecord = {
      ...maintenanceData,
      id: `maint-${Date.now()}`,
    };

    const updatedDevices = latestData.devices.map((item) =>
      item.id === maintenanceData.deviceId &&
      maintenanceData.status === "in_progress"
        ? {
            ...item,
            status: "maintenance",
            userId: null,
            departmentId: null,
            location: "Khu vực bảo trì",
          }
        : item,
    );

    return updateData({
      ...latestData,
      devices: updatedDevices,
      maintenance: [newRecord, ...latestData.maintenance],
    });
  };

  const handleStartMaintenance = (maintenanceItem) => {
    const currentItem = data.maintenance.find(
      (item) => item.id === maintenanceItem.id,
    );
    const device = data.devices.find(
      (item) => item.id === maintenanceItem.deviceId,
    );
    const hasActiveHandover = data.handovers.some(
      (item) =>
        item.deviceId === maintenanceItem.deviceId && item.status === "active",
    );
    if (
      !currentItem ||
      currentItem.status !== "scheduled" ||
      !device ||
      !["available", "broken"].includes(device.status) ||
      hasActiveHandover
    ) {
      window.alert(
        "Chưa thể bắt đầu: hãy thu hồi thiết bị đang được giữ trước. Chỉ thiết bị đã ở kho hoặc ghi nhận hỏng mới vào bảo trì được.",
      );
      return;
    }

    updateData({
      ...data,
      maintenance: data.maintenance.map((item) =>
        item.id === currentItem.id ? { ...item, status: "in_progress" } : item,
      ),
      devices: data.devices.map((item) =>
        item.id === device.id
          ? {
              ...item,
              status: "maintenance",
              userId: null,
              departmentId: null,
              location: "Khu vực bảo trì",
            }
          : item,
      ),
    });
  };

  const handleCompleteMaintenance = (maintenanceItem) => {
    const currentItem = data.maintenance.find(
      (item) => item.id === maintenanceItem.id,
    );
    const targetDev = data.devices.find(
      (item) => item.id === maintenanceItem.deviceId,
    );
    if (
      !currentItem ||
      currentItem.status !== "in_progress" ||
      !targetDev ||
      targetDev.status !== "maintenance"
    ) {
      window.alert(
        "Chỉ có thể nghiệm thu phiếu đang xử lý và thiết bị đang ở khu vực bảo trì.",
      );
      return;
    }
    const completeDate = new Date().toISOString().split("T")[0];
    const costInput = window.prompt(
      "Xác nhận nghiệm thu bảo trì xong. Nhập chi phí thực tế (VNĐ):",
      String(maintenanceItem.cost || 0),
    );
    if (costInput === null) return;

    const actualCost = Number(costInput) || 0;

    const updatedMaintenance = data.maintenance.map((m) => {
      if (m.id === currentItem.id) {
        return {
          ...m,
          status: "completed",
          cost: actualCost,
          completedDate: completeDate,
        };
      }
      return m;
    });

    // A successfully repaired asset returns to the IT stock, ready for a new handover.
    const updatedDevices = data.devices.map((d) => {
      if (d.id === maintenanceItem.deviceId) {
        return {
          ...d,
          status: "available",
          userId: null,
          departmentId: null,
          location: "Kho IT",
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

  const handleUpdateAuditItem = (auditId, deviceId, patch) => {
    const updatedAudits = data.audits.map((a) => {
      if (a.id === auditId) {
        const existingRecords = [...(a.records || [])];
        const recordIndex = existingRecords.findIndex(
          (r) => r.deviceId === deviceId,
        );
        const previous = recordIndex >= 0 ? existingRecords[recordIndex] : {};
        const next = { ...previous, ...patch, deviceId };
        if (recordIndex >= 0) existingRecords[recordIndex] = next;
        else existingRecords.push(next);

        const matchedCount = existingRecords.filter(
          (r) => r.status === "confirmed",
        ).length;
        const discrepancyCount = existingRecords.filter(
          (r) => r.status === "discrepancy",
        ).length;
        const totalChecked = existingRecords.filter((r) =>
          ["found", "confirmed", "discrepancy"].includes(r.status),
        ).length;

        return {
          ...a,
          records: existingRecords,
          totalChecked,
          matchedCount,
          discrepancyCount,
        };
      }
      return a;
    });

    return updateData({ ...data, audits: updatedAudits });
  };

  const handleFinishAudit = (auditId) => {
    const audit = data.audits.find((item) => item.id === auditId);
    if (!audit || audit.status === "completed") return;
    const existingIds = new Set(
      (audit.records || []).map((record) => record.deviceId),
    );
    const unverified = data.devices.filter(
      (device) => !existingIds.has(device.id),
    );
    const message = unverified.length
      ? `Chốt đợt kiểm kê? ${unverified.length} tài sản chưa được quét sẽ chuyển thành “Chưa xác minh” để rà soát sau.`
      : "Bạn có chắc muốn chốt đợt kiểm kê này thành trạng thái Đã Hoàn Thành?";
    if (window.confirm(message)) {
      const updatedAudits = data.audits.map((a) => {
        if (a.id !== auditId) return a;
        const records = [
          ...(a.records || []),
          ...unverified.map((device) => ({
            deviceId: device.id,
            status: "unverified",
          })),
        ];
        return {
          ...a,
          status: "completed",
          records,
          totalChecked: records.filter((record) =>
            ["found", "confirmed", "discrepancy"].includes(record.status),
          ).length,
          matchedCount: records.filter(
            (record) =>
              record.status === "confirmed" || record.status === "matched",
          ).length,
          discrepancyCount: records.filter(
            (record) => record.status === "discrepancy",
          ).length,
        };
      });
      updateData({ ...data, audits: updatedAudits });
    }
  };

  // --- Handlers for Users ---
  const handleSaveUser = (userData) => {
    let updatedUsers;
    if (userModal.editItem) {
      updatedUsers = data.users.map((u) =>
        u.id === userModal.editItem.id ? { ...u, ...userData } : u,
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
    if (window.confirm("Khôi phục toàn bộ CSDL về dữ liệu mẫu mặc định?")) {
      try {
        const fresh = await resetToSampleData();
        setData(fresh);
        setDatabaseError("");
        alert("Đã thiết lập lại dữ liệu thành công!");
      } catch (error) {
        setDatabaseError(error.message);
        alert(`Không thể khôi phục dữ liệu: ${error.message}`);
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (!authUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        setupRequired={authSetupRequired}
        connectionError={databaseError}
      />
    );
  }

  if (isLoading || (databaseError && !isBackendConnected)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {isLoading
              ? "Đang kết nối database…"
              : "Không thể kết nối database"}
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {isLoading ? "Đang tải dữ liệu từ backend." : databaseError}
          </p>
          {!isLoading && (
            <p className="mt-2 text-sm text-slate-500">
              Hãy chạy backend bằng <code>npm run server</code>, sau đó tải lại
              trang. Ứng dụng không dùng dữ liệu mẫu khi database không khả
              dụng.
            </p>
          )}
          {!isLoading && (
            <button
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compute counts for sidebar
  const activeHandoversCount = data.handovers.filter(
    (h) => h.status === "active",
  ).length;
  const inMaintenanceCount = data.maintenance.filter(
    (m) => m.status === "in_progress",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNewDevice={() => setDeviceModal({ open: true, editItem: null })}
        onOpenNewHandover={() =>
          setHandoverModal({ open: true, preselectedDevice: null })
        }
        onDataRefresh={handleRefresh}
        onResetData={handleResetData}
        devices={data.devices}
        users={data.users}
        departments={data.departments}
        handovers={data.handovers}
        maintenance={data.maintenance}
      />

      {/* Main Layout Body */}
      <div className="flex-1 max-w-[1800px] w-full mx-auto flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          devicesCount={data.devices.length}
          activeHandoversCount={activeHandoversCount}
          inMaintenanceCount={inMaintenanceCount}
          isBackendConnected={isBackendConnected}
          currentUser={authUser}
          onLogout={handleLogout}
          onChangePassword={() => setIsPasswordModalOpen(true)}
        />

        {/* Center Content Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-8">
          {activeTab === "dashboard" && (
            <Dashboard
              devices={data.devices}
              users={data.users}
              departments={data.departments}
              handovers={data.handovers}
              maintenance={data.maintenance}
              setActiveTab={setActiveTab}
              onOpenDeviceDetail={(dev) =>
                setDetailModal({ open: true, device: dev })
              }
            />
          )}

          {activeTab === "devices" && (
            <DeviceManagement
              devices={data.devices}
              maintenance={data.maintenance}
              users={data.users}
              departments={data.departments}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenNewDevice={() =>
                setDeviceModal({ open: true, editItem: null })
              }
              onEditDevice={(dev) =>
                setDeviceModal({ open: true, editItem: dev })
              }
              onDeleteDevice={handleDeleteDevice}
              onOpenDeviceDetail={(dev) =>
                setDetailModal({ open: true, device: dev })
              }
              onHandoverDevice={(dev) =>
                setHandoverModal({ open: true, preselectedDevice: dev })
              }
              onMaintainDevice={(dev) =>
                setMaintenanceModal({ open: true, preselectedDevice: dev })
              }
            />
          )}

          {activeTab === "users" && (
            <UserDepartmentManagement
              users={data.users}
              departments={data.departments}
              devices={data.devices}
              handovers={data.handovers}
              onOpenNewUser={() => setUserModal({ open: true, editItem: null })}
              onEditUser={(u) => setUserModal({ open: true, editItem: u })}
              onDeleteUser={handleDeleteUser}
              onOpenDeviceDetail={(dev) =>
                setDetailModal({ open: true, device: dev })
              }
            />
          )}

          {activeTab === "handovers" && (
            <HandoverManagement
              handovers={data.handovers}
              devices={data.devices}
              users={data.users}
              departments={data.departments}
              onOpenNewHandover={() =>
                setHandoverModal({ open: true, preselectedDevice: null })
              }
              onReturnDevice={(h) =>
                setReturnModal({ open: true, handover: h })
              }
              onPrintVoucher={(h) => setPrintModal({ open: true, handover: h })}
            />
          )}

          {activeTab === "maintenance" && (
            <MaintenanceManagement
              maintenance={data.maintenance}
              devices={data.devices}
              onOpenNewMaintenance={() =>
                setMaintenanceModal({ open: true, preselectedDevice: null })
              }
              onCompleteMaintenance={handleCompleteMaintenance}
              onStartMaintenance={handleStartMaintenance}
            />
          )}

          {activeTab === "audits" && (
            <AuditManagement
              audits={data.audits}
              devices={data.devices}
              users={data.users}
              departments={data.departments}
              currentUser={authUser}
              onOpenNewAudit={() => setAuditModal({ open: true })}
              onUpdateAuditItem={handleUpdateAuditItem}
              onFinishAudit={handleFinishAudit}
            />
          )}

          {activeTab === "reports" && (
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
        onHandover={(dev) =>
          setHandoverModal({ open: true, preselectedDevice: dev })
        }
        onMaintain={(dev) =>
          setMaintenanceModal({ open: true, preselectedDevice: dev })
        }
        onLiquidate={handleLiquidateDevice}
      />

      <HandoverModal
        isOpen={handoverModal.open}
        onClose={() =>
          setHandoverModal({ open: false, preselectedDevice: null })
        }
        onSave={handleSaveHandover}
        preselectedDevice={handoverModal.preselectedDevice}
        devices={data.devices}
        users={data.users}
        departments={data.departments}
        maintenance={data.maintenance}
      />

      <ReturnModal
        isOpen={returnModal.open}
        onClose={() => setReturnModal({ open: false, handover: null })}
        handover={returnModal.handover}
        device={data.devices.find(
          (d) => d.id === returnModal.handover?.deviceId,
        )}
        user={data.users.find((u) => u.id === returnModal.handover?.userId)}
        onConfirmReturn={handleConfirmReturn}
      />

      <MaintenanceModal
        isOpen={maintenanceModal.open}
        onClose={() =>
          setMaintenanceModal({ open: false, preselectedDevice: null })
        }
        onSave={handleSaveMaintenance}
        preselectedDevice={maintenanceModal.preselectedDevice}
        devices={data.devices}
        maintenance={data.maintenance}
        handovers={data.handovers}
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
        users={data.users}
      />

      <PrintVoucherModal
        isOpen={printModal.open}
        onClose={() => setPrintModal({ open: false, handover: null })}
        handover={printModal.handover}
        device={data.devices.find(
          (d) => d.id === printModal.handover?.deviceId,
        )}
        user={data.users.find((u) => u.id === printModal.handover?.userId)}
        department={data.departments.find(
          (dep) => dep.id === printModal.handover?.departmentId,
        )}
      />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleChangePassword}
      />
    </div>
  );
}
