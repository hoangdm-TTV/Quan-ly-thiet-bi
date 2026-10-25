# IT AssetMaster — Quản lý thiết bị và tài sản IT

Ứng dụng quản lý thiết bị, bàn giao/mượn trả, bảo trì, kiểm kê bằng QR và báo cáo. Dự án chạy theo một kiến trúc thống nhất:

- React 18 + Vite + Tailwind CSS ở frontend.
- Cloudflare Pages Functions ở API.
- Cloudflare D1 ở database.
- Wrangler/Miniflare tạo D1 SQLite riêng cho local.

Phần Express/PostgreSQL cũ đã được loại khỏi đường chạy của ứng dụng để tránh ghi dữ liệu vào hai database khác nhau.

## Chạy nhanh

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
notepad .dev.vars
npm run d1:migrate:local
npm run dev
```

Mở địa chỉ Wrangler in ra, thường là:

```text
http://localhost:8788
```

`npm run dev` chính là `npm run pages:dev`, vì vậy local luôn chạy qua Pages Functions và D1 local.

Kiểm tra API:

```text
http://localhost:8788/api/health
http://localhost:8788/api/auth/status
```

## Database

Local sử dụng SQLite D1 trong:

```text
.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
```

Production sử dụng Cloudflare D1:

```text
Database: it-assetmaster
Binding: DB
```

Local và Production là hai database tách biệt. Dữ liệu nhập trên local không tự đẩy lên Production. Deploy code cũng không tự sao chép dữ liệu.

Xem hướng dẫn đầy đủ tại [CLOUDFLARE-D1.md](./CLOUDFLARE-D1.md).

## Tính năng

- Quản lý laptop, PC, màn hình, máy chủ, thiết bị mạng, máy in và phụ kiện.
- Hồ sơ thiết bị gồm mã tài sản, serial, hãng, model, cấu hình, giá mua, ngày mua, bảo hành và vị trí.
- Bàn giao chính thức, cho mượn, thu hồi và theo dõi quá hạn.
- Quản lý nhân viên và phòng ban.
- Phiếu bảo trì/sửa chữa theo trạng thái.
- Kiểm kê tài sản bằng camera, ảnh QR, nhập mã hoặc đầu đọc mã vạch.
- Báo cáo dashboard, xuất Excel và sao lưu/khôi phục JSON.
- Đăng nhập admin, giới hạn đăng nhập sai, phiên cookie và đổi mật khẩu.

## Các lệnh chính

```powershell
# Cài dependency
npm install

# Chạy local qua Cloudflare Pages Functions + D1 local
npm run dev

# Build frontend production
npm run build

# Migration D1 local
npm run d1:migrate:local

# Migration D1 Production — chỉ chạy sau khi đã kiểm tra local
npm run d1:migrate:remote
```

## DBeaver và D1 local

Sau khi chạy migration local, tìm file SQLite:

```powershell
Get-ChildItem -Recurse .wrangler\state\v3\d1 -Filter *.sqlite
```

Trong DBeaver chọn **New Database Connection → SQLite**, sau đó mở file `.sqlite` trong thư mục D1. Không mở các file `metadata.sqlite`; đó là file metadata nội bộ của Wrangler.

Cloudflare D1 Production không cung cấp kết nối TCP trực tiếp cho DBeaver. Có thể xem bằng Cloudflare Dashboard hoặc Wrangler:

```powershell
npx wrangler d1 execute it-assetmaster --remote --command "SELECT * FROM devices LIMIT 50"
```

## Cloudflare Pages

Cấu hình Pages:

```text
Build command: npm run build
Build output directory: dist
```

Repository phải deploy cùng các thư mục:

```text
functions/
migrations/
wrangler.jsonc
```

Trong Pages Settings → Bindings, kiểm tra:

```text
DB → it-assetmaster
```

Trong Pages Settings → Variables and Secrets → Production, thêm:

```text
AUTH_ADMIN_EMAIL
AUTH_ADMIN_PASSWORD
```

Không đặt secret dưới tiền tố `VITE_` và không commit `.dev.vars`.

## Luồng lưu dữ liệu

Khi chạy local:

```text
Frontend → Pages Functions local → D1 local SQLite
```

Khi chạy Production:

```text
Frontend → Cloudflare Pages Functions → D1 it-assetmaster
```

Frontend có lưu một bản cache trong `localStorage` để hỗ trợ backup và hiển thị, nhưng database thật vẫn là D1. App luôn ghi API/database trước rồi mới cập nhật cache.

## Xử lý sự cố

- `500 Thiếu D1 binding tên DB`: Pages binding phải có tên chính xác là `DB`.
- `no such table`: chạy `npm run d1:migrate:local` hoặc `npm run d1:migrate:remote` đúng môi trường.
- `503` khi đăng nhập: kiểm tra `AUTH_ADMIN_EMAIL` và `AUTH_ADMIN_PASSWORD`.
- `401`: phiên đã hết hạn hoặc thông tin đăng nhập không đúng.
- API trả HTML thay vì JSON: kiểm tra thư mục `functions/` đã được deploy cùng frontend chưa.

## Lưu ý dữ liệu

Không dùng lệnh `--remote` để thử nghiệm dữ liệu. Trước thao tác lớn, hãy dùng chức năng sao lưu JSON hoặc xuất dữ liệu cần thiết. Không sao chép dữ liệu Production sang local nếu chưa kiểm tra thông tin nhạy cảm.
