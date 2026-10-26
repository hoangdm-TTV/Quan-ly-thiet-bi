import React from "react";
import {
  Laptop,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Clock,
  Coins,
  Calendar,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  formatCurrency,
  formatDate,
  getLocalDateInputValue,
  getLocalDateOffsetValue,
} from "../utils/formatters";
import { CATEGORIES, STATUS_MAP } from "../data/assetMetadata";

export const Dashboard = ({
  devices,
  users,
  departments,
  handovers,
  maintenance,
  setActiveTab,
  onOpenDeviceDetail,
}) => {
  // 1. Metric calculations
  const totalDevices = devices.length;
  const inUseDevices = devices.filter((d) => d.status === "in_use").length;
  const availableDevices = devices.filter(
    (d) => d.status === "available",
  ).length;
  const inMaintenanceDevices = devices.filter(
    (d) => d.status === "maintenance",
  ).length;
  const borrowedDevices = devices.filter((d) => d.status === "borrowed").length;
  const brokenDevices = devices.filter((d) => d.status === "broken").length;

  const totalAssetValue = devices.reduce(
    (sum, d) => sum + (Number(d.purchaseCost) || 0),
    0,
  );
  const totalMaintenanceCost = maintenance.reduce(
    (sum, m) => sum + (Number(m.cost) || 0),
    0,
  );

  // 2. Chart data - By Category
  const categoryCounts = CATEGORIES.map((cat) => {
    const count = devices.filter((d) => d.category === cat.id).length;
    return {
      name: cat.name.split("/")[0].trim(),
      count,
    };
  }).filter((c) => c.count > 0);

  // 3. Chart data - By Status
  const STATUS_COLORS = {
    in_use: "#3b82f6",
    available: "#10b981",
    borrowed: "#f59e0b",
    maintenance: "#f97316",
    broken: "#ef4444",
    liquidated: "#94a3b8",
  };

  const statusData = Object.entries(STATUS_MAP)
    .map(([statusKey, meta]) => {
      const count = devices.filter((d) => d.status === statusKey).length;
      return {
        name: meta.label,
        value: count,
        color: STATUS_COLORS[statusKey] || "#64748b",
      };
    })
    .filter((item) => item.value > 0);

  // 4. Chart data - By Department
  const deptData = departments.map((dept) => {
    const count = devices.filter((d) => d.departmentId === dept.id).length;
    const value = devices
      .filter((d) => d.departmentId === dept.id)
      .reduce((sum, d) => sum + (Number(d.purchaseCost) || 0), 0);
    return {
      name: dept.code,
      fullName: dept.name,
      count,
      value: Math.round(value / 1000000), // Triệu đồng
    };
  });

  // 5. Overdue and urgent items
  const today = getLocalDateInputValue();
  const overdueHandovers = handovers.filter(
    (h) =>
      h.status === "active" &&
      h.type === "borrow" &&
      h.expectedReturnDate &&
      h.expectedReturnDate < today,
  );

  const activeMaintenance = maintenance.filter(
    (m) => m.status === "in_progress",
  );
  const nextSevenDays = getLocalDateOffsetValue(7);
  const scheduledMaintenance = maintenance.filter(
    (item) => item.status === "scheduled" && item.startDate,
  );
  const overdueMaintenance = scheduledMaintenance.filter(
    (item) => item.startDate < today,
  );
  const todayMaintenance = scheduledMaintenance.filter(
    (item) => item.startDate === today,
  );
  const upcomingMaintenance = scheduledMaintenance.filter(
    (item) => item.startDate > today && item.startDate <= nextSevenDays,
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-900 rounded-2xl p-6 text-white shadow-lg shadow-brand-900/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Tổng Quan Hạ Tầng & Thiết Bị IT
            </h2>
            <p className="text-brand-100 text-sm mt-1">
              Kiểm soát tài sản máy tính, thiết bị mạng, theo dõi luân chuyển và
              bảo trì chuẩn xác.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("devices")}
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              Xem toàn bộ thiết bị
            </button>
            <button
              onClick={() => setActiveTab("audits")}
              className="bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold px-4 py-2 rounded-xl shadow transition"
            >
              Kiểm kê tài sản
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Devices */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Tổng thiết bị
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {totalDevices}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Phân loại đầy đủ</span>
          </div>
        </div>

        {/* In Use */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Đang sử dụng
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {inUseDevices}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {totalDevices ? Math.round((inUseDevices / totalDevices) * 100) : 0}
            % tỷ lệ sử dụng
          </div>
        </div>

        {/* Available */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Sẵn sàng cấp
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {availableDevices}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Lưu trữ tại kho IT
          </div>
        </div>

        {/* Borrowed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Đang mượn
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600">
            {borrowedDevices}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Mượn ngắn hạn / Sự kiện
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Đang bảo dưỡng
            </span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-orange-600">
            {inMaintenanceDevices}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tại TTBH hoặc kỹ thuật
          </div>
        </div>

        {/* Total Asset Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Giá trị tài sản
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div
            className="mt-3 text-lg font-bold text-slate-900 truncate"
            title={formatCurrency(totalAssetValue)}
          >
            {formatCurrency(totalAssetValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Nguyên giá đầu tư
          </div>
        </div>
      </div>

      {/* Overdue / Urgent Alert Banner (if any) */}
      {(overdueHandovers.length > 0 || activeMaintenance.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueHandovers.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-amber-900">
                  {overdueHandovers.length} phiếu mượn thiết bị đã quá hạn hoàn
                  trả!
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Vui lòng kiểm tra và gửi yêu cầu thu hồi thiết bị cho nhân
                  viên liên quan.
                </p>
                <button
                  onClick={() => setActiveTab("handovers")}
                  className="mt-2 text-xs font-semibold text-amber-900 underline hover:text-amber-700 flex items-center gap-1"
                >
                  Xem chi tiết phiếu mượn{" "}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeMaintenance.length > 0 && (
            <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200 flex items-start gap-3">
              <Wrench className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-orange-900">
                  {activeMaintenance.length} thiết bị đang trong tiến trình sửa
                  chữa / bảo hành
                </h4>
                <p className="text-xs text-orange-800 mt-0.5">
                  Tổng chi phí bảo dưỡng ghi nhận:{" "}
                  {formatCurrency(totalMaintenanceCost)}
                </p>
                <button
                  onClick={() => setActiveTab("maintenance")}
                  className="mt-2 text-xs font-semibold text-orange-900 underline hover:text-orange-700 flex items-center gap-1"
                >
                  Cập nhật tiến độ bảo trì{" "}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(overdueMaintenance.length > 0 || todayMaintenance.length > 0 || upcomingMaintenance.length > 0) && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                Lịch bảo trì cần theo dõi
              </h3>
              <p className="text-xs text-slate-500 mt-1">Lên lịch chưa làm thay đổi trạng thái thiết bị; chỉ chuyển sang bảo trì khi bắt đầu xử lý.</p>
            </div>
            <button onClick={() => setActiveTab("maintenance")} className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1">
              Mở danh sách phiếu <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {[
              { title: "Quá hạn", items: overdueMaintenance, tone: "text-rose-700 bg-rose-50" },
              { title: "Hôm nay", items: todayMaintenance, tone: "text-amber-700 bg-amber-50" },
              { title: "Trong 7 ngày tới", items: upcomingMaintenance, tone: "text-blue-700 bg-blue-50" },
            ].map((group) => (
              <div key={group.title} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${group.tone}`}>{group.title}</span>
                  <span className="text-xs text-slate-500">{group.items.length} phiếu</span>
                </div>
                {group.items.length === 0 ? (
                  <p className="text-xs text-slate-400">Không có lịch.</p>
                ) : (
                  <ul className="space-y-2">
                    {group.items.slice(0, 4).map((item) => {
                      const device = devices.find((entry) => entry.id === item.deviceId);
                      return (
                        <li key={item.id} className="text-xs">
                          <button onClick={() => setActiveTab("maintenance")} className="text-left w-full hover:text-blue-700">
                            <span className="font-semibold text-slate-800">{item.code}</span>
                            <span className="text-slate-500"> · {device?.code || device?.name || "Thiết bị"}</span>
                            <span className="block text-slate-500 mt-0.5">Hẹn: {formatDate(item.startDate)}</span>
                          </button>
                        </li>
                      );
                    })}
                    {group.items.length > 4 && <li className="text-xs text-slate-500">và {group.items.length - 4} phiếu khác…</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Devices by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Số lượng theo Loại thiết bị
              </h3>
              <p className="text-xs text-slate-500">
                Phân bố cơ cấu phần cứng trong công ty
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryCounts}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val) => [`${val} thiết bị`, "Số lượng"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Breakdown Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Tỷ lệ Trạng thái Thiết bị
              </h3>
              <p className="text-xs text-slate-500">
                Tình trạng vận hành và cấp phát thực tế
              </p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} thiết bị`, name]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Department Distribution */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Tài sản theo Phòng Ban
            </h3>
            <p className="text-xs text-slate-500">
              Số lượng thiết bị đang được các bộ phận nắm giữ
            </p>
          </div>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deptData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(val, name, props) => [
                  `${val} thiết bị (${props.payload.value} Triệu VNĐ)`,
                  props.payload.fullName,
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Handover & Maintenance Activities Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Handovers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 text-sm">
              Giao nhận thiết bị gần đây
            </h4>
            <button
              onClick={() => setActiveTab("handovers")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {handovers.slice(0, 4).map((h) => {
              const dev = devices.find((d) => d.id === h.deviceId);
              const user = users.find((u) => u.id === h.userId);
              return (
                <div
                  key={h.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        h.type === "handover"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {h.type === "handover" ? "BG" : "PM"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {dev ? dev.name : "Thiết bị"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user ? user.name : "Chưa rõ"} •{" "}
                        {formatDate(h.handoverDate)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      h.status === "returned"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {h.status === "returned" ? "Đã hoàn trả" : "Đang giữ"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Maintenance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 text-sm">
              Lịch sử & Kế hoạch bảo trì
            </h4>
            <button
              onClick={() => setActiveTab("maintenance")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {maintenance.slice(0, 4).map((m) => {
              const dev = devices.find((d) => d.id === m.deviceId);
              return (
                <div
                  key={m.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {dev ? `${dev.code} - ${dev.name}` : m.code}
                      </p>
                      <p
                        className="text-[11px] text-slate-500 truncate"
                        title={m.issue}
                      >
                        {m.issue}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      m.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : m.status === "in_progress"
                          ? "bg-orange-50 text-orange-700 border border-orange-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {m.status === "completed"
                      ? "Hoàn thành"
                      : m.status === "in_progress"
                        ? "Đang xử lý"
                        : "Đã lên lịch"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
