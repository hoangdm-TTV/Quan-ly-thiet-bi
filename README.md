# 🖥️ IT AssetMaster - Hệ Thống Quản Lý Thiết Bị IT & Tài Sản Doanh Nghiệp

Ứng dụng web nội bộ quản lý thiết bị và tài sản công nghệ thông tin: hồ sơ thiết bị, bàn giao/mượn trả, bảo trì, kiểm kê bằng QR và báo cáo. Dữ liệu lưu trong PostgreSQL, đăng nhập bằng tài khoản quản trị viên.

**Công nghệ:** React 18, Vite, Tailwind CSS, Recharts (giao diện); Express 5, PostgreSQL (`pg`) (backend).

---

## 🌟 Tính năng

### 1. 🖥️ Quản lý thiết bị

- **Danh mục:** Laptop, PC, Màn hình, Máy chủ, Thiết bị mạng, Máy in, Phụ kiện.
- **Hồ sơ chi tiết:** Mã tài sản (`TS-xxx`, tự sinh tuần tự), Serial, Hãng, Model, Cấu hình, Nguyên giá, Ngày mua, Hạn bảo hành, Vị trí.
- **Vòng đời:** Sẵn sàng cấp phát → Đang sử dụng / Đang cho mượn → Bảo dưỡng/Sửa chữa → Hỏng hóc → Đã thanh lý.
- **Trạng thái, người giữ, phòng ban** chỉ thay đổi qua phiếu bàn giao, thu hồi và bảo trì để giữ đúng lịch sử tài sản (form sửa thiết bị không đổi các trường này).
- **Tìm kiếm & lọc** theo loại, trạng thái, phòng ban, mã, tên, serial, model, vị trí, người dùng; xem dạng bảng hoặc thẻ.
- **Tem QR tài sản:** xem trước và in tem chứa mã tài sản.
- **Không xóa được thiết bị đã có lịch sử** bàn giao, bảo trì hoặc nằm trong biên bản kiểm kê; dùng "Ghi nhận thanh lý" để giữ hồ sơ.

### 2. 👥 Người dùng & phòng ban

- Quản lý nhân viên (mã NV tự sinh, họ tên, chức vụ, email, điện thoại, ảnh đại diện chọn từ máy và tự thu nhỏ trước khi lưu).
- Xem thiết bị từng người đang giữ kèm tổng giá trị; thống kê số người, số thiết bị và giá trị theo phòng ban.

### 3. 📦 Bàn giao & mượn trả

- **Bàn giao chính thức** (dài hạn) và **cho mượn** (ngắn hạn, có hạn trả dự kiến, cảnh báo quá hạn).
- Chỉ bàn giao được thiết bị đang sẵn sàng và không đang sửa chữa; mỗi thiết bị chỉ có một phiếu đang hoạt động.
- **Thu hồi:** ghi ngày trả thực tế, tình trạng khi nhận lại; thiết bị chuyển về kho hoặc sang trạng thái hỏng, đồng thời xóa người giữ/phòng ban. Phiếu đã trả không thể mở lại.
- **In biên bản A4** có quốc hiệu, bảng thiết bị và chữ ký ba bên.
- Mã phiếu tự sinh tuần tự: `BG-năm-001` (bàn giao), `PM-năm-001` (cho mượn).

### 4. 🔧 Bảo trì & sửa chữa

- Phiếu bảo trì đi theo thứ tự: **Đã lên lịch → Đang xử lý → Nghiệm thu hoàn tất**.
- Thiết bị đang được sử dụng chỉ được lên lịch; muốn bắt đầu sửa chữa phải thu hồi và ghi nhận hỏng trước.
- Nghiệm thu nhập chi phí thực tế và đưa thiết bị về kho sẵn sàng cấp phát.
- Thống kê tổng chi phí; mã phiếu `BT-năm-001`.

### 5. 📋 Kiểm kê tài sản

Quy trình hai bước cho mỗi thiết bị:

1. **Tìm thấy:** quét mã QR (camera hoặc ảnh), nhập mã/serial hoặc dùng đầu đọc mã vạch. Bước này chỉ ghi nhận đã thấy máy (`Đã tìm thấy · chờ xác nhận`).
2. **Đối chiếu:** so người giữ, phòng ban, vị trí, trạng thái với dữ liệu hệ thống rồi chọn **Xác nhận đúng** hoặc **Ghi chênh lệch** (chọn mục lệch và giá trị thực tế). Biên bản không tự sửa thông tin gốc của tài sản.

Khi **chốt đợt**, các thiết bị chưa quét chuyển thành `Chưa xác minh`; đợt đã chốt không ghi thêm được. Có thể **xuất biên bản Excel** (kèm chi tiết chênh lệch, thời điểm và người thực hiện).

Mỗi lần quét được ghi **từng dòng** qua API riêng, nên nhiều người quét các thiết bị khác nhau cùng lúc không xung đột.

> **Lưu ý camera:** trình duyệt chỉ cho mở camera trên HTTPS hoặc `localhost`. Khi mở bằng `http://IP-LAN:5173` trên điện thoại, camera trực tiếp thường bị chặn; dùng nút **Chụp / chọn ảnh QR** hoặc nhập mã thay thế.

### 6. 📊 Báo cáo & Xuất dữ liệu

- **Dashboard:** biểu đồ theo loại thiết bị, tỷ lệ trạng thái và phân bổ theo phòng ban; cảnh báo phiếu mượn quá hạn và thiết bị đang sửa.
- **Excel (.xlsx):** danh sách thiết bị, lịch sử bàn giao/mượn trả, kết quả kiểm kê (dùng nhãn tiếng Việt).
- **Sao lưu JSON:** tải toàn bộ dữ liệu để lưu dự phòng. Nên sao lưu định kỳ và trước khi làm thao tác lớn.
- **Khôi phục từ JSON:** nạp lại dữ liệu từ file sao lưu. Thao tác này ghi đè dữ liệu hiện có bằng nội dung file; chỉ dùng khi thật sự cần.

---

## 🚀 Khởi chạy ứng dụng

### Cách 1: `start.bat` (Windows, khuyến nghị)

Click đúp `start.bat`. File mở backend và giao diện trong hai cửa sổ terminal riêng. Giữ cả hai cửa sổ mở; nhấn `Ctrl+C` trong từng cửa sổ để dừng.

### Cách 2: Terminal

```bash
npm install          # lần đầu

# Hai terminal riêng:
npm run server
npm run dev -- --host
```

Mở **`http://localhost:5173`**. Backend kiểm tra tại `http://localhost:5000/api/health`.

### Dùng trên điện thoại hoặc máy khác trong mạng nội bộ

Máy chạy `start.bat` là máy chủ: frontend mở ra mạng nội bộ, còn backend và PostgreSQL chỉ chạy trên máy này. Điện thoại chỉ truy cập frontend, không kết nối trực tiếp tới PostgreSQL.

1. Trong `.env`, đặt `ALLOW_LAN_ORIGINS=true` và `VITE_PORT=5173`. Giữ `API_HOST=127.0.0.1`.
2. Chạy `start.bat` và lấy địa chỉ IPv4 của Wi-Fi/Ethernet (ví dụ `192.168.1.20`).
3. Trên điện thoại cùng Wi-Fi, mở `http://192.168.1.20:5173` và đăng nhập.
4. Nếu không mở được, trên máy chủ chạy PowerShell **quyền Administrator**:

   ```powershell
   New-NetFirewallRule -DisplayName "IT AssetMaster LAN" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -Profile Private
   ```

   Xóa quy tắc: `Remove-NetFirewallRule -DisplayName "IT AssetMaster LAN"`. Không mở cổng `5000` hoặc `5432` ra mạng.

Máy chủ phải bật và ứng dụng phải đang chạy. Nếu IP đổi, dùng IP mới. Chỉ dùng trong mạng công ty tin cậy; không dùng Wi-Fi khách và không chuyển tiếp cổng router ra Internet.

---

## 🗄️ PostgreSQL

Schema tạo từ `server/schema.sql` (backend tự chạy khi khởi động, kèm migration trong `server/migrations/`). Dữ liệu ban đầu nạp bằng `server/seed-existing-data.sql`.

### Mô hình quan hệ

- `departments` — phòng ban; `code` duy nhất.
- `users` — nhân sự; `department_id` → `departments`.
- `devices` — thiết bị; `user_id` (người giữ), `department_id`; `code` duy nhất; trạng thái và giá trị mua có ràng buộc kiểm tra.
- `handovers` — phiếu bàn giao/mượn trả; liên kết thiết bị, người nhận, phòng ban, người bàn giao.
- `maintenance` — lịch sử bảo trì; liên kết thiết bị, trạng thái, ngày, chi phí.
- `audits` — đợt kiểm kê; `audit_records` — từng thiết bị trong đợt, khóa chính `(audit_id, device_id)`, trạng thái `found | confirmed | discrepancy | unverified`, kèm `discrepancies` và `system_snapshot` (JSONB).
- `auth_accounts`, `auth_sessions` — tài khoản và phiên đăng nhập.
- `app_metadata` — phiên bản dữ liệu và thời điểm cập nhật.

ID dạng text để tương thích ID cũ (`dev-1`, `user-1`, ...). Khóa ngoại ngăn tham chiếu tới bản ghi không tồn tại.

### Thiết lập trên Windows

Tải bộ cài từ [trang chính thức của PostgreSQL](https://www.postgresql.org/download/windows/) (gồm PostgreSQL Server và pgAdmin). Nhớ mật khẩu tài khoản `postgres` và giữ cổng `5432`. Kiểm tra cổng:

```powershell
Test-NetConnection 127.0.0.1 -Port 5432
```

`TcpTestSucceeded : True` là PostgreSQL đang chạy; nếu `False`, khởi động dịch vụ PostgreSQL trong Windows Services.

### Cấu hình kết nối

1. Tạo `.env` từ mẫu (đứng ở thư mục có `package.json`):

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

2. Sửa `.env`. Ví dụ với database `it_assetmaster`, tài khoản `postgres`, mật khẩu `MyPassword123`:

   ```env
   DATABASE_URL=postgresql://postgres:MyPassword123@127.0.0.1:5432/it_assetmaster
   PGSSL=false
   PGPOOL_MAX=10
   PORT=5000
   API_HOST=127.0.0.1
   ALLOW_LAN_ORIGINS=true
   VITE_PORT=5173
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   AUTH_ADMIN_EMAIL=admin@congty.vn
   AUTH_ADMIN_PASSWORD=mat-khau-rieng-it-nhat-12-ky-tu
   ```

   Mật khẩu trong `DATABASE_URL` cần URL-encode ký tự đặc biệt (`@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`, `%` → `%25`); mật khẩu admin thì không. Hai dòng `AUTH_ADMIN_*` chỉ cần khi database chưa có tài khoản admin. **Không gửi hoặc commit file `.env`.**

3. Tạo database rỗng trong pgAdmin hoặc `psql`:

   ```sql
   CREATE DATABASE it_assetmaster;
   ```

   Khi dùng lâu dài, nên tạo tài khoản PostgreSQL riêng cho ứng dụng thay vì dùng `postgres`.

4. Kiểm tra kết nối:

   ```powershell
   npm.cmd run db:check
   ```

5. Nạp dữ liệu ban đầu vào database **trống** (chạy một lần):

   ```powershell
   npm.cmd run db:seed
   ```

   Lệnh này từ chối chạy nếu database đã có dữ liệu. Bản seed có 7 phòng ban, 3 nhân sự, 14 thiết bị, 5 phiếu bàn giao, 4 phiếu bảo trì, 3 đợt kiểm kê và 25 dòng kiểm kê. Dữ liệu thử nên nạp vào một database **test riêng**, không nạp vào database đang dùng thật.

6. Khởi chạy bằng `start.bat` hoặc hai terminal như phần trên. Thấy `IT ASSETMASTER API RUNNING` là backend đã sẵn sàng.

### Tài khoản quản trị

Lần đầu backend khởi động, nó tạo admin từ `AUTH_ADMIN_EMAIL` và `AUTH_ADMIN_PASSWORD` (mật khẩu được băm bằng scrypt). Sau khi log báo đã tạo admin, **xóa `AUTH_ADMIN_PASSWORD` khỏi `.env`** và khởi động lại backend. Phiên đăng nhập hết hạn sau 12 giờ; đăng nhập sai quá 5 lần sẽ bị khóa tạm 15 phút. Đổi mật khẩu ở thanh bên (ít nhất 12 ký tự).

Hệ thống hiện chỉ có **một tài khoản admin chung**, mọi người dùng tài khoản này đều có quyền sửa dữ liệu và không phân biệt được ai thực hiện từng thay đổi. Khi triển khai trên domain công ty, đặt `CORS_ORIGINS` đúng origin của website và chỉ mở `API_HOST` ra mạng khi backend nằm sau HTTPS.

### Cơ chế lưu dữ liệu

- **Thiết bị, nhân sự, phòng ban, bàn giao, bảo trì:** giao diện gửi dữ liệu hiện tại kèm số phiên bản. Backend khóa phiên bản, kiểm tra nghiệp vụ rồi chỉ **ghi các dòng thay đổi** và xóa các dòng đã bị loại, tất cả trong một transaction (lỗi thì rollback). Nếu người dùng lưu từ phiên bản cũ, backend trả **HTTP 409** và yêu cầu tải lại thay vì ghi đè thay đổi mới hơn.
- **Kiểm kê:** ghi từng dòng qua API riêng (`/api/audits`), không dùng phiên bản chung nên không gây xung đột 409 khi nhiều người cùng quét.
- **Kiểm tra nghiệp vụ phía server:** chỉ bàn giao máy đang sẵn sàng; một thiết bị chỉ có một phiếu hoạt động; khi trả phải đóng đúng phiếu, xóa người giữ/phòng ban và đặt đúng vị trí kho; không xóa phiếu và lịch sử; bảo trì đúng thứ tự trạng thái.
- **Mã trùng** (mã tài sản, phiếu, nhân viên, đợt kiểm kê) được báo lỗi rõ ràng thay vì lỗi máy chủ.

Các thao tác ở nhóm đầu vẫn gửi toàn bộ danh sách mỗi lần lưu; chuyển sang API riêng cho từng nghiệp vụ là hướng cải tiến tiếp theo.

### Xử lý sự cố

- **Thiếu `DATABASE_URL`:** chưa có file `.env` hoặc đang chạy lệnh sai thư mục. `.env` phải nằm cùng thư mục với `package.json` và tên đúng là `.env` (không phải `.env.txt`).
- **`ECONNREFUSED`:** PostgreSQL chưa chạy hoặc sai host/cổng trong URL.
- **`28P01`:** sai tài khoản hoặc mật khẩu trong `DATABASE_URL`.
- **`3D000`:** database chưa tồn tại; tạo như bước 3.
- **`42501`:** tài khoản chưa đủ quyền trên database hoặc schema `public`.
- **HTTP 500 trên trình duyệt:** xem lỗi trong terminal đang chạy `npm.cmd run server` và mở `http://localhost:5000/api/health`.
- **Đăng nhập báo 404 / `Cannot GET /api/auth/status`:** backend đang chạy là tiến trình cũ. Dừng bằng `Ctrl+C`, chạy lại `npm.cmd run server`, chờ log `IT ASSETMASTER API RUNNING`, rồi tải lại trang.
- **Báo "Có mã bị trùng":** đổi mã khác rồi lưu lại.
- **Báo "Không thể xóa ... đang được dùng ở nơi khác":** thiết bị đã có lịch sử hoặc nằm trong biên bản kiểm kê; dùng "Ghi nhận thanh lý".
- Sửa `.env` khi server đang chạy thì phải dừng và chạy lại backend.

### Lưu ý về dữ liệu khởi tạo

18 tham chiếu trong dữ liệu cũ trỏ tới ID nhân sự không còn trong bảng `users`; chúng được đặt `NULL` trong `server/seed-existing-data.sql` để thỏa khóa ngoại. Sau khi nạp seed, kiểm tra các máy đang `in_use`/`borrowed` nhưng không có người giữ hoặc không có phiếu đang hoạt động:

```sql
SELECT d.code, d.name, d.status
FROM devices d
WHERE d.status IN ('in_use', 'borrowed')
  AND (d.user_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM handovers h WHERE h.device_id = d.id AND h.status = 'active'));
```

Với từng máy tìm thấy, gán lại người giữ bằng phiếu bàn giao đúng, hoặc đưa về kho / ghi nhận thanh lý nếu máy không còn sử dụng.

---

## 🔒 Dữ liệu và vận hành

- Sao lưu định kỳ bằng nút **Sao lưu CSDL (JSON)** và/hoặc `pg_dump`:

  ```powershell
  pg_dump -U postgres it_assetmaster > backup.sql
  ```

- Ứng dụng **không có nút khôi phục dữ liệu mẫu**. Cần dữ liệu để thử, hãy dùng `npm run db:seed` trên một database test riêng.
- Không commit `.env`; đổi mật khẩu admin mặc định và xóa `AUTH_ADMIN_PASSWORD` sau lần khởi động đầu.
