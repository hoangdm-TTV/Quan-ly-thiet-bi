# Quick Wins Optimization (Giai Đoạn 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tối ưu hóa tức thì ứng dụng Quản lý thiết bị IT AssetMaster bằng cách tách nhỏ bundle JS (Code splitting, dynamic import `xlsx`), thêm phân trang danh sách (Pagination), và thay thế toàn bộ `window.alert/confirm/prompt` bằng hệ thống Toast và Modal Dialog hiện đại, mượt mà mà không phá vỡ logic cũ.

**Architecture:** 
1. Chuyển thư viện nặng `xlsx` sang dynamic import `await import("xlsx")` trong `storage.js`.
2. Áp dụng `React.lazy` và `Suspense` trong `App.jsx` cho các modal và view nặng: `QRScannerModal`, `PrintVoucherModal`, `Dashboard` (chứa `recharts`).
3. Tạo component `Pagination.jsx` tái sử dụng, tích hợp vào `DeviceManagement.jsx` và `HandoverManagement.jsx`.
4. Xây dựng hệ thống UI Feedback (`FeedbackContext` hoặc custom hook + dialog components) cung cấp `toast` (success, error, info), `confirmDialog`, `promptDialog` thay thế hoàn toàn các hàm popup native của trình duyệt.

**Tech Stack:** React 18, Vite, Tailwind CSS, Lucide icons.

**Spec:** Yêu cầu từ user: Giai đoạn 1: Quick Wins (Tách nhỏ Bundle, Phân trang Client-side, Thay thế window.alert/confirm/prompt).

## Global Constraints
- Không phá vỡ luồng hoạt động hiện tại (không thay đổi API Cloudflare Pages hay cấu trúc dữ liệu snapshot).
- Không tự ý cài đặt package lạ ngoài hệ sinh thái đã có nếu có thể tự dựng component Tailwind gọn nhẹ, an toàn.
- Đảm bảo `npm run build` thành công, kích thước file bundle chính giảm rõ rệt.

## Review Focus
1. Bundle size: Kích thước index chunk chính sau khi build phải giảm từ ~1.5MB xuống dưới 700KB.
2. Dynamic export: Thao tác xuất Excel tại tất cả màn hình (Thiết bị, Bàn giao, Kiểm kê) phải hoạt động trơn tru sau khi dynamic import `xlsx`.
3. Phân trang: Bộ lọc tìm kiếm và phân loại phải reset `currentPage` về 1; chuyển trang hoặc đổi `pageSize` không làm mất bộ lọc.
4. Xác nhận / Nhập liệu: Các thao tác nhạy cảm (Xóa thiết bị, Đổi cấu hình ghi đè, Thanh lý thiết bị với lý do, Nghiệm thu bảo trì với chi phí, Xóa đợt kiểm kê) phải hoạt động chuẩn xác qua Custom Dialog không bị chặn popup bởi trình duyệt.

---

### Task 1: Tách nhỏ Bundle với Dynamic Import `xlsx` & Lazy Loading trong `App.jsx`

**Files:**
- Modify: `src/services/storage.js`
- Modify: `src/App.jsx`
- Verify: `npm run build`

**Interfaces:**
- `storage.js`: `exportDevicesToExcel`, `exportHandoversToExcel`, `exportAuditsToExcel` chuyển thành `async` functions tải dynamic `const XLSX = await import("xlsx");`.
- `App.jsx`: `QRScannerModal`, `PrintVoucherModal`, `Dashboard` được bọc `React.lazy` và `<React.Suspense>`.

- [ ] **Step 1: Cập nhật `src/services/storage.js` sang dynamic import `xlsx`**
  - Xóa `import * as XLSX from "xlsx";` ở đầu file.
  - Tạo helper: `const getXlsx = async () => (await import("xlsx")).default || (await import("xlsx"));`
  - Đổi `exportDevicesToExcel`, `exportHandoversToExcel`, `exportAuditsToExcel` thành async function dùng `getXlsx()`.
  
- [ ] **Step 2: Cập nhật các nơi gọi export trong UI để handle async nếu cần**
  - Kiểm tra `DeviceManagement.jsx`, `HandoverManagement.jsx`, `AuditManagement.jsx`, `ReportManagement.jsx`. Đảm bảo các nút bấm gọi xuất file mượt mà (có thể thêm trạng thái đang xuất file).

- [ ] **Step 3: Cập nhật `App.jsx` áp dụng `React.lazy` và `Suspense`**
  - Lazy load `Dashboard`, `QRScannerModal`, `PrintVoucherModal`.
  - Thêm fallback loading indicator tinh gọn với Tailwind spinner.

- [ ] **Step 4: Chạy `npm run build` và đo lường kích thước bundle**
  - Run: `npm run build`
  - Expected: Build thành công, `index-*.js` giảm từ 1.5MB xuống dưới 700KB, sinh ra các chunk riêng cho `xlsx`, `Dashboard`/`recharts`, `QRScannerModal`/`zxing`.

---

### Task 2: Xây dựng Component Phân Trang và tích hợp vào `DeviceManagement` & `HandoverManagement`

**Files:**
- Create: `src/components/common/Pagination.jsx`
- Modify: `src/components/DeviceManagement.jsx`
- Modify: `src/components/HandoverManagement.jsx`

**Interfaces:**
- `Pagination.jsx`: Props `{ currentPage, totalItems, pageSize, onPageChange, onPageSizeChange, pageSizeOptions }`
- `DeviceManagement.jsx`: Quản lý `currentPage`, `pageSize` (mặc định 20 hoặc 50). Render `paginatedDevices`.
- `HandoverManagement.jsx`: Quản lý `currentPage`, `pageSize` (mặc định 20). Render `paginatedHandovers`.

- [ ] **Step 1: Tạo `src/components/common/Pagination.jsx`**
  - Hiển thị thông tin dải mục hiện tại: `(currentPage - 1) * pageSize + 1` đến `Math.min(currentPage * pageSize, totalItems)` trên `totalItems`.
  - Bộ chọn `pageSize` (10, 20, 50, 100).
  - Nút phân trang: Đầu, Trước, danh sách số trang có ellipsis (`...`), Sau, Cuối.
  - Hỗ trợ responsive trên mobile.

- [ ] **Step 2: Tích hợp Pagination vào `DeviceManagement.jsx`**
  - Thêm state `currentPage` (1) và `pageSize` (20).
  - Thêm `useEffect` reset `currentPage = 1` khi `searchQuery`, `selectedCategory`, `selectedStatus`, `selectedDept` thay đổi.
  - Cắt mảng `filteredDevices.slice((currentPage - 1) * pageSize, currentPage * pageSize)` cho cả bảng (Table) và lưới (Grid).
  - Đặt `<Pagination>` dưới chân danh sách.

- [ ] **Step 3: Tích hợp Pagination vào `HandoverManagement.jsx`**
  - Thêm state `currentPage` (1) và `pageSize` (20).
  - Reset `currentPage = 1` khi thay đổi filter tab hoặc search.
  - Cắt mảng hiển thị và chèn `<Pagination>`.

- [ ] **Step 4: Kiểm tra build và giao diện phân trang**
  - Run: `npm run build`
  - Expected: Build thành công không có lỗi syntax.

---

### Task 3: Xây dựng Hệ thống Toast & Dialog UI thay thế `alert`, `confirm`, `prompt`

**Files:**
- Create: `src/context/FeedbackContext.jsx`
- Create: `src/components/common/ConfirmModal.jsx`
- Create: `src/components/common/PromptModal.jsx`
- Create: `src/components/common/ToastContainer.jsx`
- Modify: `src/App.jsx`
- Modify: Các modal liên quan (`DeviceModal.jsx`, `DepartmentModal.jsx`, `AuditModal.jsx`, `HandoverModal.jsx`, `UserModal.jsx`, `ReturnModal.jsx`, `MaintenanceModal.jsx`).

**Interfaces:**
- `useFeedback()` hook cung cấp:
  - `toast.success(message)`, `toast.error(message)`, `toast.info(message)`, `toast.warning(message)`
  - `confirm({ title, message, confirmText, cancelText, variant = 'danger' | 'primary' }) -> Promise<boolean>`
  - `prompt({ title, message, defaultValue, placeholder, confirmText, cancelText, inputType }) -> Promise<string | null>`

- [ ] **Step 1: Xây dựng `ToastContainer.jsx`, `ConfirmModal.jsx`, `PromptModal.jsx`**
  - Toast: Thiết kế hiện đại dạng popover góc trên/dưới phải, tự tắt sau 3 giây hoặc click nút X, animation mượt.
  - ConfirmModal: Thiết kế dialog modal bo góc đẹp chuẩn Tailwind, icon cảnh báo, nút Hủy và nút Xác nhận.
  - PromptModal: Thiết kế dialog có input/textarea, tự động focus khi mở, hỗ trợ Enter để submit, nút Hủy và Xác nhận.

- [ ] **Step 2: Xây dựng `FeedbackContext.jsx`**
  - Cung cấp Provider bọc ứng dụng và hook `useFeedback()`.
  - Quản lý hàng đợi toast và trạng thái Promise của dialog confirm/prompt.

- [ ] **Step 3: Thay thế `window.alert/confirm/prompt` trong `src/App.jsx`**
  - Thay thế `window.alert` báo lỗi DB/quét QR bằng `toast.error` / `toast.warning`.
  - Thay thế `window.confirm` xóa thiết bị, xóa nhân sự, xóa phòng ban, chốt kiểm kê bằng `confirm({...})`.
  - Thay thế `window.prompt` lý do thanh lý và chi phí nghiệm thu bằng `prompt({...})`.

- [ ] **Step 4: Rà soát và thay thế các `alert/confirm` trong các Modal con**
  - Cập nhật `DeviceModal.jsx`, `DepartmentModal.jsx`, v.v. sử dụng `toast` hoặc `confirm`.

- [ ] **Step 5: Kiểm tra toàn diện và chạy Build**
  - Run: `npm run build`
  - Kiểm tra xem còn sót `window.alert`, `window.confirm`, `window.prompt` nào không.

---

### Task 4: Kiểm thử và Hoàn thiện Giai đoạn 1

**Files:**
- Modify/Verify: Toàn bộ các file đã cập nhật.

- [ ] **Step 1: Chạy build production và kiểm tra kích thước bundle lần cuối**
  - Run: `npm run build`
  - Ghi nhận kích thước các file chunks.

- [ ] **Step 2: Rà soát chức năng**
  - Đảm bảo không có lỗi runtime trên console trình duyệt.
  - Đảm bảo luồng xuất Excel, phân trang, thông báo toast và các modal xác nhận hoạt động mượt mà.
