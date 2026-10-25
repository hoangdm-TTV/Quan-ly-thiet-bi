# Chạy IT AssetMaster trên Cloudflare Pages + D1

Bản Cloudflare sử dụng React/Vite ở Pages, API tại `functions/api/[[path]].js` và Cloudflare D1. Các file Express/PostgreSQL hiện có được giữ lại để không làm thay đổi hoặc xóa database cũ; `npm run dev` vẫn là chế độ cũ, còn kiểm thử bản Cloudflare dùng `npm run pages:dev`.

## 1. Tạo D1 một lần

Cài đặt Node.js, mở terminal ở root repo, rồi xác thực Wrangler với tài khoản Cloudflare:

```powershell
npx wrangler login
npx wrangler d1 create it-assetmaster
```

Lệnh tạo database trả về `database_id`. Mở `wrangler.jsonc` và bảo đảm `database_id` khớp với database đang gắn vào Pages binding `DB`. Không đưa mật khẩu database hoặc token vào file này.

Áp dụng schema lên D1 local và D1 production:

```powershell
npm run d1:migrate:local
npm run d1:migrate:remote
```

D1 local là database tách biệt dùng để thử. D1 remote là database thật trên Cloudflare. Không dùng `--remote` để thử các thao tác có thể sửa/xóa dữ liệu thật.

## 2. Chạy bản Cloudflare local

Tạo file `.dev.vars` từ mẫu có sẵn trong repository:

```powershell
Copy-Item .dev.vars.example .dev.vars
notepad .dev.vars
```

Đổi email và mật khẩu local trong file đó. File `.dev.vars` đã được thêm vào `.gitignore`; không commit file này.

Sau khi đã chạy migration local, khởi động Pages Functions cùng frontend:

```powershell
npm run pages:dev
```

Wrangler sẽ build Vite rồi phục vụ thư mục `dist` cùng Pages Functions. Mở địa chỉ local mà Wrangler in ra (thường là `http://localhost:8788`). Endpoint kiểm tra:

```text
http://localhost:8788/api/health
http://localhost:8788/api/auth/status
```

`/api/health` cần trả JSON với `"database":"cloudflare-d1"`. Nếu D1 local chưa có schema, chạy `npm run d1:migrate:local` rồi khởi động lại.

## 3. Cấu hình Cloudflare Pages

Trong Pages project, đặt:

- Build command: `npm run build`
- Build output directory: `dist`

Đảm bảo Pages project deploy từ Git branch/repository có cả thư mục `functions/`, `migrations/` và file `wrangler.jsonc` ở root. Chỉ upload `dist` thủ công sẽ không đưa Pages Functions lên production.

Trong Cloudflare Pages **Settings → Bindings**, kiểm tra D1 database binding có tên `DB` và trỏ đến database `it-assetmaster`. Nếu tạo từ `wrangler.jsonc`, binding được định nghĩa ở đó; redeploy Pages sau khi thay đổi binding/config.

Trong **Settings → Variables and Secrets**, thêm cho Production:

```text
AUTH_ADMIN_EMAIL = email admin của bạn
AUTH_ADMIN_PASSWORD = mật khẩu riêng dài ít nhất 12 ký tự
```

Không đặt các giá trị này dưới tiền tố `VITE_` và không commit vào Git. Migration đầu tiên tạo schema, còn tài khoản admin được khởi tạo khi API `/api/auth/status` được gọi lần đầu với secrets hợp lệ.

Trước khi deploy phiên bản app, áp dụng migration lên database Cloudflare:

```powershell
npm run d1:migrate:remote
```

Sau đó push code lên Git branch mà Pages đang theo dõi. Kiểm tra sau deploy:

```text
https://<domain-pages-cua-ban>/api/health
https://<domain-pages-cua-ban>/api/auth/status
```

Cả hai endpoint phải trả JSON. Sau đó đăng nhập bằng tài khoản được đặt trong Pages secrets.

## 4. Dữ liệu PostgreSQL hiện tại

Việc tạo D1 và chạy migrations không xóa hay sửa PostgreSQL cục bộ, nhưng cũng không tự sao chép dữ liệu PostgreSQL sang D1. Database D1 mới bắt đầu trống. Chỉ chuyển ứng dụng chính sang domain Pages sau khi đã quyết định và xác minh kế hoạch nạp dữ liệu hiện có hoặc nạp bộ dữ liệu mẫu.

## 5. Gỡ lỗi

- `404`/`405` với HTML: Pages Function chưa được deploy; xác nhận repo có `functions/api/[[path]].js` ở root và deploy qua Git.
- `500 Thiếu D1 binding tên DB`: kiểm tra binding name là `DB`, trỏ đúng database và redeploy.
- Lỗi `no such table`: áp dụng migration vào đúng database/môi trường.
- `503` tại login/auth status: kiểm tra Pages secrets `AUTH_ADMIN_EMAIL` và `AUTH_ADMIN_PASSWORD`.
- `401`: tài khoản trong D1 không khớp; secrets chỉ tạo admin lần đầu, đổi secrets không tự đổi password đã lưu.
- Local D1 khác remote D1. Nếu thử trên production, mọi thao tác sẽ tác động dữ liệu thật.

## Tài liệu Cloudflare

- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/)
- [D1 bindings cho Pages Functions](https://developers.cloudflare.com/pages/functions/bindings/)
- [Bắt đầu với Cloudflare D1](https://developers.cloudflare.com/d1/get-started/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
