const COOKIE_NAME = "it_asset_session";
const SESSION_HOURS = 12;
const PBKDF2_ITERATIONS = 100_000;
const encoder = new TextEncoder();

const toHex = (bytes) =>
  [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
const fromHex = (value) =>
  new Uint8Array(
    (value.match(/.{1,2}/g) || []).map((part) => Number.parseInt(part, 16)),
  );

export const digestToken = async (token) =>
  toHex(await crypto.subtle.digest("SHA-256", encoder.encode(token)));

const derivePasswordHash = async (password, saltHex) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromHex(saltHex),
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    256,
  );
  return toHex(bits);
};

const constantTimeEqual = (left, right) => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1)
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
};

export const ensureAdmin = async (db, env) => {
  const existing = await db
    .prepare("SELECT id FROM auth_accounts LIMIT 1")
    .first();
  if (existing) return true;
  const email = String(env.AUTH_ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const password = String(env.AUTH_ADMIN_PASSWORD || "");
  if (!email || !password) return false;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 ||
    password.length > 256
  ) {
    throw new Error(
      "AUTH_ADMIN_EMAIL không hợp lệ hoặc AUTH_ADMIN_PASSWORD phải dài 12–256 ký tự.",
    );
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = toHex(salt);
  const passwordHash = await derivePasswordHash(password, saltHex);
  await db
    .prepare(
      "INSERT OR IGNORE INTO auth_accounts(id, email, password_salt, password_hash, password_algorithm) VALUES('admin', ?, ?, ?, 'pbkdf2-sha256')",
    )
    .bind(email, saltHex, passwordHash)
    .run();
  return true;
};

export const verifyCredentials = async (db, email, password) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  const account = await db
    .prepare(
      "SELECT id, email, password_salt, password_hash, password_algorithm FROM auth_accounts WHERE email = ?",
    )
    .bind(normalizedEmail)
    .first();
  if (
    !account ||
    typeof password !== "string" ||
    password.length > 256 ||
    account.password_algorithm !== "pbkdf2-sha256"
  ) {
    await derivePasswordHash(
      typeof password === "string"
        ? password.slice(0, 256)
        : "invalid-password",
      "00112233445566778899aabbccddeeff",
    );
    return null;
  }
  const candidate = await derivePasswordHash(password, account.password_salt);
  if (!constantTimeEqual(candidate, account.password_hash)) return null;
  return { id: account.id, email: account.email, role: "admin" };
};

export const readCookie = (request, name = COOKIE_NAME) => {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const segment of cookieHeader.split(";")) {
    const separator = segment.indexOf("=");
    if (separator < 0 || segment.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(segment.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
};

export const getSessionAccount = async (db, request) => {
  const token = readCookie(request);
  if (!token) return null;
  const hash = await digestToken(token);
  const now = new Date().toISOString();
  return db
    .prepare(
      "SELECT a.id, a.email, 'admin' AS role FROM auth_sessions s JOIN auth_accounts a ON a.id = s.account_id WHERE s.token_hash = ? AND s.expires_at > ?",
    )
    .bind(hash, now)
    .first();
};

export const createSession = async (db, accountId, request) => {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(
    Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  ).toISOString();
  await db
    .prepare(
      "INSERT INTO auth_sessions(token_hash, account_id, expires_at) VALUES(?, ?, ?)",
    )
    .bind(await digestToken(token), accountId, expiresAt)
    .run();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 60 * 60}${secure}`;
};

export const expireSessionCookie = (request) => {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
};

export { COOKIE_NAME, PBKDF2_ITERATIONS, derivePasswordHash };
