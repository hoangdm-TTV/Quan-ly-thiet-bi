import {
  createSession,
  derivePasswordHash,
  digestToken,
  ensureAdmin,
  expireSessionCookie,
  getSessionAccount,
  readCookie,
  verifyCredentials,
} from "../_lib/auth.js";
import { createAudit, finishAudit, getSnapshot, saveAuditRecord, saveSnapshot } from "../_lib/data.js";

const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
const errorResponse = (status, message) => json({ error: message }, status);
const sameOrigin = (request) => {
  const origin = request.headers.get("Origin");
  return Boolean(origin && origin === new URL(request.url).origin);
};
const parseBody = async (request) => {
  try { return await request.json(); } catch { throw Object.assign(new Error("Request body phải là JSON hợp lệ."), { status: 400 }); }
};
const authRequired = (request) => request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS";

async function login(db, request, env) {
  if (!sameOrigin(request)) return errorResponse(403, "Origin không được phép.");
  const setupReady = await ensureAdmin(db, env);
  if (!setupReady) return errorResponse(503, "Chưa cấu hình AUTH_ADMIN_EMAIL và AUTH_ADMIN_PASSWORD trong Cloudflare Pages secrets.");
  const body = await parseBody(request);
  const email = String(body?.email || "").trim().toLowerCase().slice(0, 254);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const attemptKey = await digestToken(`${ip}:${email}`);
  const now = Date.now();
  await db.prepare("DELETE FROM login_attempts WHERE started_at < ?").bind(now - 15 * 60 * 1000).run();
  const attempt = await db.prepare("SELECT started_at AS startedAt, attempt_count AS attemptCount FROM login_attempts WHERE attempt_key=?").bind(attemptKey).first();
  if (attempt && now - Number(attempt.startedAt) < 15 * 60 * 1000 && Number(attempt.attemptCount) >= 5) {
    const retry = Math.ceil((15 * 60 * 1000 - (now - Number(attempt.startedAt))) / 1000);
    return errorResponse(429, `Đăng nhập sai quá nhiều lần. Thử lại sau ${retry} giây.`);
  }
  const account = await verifyCredentials(db, email, body?.password);
  if (!account) {
    const startedAt = attempt && now - Number(attempt.startedAt) < 15 * 60 * 1000 ? Number(attempt.startedAt) : now;
    const count = startedAt === Number(attempt?.startedAt) ? Number(attempt.attemptCount) + 1 : 1;
    await db.prepare("INSERT INTO login_attempts(attempt_key,started_at,attempt_count) VALUES(?,?,?) ON CONFLICT(attempt_key) DO UPDATE SET started_at=excluded.started_at,attempt_count=excluded.attempt_count")
      .bind(attemptKey, startedAt, count).run();
    return errorResponse(401, "Email hoặc mật khẩu không đúng.");
  }
  await db.prepare("DELETE FROM login_attempts WHERE attempt_key=?").bind(attemptKey).run();
  const setCookie = await createSession(db, account.id, request);
  return json({ user: account }, 200, { "Set-Cookie": setCookie });
}

async function changePassword(db, request, account) {
  if (!sameOrigin(request)) return errorResponse(403, "Origin không được phép.");
  const body = await parseBody(request);
  const current = await verifyCredentials(db, account.email, body?.currentPassword);
  if (!current) return errorResponse(400, "Mật khẩu hiện tại không đúng.");
  const nextPassword = body?.newPassword;
  if (typeof nextPassword !== "string" || nextPassword.length < 12 || nextPassword.length > 256) return errorResponse(400, "Mật khẩu mới phải dài từ 12 đến 256 ký tự.");
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = [...saltBytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  const hash = await derivePasswordHash(nextPassword, salt);
  await db.batch([
    db.prepare("UPDATE auth_accounts SET password_salt=?,password_hash=?,password_algorithm='pbkdf2-sha256' WHERE id=?").bind(salt, hash, account.id),
    db.prepare("DELETE FROM auth_sessions WHERE account_id=?").bind(account.id),
  ]);
  return json({ success: true, message: "Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới." }, 200, { "Set-Cookie": expireSessionCookie(request) });
}

export async function onRequest({ request, env }) {
  if (!env.DB) return errorResponse(500, "Thiếu D1 binding tên DB. Kiểm tra wrangler.jsonc và Pages Settings.");
  const db = env.DB;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, "");

  try {
    if (path === "health" && request.method === "GET") {
      await db.prepare("SELECT 1 AS ok").first();
      return json({ status: "ok", database: "cloudflare-d1" });
    }

    if (path === "auth/status" && request.method === "GET") {
      const setupRequired = !(await ensureAdmin(db, env));
      return json({ setupRequired });
    }

    if (path === "auth/login" && request.method === "POST") return await login(db, request, env);

    const account = await getSessionAccount(db, request);
    if (!account) return errorResponse(401, "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
    if (authRequired(request) && !sameOrigin(request)) return errorResponse(403, "Origin không được phép.");

    if (path === "auth/me" && request.method === "GET") return json({ user: account });

    if (path === "auth/logout" && request.method === "POST") {
      const token = readCookie(request);
      if (token) await db.prepare("DELETE FROM auth_sessions WHERE token_hash=?").bind(await digestToken(token)).run();
      return json({ success: true }, 200, { "Set-Cookie": expireSessionCookie(request) });
    }

    if (path === "auth/password" && request.method === "POST") return await changePassword(db, request, account);

    if (path === "data" && request.method === "GET") return json(await getSnapshot(db));

    if (path === "data" && request.method === "POST") {
      const body = await parseBody(request);
      const required = ["departments", "users", "devices", "handovers", "maintenance"];
      if (!body || required.some((key) => !Array.isArray(body[key]))) return errorResponse(400, "Dữ liệu không hợp lệ: cần đủ 5 danh sách dạng mảng.");
      const result = await saveSnapshot(db, body, request.headers.get("If-Match"));
      return json({ success: true, message: "Đã lưu dữ liệu vào Cloudflare D1.", db: { updatedAt: result.updatedAt, revision: result.revision } });
    }

    if (path === "audits" && request.method === "POST") {
      const body = await parseBody(request);
      return json({ audit: await createAudit(db, body) }, 201);
    }

    const recordMatch = path.match(/^audits\/([^/]+)\/records\/([^/]+)$/);
    if (recordMatch && request.method === "PUT") {
      const body = await parseBody(request);
      return json({ audit: await saveAuditRecord(db, decodeURIComponent(recordMatch[1]), decodeURIComponent(recordMatch[2]), body) });
    }

    const finishMatch = path.match(/^audits\/([^/]+)\/finish$/);
    if (finishMatch && request.method === "POST") return json({ audit: await finishAudit(db, decodeURIComponent(finishMatch[1])) });

    if (["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return errorResponse(404, "Không tìm thấy API endpoint.");
    return errorResponse(405, "HTTP method không được hỗ trợ.");
  } catch (error) {
    if (error?.status) return errorResponse(error.status, error.message);
    if (error?.message?.includes("UNIQUE constraint failed")) return errorResponse(422, "Có mã hoặc email bị trùng. Hãy kiểm tra dữ liệu rồi thử lại.");
    if (error?.message?.includes("FOREIGN KEY constraint failed")) return errorResponse(422, "Không thể lưu do dữ liệu tham chiếu không tồn tại hoặc đang được sử dụng.");
    console.error("[Pages API] Request failed:", error);
    return errorResponse(500, "Lỗi máy chủ. Kiểm tra Pages Functions logs.");
  }
}
