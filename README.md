# 🖥️ IT AssetMaster - Hệ Thống Quản Lý Thiết Bị IT & Tài Sản Doanh Nghiệp

Hệ thống quản lý thiết bị và tài sản công nghệ thông tin toàn diện, thiết kế theo phong cách hiện đại (Vibe UI), hỗ trợ đầy đủ các nghiệp vụ quản trị IT cho doanh nghiệp.

---

## 🌟 Tính năng nổi bật theo yêu cầu

### 1. 🖥️ Quản lý thiết bị (IT Asset Management)
- **Danh mục thiết bị:** Máy tính xách tay (Laptop), Máy tính bàn (PC), Màn hình hiển thị, Máy chủ (Server), Thiết bị mạng (Switch/Router/AP), Máy in, Phụ kiện IT.
- **Hồ sơ thiết bị chi tiết:** Mã tài sản (`TS-xxx`), Số Serial (S/N), Hãng sản xuất, Model, Cấu hình phần cứng (CPU, RAM, SSD...), Nguyên giá mua, Ngày mua, Hạn bảo hành, Vị trí lưu kho/bàn làm việc.
- **Trạng thái vòng đời thiết bị:** Sẵn sàng cấp phát, Đang sử dụng, Đang cho mượn, Đang bảo dưỡng/sửa chữa, Hỏng hóc chờ xử lý, Đã thanh lý.
- **Bộ lọc & Tìm kiếm đa năng:** Lọc theo chủng loại, trạng thái, phòng ban; Tìm kiếm tức thì theo mã tài sản, tên, cấu hình, số serial.
- **Chế độ xem linh hoạt:** Chuyển đổi mượt mà giữa **Dạng Bảng (Table)** chi tiết và **Dạng Thẻ (Grid)** trực quan.
- **Tem nhãn tài sản & Mã vạch:** Hỗ trợ xem trước và in tem tài sản (Barcode asset sticker) dán máy.

### 2. 👥 Quản lý người dùng & phòng ban
- **Quản lý nhân viên:** Mã NV, Họ tên, Chức vụ, Email, Số điện thoại, Ảnh đại diện, Phòng ban.
- **Theo dõi tài sản người dùng:** Hiển thị trực quan danh sách thiết bị từng nhân sự đang nắm giữ kèm tổng giá trị.
- **Quản lý phòng ban:** Ban Giám Đốc, IT & Kỹ thuật, R&D Sản phẩm, Kinh doanh, Marketing, Kế toán, Nhân sự... Thống kê số lượng máy tính và tổng giá trị tài sản từng bộ phận.

### 3. 📦 Quản lý bàn giao & mượn trả
- **Tạo phiếu bàn giao chính thức (Dài hạn):** Cấp phát máy cho nhân viên làm việc kèm tình trạng lúc giao.
- **Tạo phiếu cho mượn (Ngắn hạn):** Phục vụ sự kiện, đi công tác; theo dõi **Hạn hoàn trả dự kiến** và tự động cảnh báo phiếu quá hạn.
- **Thu hồi / Nhận trả thiết bị:** Ghi nhận ngày trả thực tế, kiểm tra tình trạng máy và tự động cập nhật thiết bị trở lại kho sẵn sàng cấp phát.
- **In Biên bản bàn giao chuẩn A4:** Mẫu biên bản hành chính chuẩn có Quốc hiệu, tiêu ngữ, bảng thông số thiết bị và chữ ký 3 bên (Người giao, Người nhận, Trưởng phòng IT).

### 4. 🔧 Quản lý bảo trì & sửa chữa
- **Lập phiếu bảo trì:** Ghi nhận hiện trạng hư hỏng, phương án khắc phục, kỹ thuật viên hoặc trung tâm bảo hành hãng (Dell, Apple, LG...).
- **Theo dõi chi phí:** Thống kê tổng ngân sách chi cho sửa chữa/thay thế linh kiện.
- **Tiến trình:** Đã lên lịch bảo trì định kỳ, Đang xử lý, Nghiệm thu hoàn tất đưa thiết bị hoạt động trở lại.

### 5. 📋 Kiểm kê tài sản (Asset Audit)
- **Tạo các đợt kiểm kê:** Theo Quý (Q1, Q2, Q3, Q4) hoặc kiểm kê định kỳ cuối năm.
- **Đối chiếu thực tế với hệ thống:** Quét mã vạch / Serial nhanh bằng đầu đọc barcode.
- **Ghi nhận trạng thái:** Đánh dấu Khớp thực tế, Lệch vị trí / Cần kiểm tra, Thiếu / Thất lạc.
- **Xuất biên bản kiểm kê:** Xuất dữ liệu đối chiếu ra file Excel.

### 6. 📊 Báo cáo & Xuất dữ liệu
- **Dashboard trực quan:** Biểu đồ cơ cấu thiết bị (Bar Chart), tỷ lệ trạng thái sử dụng (Donut Chart), biểu đồ phân bổ theo phòng ban (Recharts).
- **Xuất file Excel (.xlsx):** Xuất toàn bộ danh sách thiết bị, lịch sử mượn trả, kết quả kiểm kê tài sản.
- **Sao lưu & Khôi phục (Backup & Restore):** Sao lưu toàn bộ cơ sở dữ liệu thành file `.json` và khôi phục an toàn, hoạt động offline mượt mà.
- **Khôi phục dữ liệu Demo:** Nút một chạm để đưa dữ liệu về bộ mẫu chuẩn ban đầu.

---

## 🚀 Hướng dẫn khởi chạy ứng dụng

### Cách 1: Chạy bằng file `start.bat`
Click đúp chuột vào file `start.bat` trong thư mục này.

### Cách 2: Chạy bằng Terminal
```bash
# Cài đặt thư viện (nếu chưa cài)
npm install

# Khởi chạy server phát triển
npm run dev
```

Mở trình duyệt và truy cập: **`http://localhost:5173`**
