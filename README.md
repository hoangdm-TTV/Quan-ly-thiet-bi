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

### Cách 1: Chạy bằng file `start.bat` (Windows, khuyến nghị)
Click đúp `start.bat`. File sẽ mở backend và giao diện trong hai cửa sổ terminal riêng. Giữ cả hai cửa sổ mở; nhấn `Ctrl+C` trong từng cửa sổ để dừng dịch vụ.

### Cách 2: Chạy bằng Terminal
```bash
# Cài đặt thư viện (nếu chưa cài)
npm install

# Khởi chạy backend và giao diện trong hai terminal (Terminal 1 và 2)
npm run server
npm run dev -- --host
```

Mở trình duyệt và truy cập: **`http://localhost:5173`**


## PostgreSQL: thiết kế bảng và kết nối backend

Backend hiện kết nối PostgreSQL qua thư viện `pg`; API `/api/data` vẫn giữ cấu trúc tương thích với frontend. Schema được tạo từ `server/schema.sql`. Dữ liệu ứng dụng được lưu trong PostgreSQL; file SQL nạp dữ liệu ban đầu là `server/seed-existing-data.sql`.

### Mô hình quan hệ

- `departments` — phòng ban; khóa chính `id`, mã `code` duy nhất.
- `users` — nhân sự; `department_id` tham chiếu `departments.id`.
- `devices` — thiết bị; `user_id` tham chiếu người đang giữ, `department_id` tham chiếu đơn vị quản lý. `code` duy nhất; trạng thái và giá trị mua có ràng buộc kiểm tra.
- `handovers` — phiếu bàn giao/mượn trả; liên kết thiết bị, người nhận, phòng ban và người bàn giao.
- `maintenance` — lịch sử bảo trì; liên kết thiết bị, lưu trạng thái, ngày và chi phí.
- `audits` — đợt kiểm kê; `audit_records` là từng dòng thiết bị trong đợt, khóa chính ghép `(audit_id, device_id)`.
- `app_metadata` — metadata hệ thống như lần cập nhật gần nhất.

Các bảng chính dùng ID dạng text để giữ tương thích ID hiện có (`dev-1`, `user-1`, ...). Khóa ngoại giúp PostgreSQL ngăn bản ghi tham chiếu đến phòng ban, nhân sự hoặc thiết bị không tồn tại. Các chỉ mục hỗ trợ lọc thiết bị theo trạng thái/phòng ban, phiếu theo hạn trả và bảo trì theo thiết bị.

### Thiết lập PostgreSQL trên Windows

Nếu PostgreSQL chưa được cài, tải bộ cài Windows từ [trang tải chính thức của PostgreSQL](https://www.postgresql.org/download/windows/). Bộ cài Windows do EDB cung cấp gồm PostgreSQL Server và pgAdmin. Trong quá trình cài, hãy nhớ mật khẩu của tài khoản quản trị `postgres` và giữ cổng mặc định `5432`, trừ khi máy bạn đã dùng cổng khác.

Sau khi cài, kiểm tra dịch vụ PostgreSQL đang chạy trong Windows Services. Kiểm tra cổng từ PowerShell:

```powershell
Test-NetConnection 127.0.0.1 -Port 5432
```

Kết quả `TcpTestSucceeded : True` nghĩa là PostgreSQL đang lắng nghe ở cổng đó. Nếu `False`, khởi động dịch vụ PostgreSQL hoặc kiểm tra cổng đã chọn khi cài.

### Cấu hình kết nối ứng dụng

1. Từ thư mục dự án, tạo `.env` từ mẫu:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

2. Sửa `DATABASE_URL` trong `.env` theo thông tin PostgreSQL vừa cài. Ví dụ nếu database tên `it_assetmaster`, tài khoản là `postgres` và mật khẩu là `MyPassword123`:

   ```env
   DATABASE_URL=postgresql://postgres:MyPassword123@127.0.0.1:5432/it_assetmaster
   PGSSL=false
   PGPOOL_MAX=10
   PORT=5000
   AUTH_ADMIN_EMAIL=admin@congty.vn
   AUTH_ADMIN_PASSWORD=mat-khau-rieng-it-nhat-12-ky-tu
   API_HOST=127.0.0.1
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

   Thay các giá trị ví dụ bằng thông tin riêng. Mật khẩu database trong `DATABASE_URL` cần URL-encode ký tự đặc biệt như `@`, `:`, `/`, `#` hoặc `%`; mật khẩu admin không cần URL-encode. Không gửi hoặc commit file `.env`.

3. Tạo database rỗng tên `it_assetmaster` trong pgAdmin, hoặc mở SQL Shell (`psql`) bằng tài khoản quản trị và chạy:

   ```sql
   CREATE DATABASE it_assetmaster;
   ```

   Nếu ứng dụng được dùng lâu dài trong công ty, nên tạo một tài khoản riêng cho ứng dụng và cấp quyền trên database này thay vì dùng tài khoản quản trị `postgres`.

4. Kiểm tra cấu hình kết nối:

   ```powershell
   npm.cmd run db:check
   ```

   Lệnh này không in mật khẩu. Nếu kết nối thành công, nó cho biết tên database, tài khoản và trạng thái schema. Nếu báo lỗi, xem mục xử lý sự cố bên dưới.

5. Để nạp dữ liệu khởi tạo từ file SQL vào database trống, chạy một lần:

   ```powershell
   npm.cmd run db:seed
   ```

   Backend tự tạo bảng khi khởi động. Lệnh `db:seed` chỉ nạp `server/seed-existing-data.sql` và từ chối chạy nếu database đã có dữ liệu. Bản seed hiện có 7 phòng ban, 3 nhân sự, 14 thiết bị, 5 phiếu bàn giao, 4 phiếu bảo trì, 3 đợt kiểm kê và 25 dòng kiểm kê.

6. Trên Windows, có thể chạy `start.bat` để mở backend và frontend cùng lúc. Hoặc khởi chạy thủ công trong hai cửa sổ terminal:

   ```bash
   npm.cmd run server
   ```

   Khi thấy thông báo `IT ASSETMASTER API RUNNING`, mở terminal thứ hai:

   ```bash
   npm.cmd run dev -- --host
   ```

7. Mở `http://localhost:5173`. Kiểm tra backend tại `http://localhost:5000/api/health`; kết quả thành công có `"status":"ok"`.

   Lần đầu backend khởi động, nó tạo tài khoản admin từ `AUTH_ADMIN_EMAIL` và `AUTH_ADMIN_PASSWORD`, lưu mật khẩu dạng hash trong PostgreSQL, rồi các API dữ liệu yêu cầu đăng nhập. Sau khi log báo đã tạo admin, xóa `AUTH_ADMIN_PASSWORD` khỏi `.env` và khởi động lại backend. Đăng nhập bằng email/mật khẩu đó; có thể đổi mật khẩu ở thanh bên. Mỗi phiên đăng nhập hết hạn sau 12 giờ. Hệ thống hiện dùng một tài khoản admin duy nhất; mọi người dùng tài khoản này đều có quyền sửa dữ liệu.

   Khi triển khai trên domain công ty, đặt `CORS_ORIGINS` thành origin chính xác của website và chỉ mở `API_HOST` ra mạng khi backend được đặt sau HTTPS. Không dùng tài khoản admin chung nếu công ty cần biết chính xác cá nhân nào đã thực hiện từng thay đổi.

### Xử lý sự cố kết nối

- **Thiếu `DATABASE_URL`:** tạo `.env` theo bước 1–2. File `.env.example` chỉ là mẫu và không chứa mật khẩu thật.
- **`ECONNREFUSED`:** dịch vụ PostgreSQL chưa chạy, hoặc host/cổng trong URL sai. Kiểm tra bằng `Test-NetConnection 127.0.0.1 -Port 5432`.
- **`28P01` / password authentication failed:** sai username hoặc mật khẩu; cập nhật `DATABASE_URL`.
- **`3D000` / database does not exist:** tạo database `it_assetmaster` như bước 3.
- **`42501` / permission denied:** cấp quyền cho tài khoản ứng dụng trên database hoặc schema `public`.
- **Trình duyệt hiện HTTP 500:** xem lỗi cụ thể trong terminal đang chạy `npm.cmd run server`; đồng thời mở `http://localhost:5000/api/health` để kiểm tra trạng thái backend và database.
- **Đăng nhập báo HTTP 404 / `Cannot GET /api/auth/status`:** backend đang chạy là tiến trình cũ chưa nạp API xác thực. Dừng đúng terminal backend bằng `Ctrl+C`, chạy lại `npm.cmd run server`, chờ log `IT ASSETMASTER API RUNNING`, rồi tải lại trang. Nếu backend không khởi động, xử lý lỗi PostgreSQL được ghi trong terminal trước.
- Nếu sửa `.env` trong khi server đang chạy, dừng backend bằng `Ctrl+C` rồi chạy lại `npm.cmd run server`.

Khi backend nhận thao tác lưu, toàn bộ snapshot hiện tại được ghi trong một transaction PostgreSQL; nếu một bản ghi vi phạm ràng buộc, transaction rollback để tránh lưu dữ liệu dở dang. Mỗi snapshot mang một phiên bản dữ liệu; nếu người dùng lưu từ phiên bản cũ, backend trả HTTP 409 và yêu cầu tải lại thay vì ghi đè thay đổi mới hơn. Backend cũng kiểm tra thiết bị sẵn sàng trước khi có phiếu đang sử dụng, chặn nhiều phiếu hoạt động cho cùng thiết bị, và yêu cầu khi trả phải đóng đúng phiếu, xóa người giữ/phòng ban, cập nhật trạng thái và vị trí kho tương ứng. Cơ chế này giảm nguy cơ sai nghiệp vụ nhưng chưa thay thế API CRUD theo từng nghiệp vụ.


**Lưu ý dữ liệu khởi tạo:** 18 tham chiếu trong dữ liệu cũ trỏ tới ID nhân sự không còn trong danh sách `users`; các liên kết đó được đặt thành `NULL` trong `server/seed-existing-data.sql` để bảo đảm khóa ngoại. Các liên kết còn lại và toàn bộ bản ghi được giữ lại. Sau khi nạp seed, đối chiếu các thiết bị/phiếu đó và gán lại nhân sự đúng trong giao diện nếu biết người tương ứng.
