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


## PostgreSQL: thiết kế bảng và kết nối backend

Backend hiện kết nối PostgreSQL qua thư viện `pg`; API `/api/data` vẫn giữ cấu trúc tương thích với frontend. Schema được tạo từ `server/schema.sql`, dữ liệu demo/JSON cũ không tự ghi đè lên database đã có dữ liệu.

### Mô hình quan hệ

- `departments` — phòng ban; khóa chính `id`, mã `code` duy nhất.
- `users` — nhân sự; `department_id` tham chiếu `departments.id`.
- `devices` — thiết bị; `user_id` tham chiếu người đang giữ, `department_id` tham chiếu đơn vị quản lý. `code` duy nhất; trạng thái và giá trị mua có ràng buộc kiểm tra.
- `handovers` — phiếu bàn giao/mượn trả; liên kết thiết bị, người nhận, phòng ban và người bàn giao.
- `maintenance` — lịch sử bảo trì; liên kết thiết bị, lưu trạng thái, ngày và chi phí.
- `audits` — đợt kiểm kê; `audit_records` là từng dòng thiết bị trong đợt, khóa chính ghép `(audit_id, device_id)`.
- `app_metadata` — metadata hệ thống như lần cập nhật gần nhất.

Các bảng chính dùng ID dạng text để giữ tương thích ID hiện có (`dev-1`, `user-1`, ...). Khóa ngoại giúp PostgreSQL ngăn bản ghi tham chiếu đến phòng ban, nhân sự hoặc thiết bị không tồn tại. Các chỉ mục hỗ trợ lọc thiết bị theo trạng thái/phòng ban, phiếu theo hạn trả và bảo trì theo thiết bị.

### Thiết lập local

1. Cài PostgreSQL và bảo đảm dịch vụ đang chạy.
2. Tạo database rỗng, ví dụ bằng `psql`:

   ```sql
   CREATE DATABASE it_assetmaster;
   ```

3. Tạo file `.env` từ `.env.example`, rồi điền đúng tên người dùng/mật khẩu PostgreSQL. Ví dụ:

   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/it_assetmaster
   PGSSL=false
   PORT=5000
   ```

   Không commit file `.env` lên Git; file này đã được thêm vào `.gitignore`.

4. **Để giữ dữ liệu đang có**, chạy một lần:

   ```bash
   npm.cmd run db:import-json
   ```

   Lệnh này đọc `data/database.json`, tạo bảng nếu cần và nhập các bản ghi trong một transaction. Lệnh từ chối chạy nếu PostgreSQL đã có dữ liệu; nó sẽ không ghi đè database không trống. Giữ nguyên file JSON làm bản sao lưu cho đến khi kiểm tra dữ liệu PostgreSQL.

5. Chạy backend và frontend ở hai terminal (hoặc dùng `start.bat` sau khi `.env` đã cấu hình):

   ```bash
   npm.cmd run server
   npm.cmd run dev -- --host
   ```

6. Mở `http://localhost:5173`. Có thể kiểm tra API tại `http://localhost:5000/api/health`.

Khi backend nhận thao tác lưu, toàn bộ snapshot hiện tại được ghi trong một transaction PostgreSQL; nếu một bản ghi vi phạm ràng buộc, transaction rollback để tránh lưu dữ liệu dở dang. Với nhiều người dùng đồng thời, bước tiếp theo nên thay endpoint snapshot bằng API CRUD theo từng bản ghi để tránh hai thao tác ghi toàn bộ dữ liệu đè lên nhau.


**Lưu ý dữ liệu hiện tại:** kiểm tra `data/database.json` cho thấy thiết bị và phiếu đang tham chiếu một số ID nhân sự không còn trong danh sách `users` (ví dụ các ID cũ dạng `user-1`, trong khi danh sách hiện có ID khác). Trước khi import, script sẽ cảnh báo ID và số liên kết bị ảnh hưởng; để thỏa mãn khóa ngoại, các tham chiếu nhân sự/phòng ban không tồn tại sẽ được đặt thành `NULL`. Các thiết bị, phiếu và nội dung khác vẫn được nhập; file JSON gốc không bị sửa. Sau import, cần đối chiếu các tài sản/phiếu đó và gán lại nhân sự đúng trong giao diện.
