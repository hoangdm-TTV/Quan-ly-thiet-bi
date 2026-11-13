# IT AssetMaster — Quản lý thiết bị và tài sản IT

Ứng dụng nội bộ quản lý thiết bị, nhân viên/phòng ban, bàn giao và mượn trả, bảo trì, kiểm kê, báo cáo và sao lưu dữ liệu.

## Kiến trúc hiện tại

```text
React 18 + Vite
       │ same-origin /api
       ▼
Cloudflare Pages Functions (functions/api/[[path]].js)
       │ binding: DB
       ▼
Cloudflare D1
```

Local cũng chạy Pages Functions, nhưng dùng D1 SQLite local do Wrangler quản lý. Production dùng D1 trên Cloudflare. Hai môi trường là hai database tách biệt; dữ liệu local không tự đồng bộ lên production khi deploy code.

Ứng dụng hiện không chạy Express/PostgreSQL. `package.json` không còn lệnh hoặc dependency để chạy backend PostgreSQL. Frontend gọi API cùng origin; `localStorage` chỉ giữ cache phục vụ xuất/sao lưu, không thay thế D1. Mọi thay đổi được gửi đến API/database trước, rồi mới cập nhật cache.

## Chạy local

Cần Node.js và npm. Tại thư mục gốc repo, chạy:

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
notepad .dev.vars
```

Thay email và mật khẩu mẫu trong `.dev.vars` bằng thông tin chỉ dùng local. Mật khẩu phải dài ít nhất 12 ký tự. Không commit `.dev.vars`; file này đã được `.gitignore` bỏ qua. Production phải dùng secrets riêng trong Cloudflare, không dùng thông tin local.

Tạo bảng cho D1 local và chạy app:

```powershell
npm run d1:migrate:local
npm run dev
```

`npm run dev` gọi `npm run pages:dev`. Script này build Vite rồi chạy `wrangler pages dev dist`, để giao diện và Pages Functions cùng hoạt động. Mở URL Wrangler in ra, thường là `http://localhost:8788`.

Kiểm tra API:

```text
http://localhost:8788/api/health
http://localhost:8788/api/auth/status
```

`/api/health` cần trả JSON tương tự `{"status":"ok","database":"cloudflare-d1"}`. Tài khoản admin được tạo lần đầu khi đăng nhập hoặc gọi trạng thái xác thực, nếu D1 chưa có tài khoản và các biến `AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD` hợp lệ.

> `npm run preview` chỉ chạy Vite preview tĩnh; để thử API/Functions local, dùng `npm run dev`.

## Lệnh npm

| Lệnh | Công dụng |
|---|---|
| `npm run dev` | Build và chạy Pages Functions + D1 local bằng Wrangler |
| `npm run pages:dev` | Tương tự `npm run dev` |
| `npm run build` | Build frontend Vite vào `dist/` |
| `npm run preview` | Xem bản frontend tĩnh; không thay thế Pages Functions |
| `npm run d1:migrate:local` | Áp dụng migration vào D1 local |
| `npm run d1:migrate:remote` | Áp dụng migration vào D1 production — chỉ chạy khi đã xác nhận database đích |

## Database và migration

Cấu hình D1 nằm trong `wrangler.jsonc`: binding phải tên `DB`, `database_name` phải khớp tên D1 trên Cloudflare, và `database_id` phải là ID thật của database đó. Migration tạo schema nằm trong `migrations/`.

D1 local được lưu dưới `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`. Có thể tìm file SQLite bằng PowerShell:

```powershell
Get-ChildItem -Recurse .wrangler\state\v3\d1 -Filter *.sqlite
```

Trong DBeaver, tạo kết nối SQLite và mở file database có tên hash; bỏ qua `metadata.sqlite`, vì đó là metadata Wrangler. D1 production không cung cấp kết nối TCP SQLite trực tiếp cho DBeaver. Dùng Cloudflare Dashboard hoặc Wrangler để truy vấn.

Ví dụ đọc dữ liệu production — lệnh này cần Wrangler đã đăng nhập đúng tài khoản và database ID đúng:

```powershell
npx wrangler d1 execute it-assetmaster --remote --command "SELECT * FROM devices LIMIT 50"
```

Không chạy lệnh `--remote` để thử nghiệm dữ liệu. Trước thay đổi schema hoặc thao tác lớn, hãy xác nhận đang trỏ đúng database và có bản sao lưu phù hợp.

## Tính năng

- Quản lý thiết bị/tài sản, thông tin cấu hình, serial, tình trạng, vị trí và giá trị.
- Quản lý nhân viên và phòng ban.
- Lập phiếu bàn giao hoặc cho mượn, theo dõi hạn trả và ghi nhận hoàn trả.
- Theo dõi lịch bảo trì/sửa chữa.
- Kiểm kê theo đợt, lưu trạng thái/ghi chú và chênh lệch từng thiết bị.
- Quét QR từ nút trên thanh điều hướng để tìm thiết bị và mở hồ sơ.
- Dashboard, báo cáo, xuất danh sách thiết bị Excel, sao lưu và khôi phục JSON.
- Đăng nhập admin, giới hạn lần đăng nhập sai, phiên cookie và đổi mật khẩu.

Dữ liệu nghiệp vụ gồm phòng ban, nhân viên, thiết bị, phiếu bàn giao, bảo trì và hồ sơ kiểm kê. D1 schema cùng index được định nghĩa trong `migrations/0001_initial.sql`.

## Deploy Cloudflare Pages

### Nếu Pages kết nối trực tiếp với Git

Trong Pages project, build command là `npm run build`, output directory là `dist`, root directory là thư mục gốc repo. Giữ nguyên thư mục `functions/` ở root cùng với `migrations/` và `wrangler.jsonc`; không chỉ deploy mỗi `dist/`. Pages Git integration sẽ build và deploy project theo cấu hình Pages.

### Nếu đang dùng màn hình Workers Builds có ô Deploy command

Đây là quy trình khác với Pages Git integration. Log có dòng `Executing user deploy command` là Workers Builds đang chạy lệnh deploy tùy chỉnh. Đặt:

```text
Build command:  npm run build
Deploy command: npx wrangler pages deploy dist --project-name=TEN_PAGES_PROJECT
Root directory: thư mục gốc repo
```

Thay `TEN_PAGES_PROJECT` bằng tên **Pages project** thật. Lệnh deploy cần chạy ở root repo để Wrangler nhận cả `functions/`. Không dùng `npx wrangler deploy`: đó là lệnh deploy Worker và sẽ lỗi `Missing entry-point` với app Pages này. Nếu Pages project chưa tồn tại, tạo Pages project trước.

Không dùng thao tác Dashboard kéo-thả riêng `dist/` để deploy bản có API: upload kéo-thả Pages không biên dịch thư mục `functions/`. Xem [Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) và [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/).

### Binding và secrets production

Trong Pages project, cấu hình D1 binding có tên chính xác `DB` và trỏ đến database `it-assetmaster` tương ứng với `wrangler.jsonc`. Trong **Settings → Variables and Secrets → Production**, tạo:

```text
AUTH_ADMIN_EMAIL
AUTH_ADMIN_PASSWORD
```

Đặt mật khẩu riêng dài tối thiểu 12 ký tự. Không dùng tiền tố `VITE_`, không ghi secrets vào Git. Secrets chỉ khởi tạo admin khi bảng tài khoản còn trống; sửa secrets sau khi đã có tài khoản không tự đổi mật khẩu đã lưu.

Sau khi tạo D1 và cập nhật `database_id`, áp dụng schema production khi đã kiểm tra database đích:

```powershell
npm run d1:migrate:remote
```

Sau deploy, mở `/api/health` trên domain Pages; endpoint phải trả JSON và `database` phải là `cloudflare-d1`.

Hướng dẫn chi tiết: [CLOUDFLARE-D1.md](./CLOUDFLARE-D1.md). Tài liệu Cloudflare: [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

## Xử lý sự cố

- **`Missing entry-point`**: thường do dùng `npx wrangler deploy`. Với Pages, dùng `npx wrangler pages deploy dist --project-name=TEN_PAGES_PROJECT` hoặc dùng Pages Git integration.
- **`database ... could not be found` / mã 7404**: kiểm tra `database_id`, account Cloudflare đã đăng nhập và tên database trong `wrangler.jsonc`.
- **`500 Thiếu D1 binding tên DB`**: kiểm tra binding Pages tên chính xác `DB` và trỏ đúng D1, rồi deploy lại.
- **`no such table`**: áp dụng migration vào đúng môi trường: `npm run d1:migrate:local` hoặc `npm run d1:migrate:remote`.
- **`503` khi xác thực**: nếu chưa có admin, kiểm tra `AUTH_ADMIN_EMAIL` và `AUTH_ADMIN_PASSWORD` trong `.dev.vars` (local) hoặc Pages secrets (production).
- **`401`**: thông tin đăng nhập không đúng hoặc phiên đăng nhập đã hết hạn.
- **API trả HTML thay vì JSON / 404 / 405**: kiểm tra Pages Function tại `functions/api/[[path]].js` đã được deploy cùng Pages project chưa; không deploy riêng `dist/`.
- **Cảnh báo bundle lớn hơn 500 kB**: là cảnh báo của Vite về kích thước bundle, không phải lỗi nếu build kết thúc thành công.
