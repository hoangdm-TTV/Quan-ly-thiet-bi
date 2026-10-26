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
import { DepartmentModal } from "./components/modals/DepartmentModal";
import { UserModal } from "./components/modals/UserModal";
import { PrintVoucherModal } from "./components/modals/PrintVoucherModal";
import { LoginPage } from "./components/LoginPage";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { getLocalDateInputValue } from "./utils/formatters";

import {
  changePassword,
  createAudit,
  deleteAudit,
  fetchInitialData,
  finishAuditRequest,
  getAuthStatus,
  getCurrentUser,
  login,
  logout,
  saveAuditRecord,
  saveStoredData,
  updateAudit,
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
  const [auditModal, setAuditModal] = useState({ open: false, editItem: null });
  const [departmentModal, setDepartmentModal] = useState({ open: false, editItem: null });
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

    const today = getLocalDateInputValue();
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
    if (maintenanceData.status !== "scheduled") {
      window.alert(
        "Phiếu mới chỉ được tạo ở trạng thái đã lên lịch. Hãy dùng nút Bắt đầu xử lý khi thiết bị thực sự được tiếp nhận.",
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
    const hasOpenMaintenance = latestData.maintenance.some(
      (item) =>
        item.deviceId === maintenanceData.deviceId &&
        ["scheduled", "in_progress"].includes(item.status),
    );
    const canSchedule =
      device &&
      ["available", "in_use", "borrowed", "broken"].includes(device.status);
    if (!canSchedule || hasOpenMaintenance) {
      window.alert(
        "Không thể tạo lịch: thiết bị không còn phù hợp hoặc đã có phiếu bảo trì đang mở. Hãy tải lại danh sách và kiểm tra phiếu hiện có.",
      );
      return false;
    }

    const newRecord = {
      ...maintenanceData,
      id: `maint-${Date.now()}`,
    };

    return updateData({
      ...latestData,
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
    const completeDate = getLocalDateInputValue();
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
  const applyAudit = (audit) =>
    setData((current) => ({
      ...current,
      audits: current.audits.some((item) => item.id === audit.id)
        ? current.audits.map((item) => (item.id === audit.id ? audit : item))
        : [audit, ...current.audits],
    }));

  const handleSaveAudit = async (auditData) => {
    try {
      if (auditModal.editItem) {
        applyAudit(await updateAudit(auditModal.editItem.id, auditData));
      } else {
        applyAudit(await createAudit({ ...auditData, id: `audit-${Date.now()}` }));
      }
      setAuditModal({ open: false, editItem: null });
      return true;
    } catch (error) {
      window.alert(`Không thể ${auditModal.editItem ? "sửa" : "tạo"} đợt kiểm kê: ${error.message}`);
      return false;
    }
  };

  const handleDeleteAudit = async (audit) => {
    if (!audit || audit.status === "completed") {
      window.alert("Đợt kiểm kê đã chốt nên không thể xóa.");
      return;
    }
    const recordCount = (audit.records || []).length;
    const warning = recordCount
      ? `Đợt ${audit.code} đã có ${recordCount} kết quả. Xóa sẽ xóa cả kết quả kiểm kê, bạn có chắc không?`
      : `Bạn có chắc muốn xóa đợt kiểm kê ${audit.code}?`;
    if (!window.confirm(warning)) return;
    try {
      await deleteAudit(audit.id);
      setData((current) => ({ ...current, audits: current.audits.filter((item) => item.id !== audit.id) }));
    } catch (error) {
      window.alert(`Không thể xóa đợt kiểm kê: ${error.message}`);
    }
  };

  const handleUpdateAuditItem = async (auditId, deviceId, patch) => {
    const audit = data.audits.find((item) => item.id === auditId);
    const previous =
      audit?.records?.find((record) => record.deviceId === deviceId) || {};
    try {
      applyAudit(
        await saveAuditRecord(auditId, deviceId, {
          ...previous,
          ...patch,
          deviceId,
        }),
      );
      return true;
    } catch (error) {
      window.alert(`Không thể lưu kết quả kiểm kê: ${error.message}`);
      return false;
    }
  };

  const handleFinishAudit = async (auditId) => {
    const audit = data.audits.find((item) => item.id === auditId);
    if (!audit || audit.status === "completed") return;
    const existingIds = new Set(
      (audit.records || []).map((record) => record.deviceId),
    );
    const unverifiedCount = data.devices.filter(
      (device) => !existingIds.has(device.id),
    ).length;
    const message = unverifiedCount
      ? `Chốt đợt kiểm kê? ${unverifiedCount} tài sản chưa được quét sẽ chuyển thành “Chưa xác minh” để rà soát sau.`
      : "Bạn có chắc muốn chốt đợt kiểm kê này thành trạng thái Đã Hoàn Thành?";
    if (!window.confirm(message)) return;
    try {
      applyAudit(await finishAuditRequest(auditId));
    } catch (error) {
      window.alert(`Không thể chốt đợt kiểm kê: ${error.message}`);
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

  // --- Handlers for Departments ---
  const handleSaveDepartment = (departmentData) => {
    const updatedDepartments = departmentModal.editItem
      ? data.departments.map((department) =>
          department.id === departmentModal.editItem.id
            ? { ...department, ...departmentData }
            : department,
        )
      : [{ ...departmentData, id: `dept-${Date.now()}` }, ...data.departments];
    updateData({ ...data, departments: updatedDepartments });
  };

  const handleDeleteDepartment = (department) => {
    const linkedUsers = data.users.filter((user) => user.departmentId === department.id).length;
    const linkedDevices = data.devices.filter((device) => device.departmentId === department.id).length;
    const linkedHandovers = data.handovers.filter((handover) => handover.departmentId === department.id).length;
    if (linkedUsers || linkedDevices || linkedHandovers) {
      window.alert(`Không thể xóa ${department.name} vì đang liên kết với ${linkedUsers} nhân sự, ${linkedDevices} thiết bị và ${linkedHandovers} phiếu bàn giao. Hãy chuyển các dữ liệu liên quan sang phòng ban khác trước.`);
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa phòng ban "${department.name}"?`)) return;
    updateData({
      ...data,
      departments: data.departments.filter((item) => item.id !== department.id),
    });
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
            {isLoading ? "Đang tải dữ liệu từ Cloudflare D1." : databaseError}
          </p>
          {!isLoading && (
            <p className="mt-2 text-sm text-slate-500">
              Hãy chạy lại <code>npm run dev</code> để khởi động Pages Functions
              local, sau đó tải lại trang. Ứng dụng không dùng dữ liệu mẫu khi
              database không khả dụng.
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
    <div className="flex min-h-screen flex-col bg-slate-100/80">
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
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
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
              onOpenNewDepartment={() => setDepartmentModal({ open: true, editItem: null })}
              onEditDepartment={(department) => setDepartmentModal({ open: true, editItem: department })}
              onDeleteDepartment={handleDeleteDepartment}
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
              handovers={data.handovers}
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
              onOpenNewAudit={() => setAuditModal({ open: true, editItem: null })}
              onEditAudit={(audit) => setAuditModal({ open: true, editItem: audit })}
              onDeleteAudit={handleDeleteAudit}
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
        devices={data.devices}
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
        handovers={data.handovers}
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
      />

      <AuditModal
        isOpen={auditModal.open}
        onClose={() => setAuditModal({ open: false, editItem: null })}
        onSave={handleSaveAudit}
        auditToEdit={auditModal.editItem}
        audits={data.audits}
      />

      <DepartmentModal
        isOpen={departmentModal.open}
        onClose={() => setDepartmentModal({ open: false, editItem: null })}
        onSave={handleSaveDepartment}
        departmentToEdit={departmentModal.editItem}
        departments={data.departments}
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
