# Chạy IT AssetMaster trên Cloudflare Pages + D1

Dự án này sử dụng React/Vite ở frontend, Cloudflare Pages Functions ở API và Cloudflare D1 ở database. Local và Production dùng cùng mô hình D1; local dùng một SQLite D1 riêng do Wrangler tạo, còn Production dùng database D1 trên Cloudflare.

## 1. Các môi trường dữ liệu

- **Local:** SQLite D1 trong thư mục `.wrangler`, chỉ dùng trên máy lập trình.
- **Production:** D1 `it-assetmaster`, binding tên `DB`, database ID được khai báo trong `wrangler.jsonc`.

Dữ liệu local không tự đồng bộ lên Production. Deploy code cũng không tự sao chép dữ liệu. Không có database Dev/Preview Cloudflare riêng trong cấu hình hiện tại.

## 2. Cài đặt và chạy local

Cài dependency:

```powershell
npm install
```

Tạo biến môi trường cho Pages Functions local:

```powershell
Copy-Item .dev.vars.example .dev.vars
notepad .dev.vars
```

Điền email và mật khẩu admin test trong `.dev.vars`. Không commit file `.dev.vars`.

Áp dụng migration vào D1 local:

```powershell
npm run d1:migrate:local
```

Khởi động ứng dụng:

```powershell
npm run dev
```

`npm run dev` hiện là alias của `npm run pages:dev`, không còn khởi động Express hoặc PostgreSQL.

Mở địa chỉ Wrangler in ra, thường là:

```text
http://localhost:8788
```

Kiểm tra:

```text
http://localhost:8788/api/health
http://localhost:8788/api/auth/status
```

Endpoint health đúng phải trả:

```json
{"status":"ok","database":"cloudflare-d1"}
```

## 3. Xem database local bằng DBeaver

Sau khi chạy migration local, tìm file SQLite:

```powershell
Get-ChildItem -Recurse .wrangler\state\v3\d1 -Filter *.sqlite
```

Mở file SQLite nằm trong:

```text
.wrangler\state\v3\d1\miniflare-D1DatabaseObject\
```

Trong DBeaver chọn **New Database Connection → SQLite**, sau đó chọn file `.sqlite` của D1. Bỏ qua các file `metadata.sqlite`; đó là metadata nội bộ của Wrangler, không phải database ứng dụng.

## 4. Cấu hình Cloudflare Pages

Trong Pages project, đặt:

- Build command: `npm run build`
- Build output directory: `dist`
- Repository phải có thư mục `functions/`, `migrations/` và `wrangler.jsonc` ở root.

Trong **Settings → Bindings**, kiểm tra binding:

```text
Binding name: DB
Database: it-assetmaster
```

Trong **Settings → Variables and Secrets → Production**, thêm:

```text
AUTH_ADMIN_EMAIL = email admin
AUTH_ADMIN_PASSWORD = mật khẩu riêng dài ít nhất 12 ký tự
```

Không đặt các giá trị này dưới tiền tố `VITE_` và không commit secrets vào Git.

## 5. Migration Production

Chỉ chạy lệnh remote sau khi đã kiểm tra migration local:

```powershell
npm run d1:migrate:remote
```

Lệnh này thay đổi schema của D1 Production. Không dùng `--remote` cho các thao tác thử nghiệm hoặc dữ liệu mẫu.

Sau đó push code lên branch mà Cloudflare Pages đang theo dõi. Kiểm tra sau deploy:

```text
https://<domain-pages-cua-ban>/api/health
https://<domain-pages-cua-ban>/api/auth/status
```

## 6. Xem Production

Cloudflare D1 không có kết nối TCP SQLite trực tiếp cho DBeaver. Xem Production bằng Cloudflare Dashboard:

```text
Cloudflare Dashboard
→ Workers & Pages
→ D1
→ it-assetmaster
→ Console
```

Hoặc dùng Wrangler:

```powershell
npx wrangler d1 execute it-assetmaster --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
npx wrangler d1 execute it-assetmaster --remote --command "SELECT * FROM devices LIMIT 50"
```

## 7. Sự cố thường gặp

- `500 Thiếu D1 binding tên DB`: kiểm tra Pages binding phải có tên chính xác là `DB`.
- `no such table`: chạy `npm run d1:migrate:local` cho local hoặc `npm run d1:migrate:remote` cho Production.
- `503` tại login/auth status: kiểm tra `AUTH_ADMIN_EMAIL` và `AUTH_ADMIN_PASSWORD` trong Pages secrets.
- `401`: phiên đăng nhập hết hạn hoặc email/mật khẩu không đúng.
- API trả HTML thay vì JSON: kiểm tra Pages Functions trong thư mục `functions/` đã được deploy cùng frontend hay chưa.

## 8. Sao lưu

Trong ứng dụng có nút xuất dữ liệu JSON. Nên sao lưu trước khi chạy thao tác lớn hoặc migration thay đổi dữ liệu. Không lấy dữ liệu Production đưa vào local một cách tự động nếu chưa kiểm tra thông tin nhạy cảm.
