import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from './database.js';

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = 'it_asset_session';
const SESSION_HOURS = 12;
const PASSWORD_BYTES = 64;

const hashPassword = async (password, salt = randomBytes(16).toString('hex')) => {
  const derived = await scrypt(password, salt, PASSWORD_BYTES, { maxmem: 64 * 1024 * 1024 });
  return { salt, hash: derived.toString('hex') };
};

const tokenDigest = (token) => createHash('sha256').update(token).digest('hex');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const validatePassword = (password) => (
  typeof password === 'string' && password.length >= 12 && password.length <= 256
);

export const initializeAuth = async () => {
  await pool.query('DELETE FROM auth_sessions WHERE expires_at <= NOW()');
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM auth_accounts');
  if (rows[0].count > 0) return;

  const email = normalizeEmail(process.env.AUTH_ADMIN_EMAIL);
  const password = process.env.AUTH_ADMIN_PASSWORD;
  if (!email && !password) {
    console.warn('[Auth] Chưa có tài khoản admin. Hãy cấu hình AUTH_ADMIN_EMAIL và AUTH_ADMIN_PASSWORD trong .env rồi khởi động lại.');
    return;
  }
  if (!email || email.length > 254 || !validatePassword(password)) {
    throw new Error('Tạo admin lần đầu cần AUTH_ADMIN_EMAIL hợp lệ và AUTH_ADMIN_PASSWORD dài từ 12 đến 256 ký tự.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('AUTH_ADMIN_EMAIL không đúng định dạng email.');
  }

  const { salt, hash } = await hashPassword(password);
  await pool.query(
    `INSERT INTO auth_accounts (id, email, password_salt, password_hash)
     VALUES ('admin', $1, $2, $3) ON CONFLICT (id) DO NOTHING`,
    [email, salt, hash],
  );
  console.log(`[Auth] Đã khởi tạo tài khoản admin: ${email}`);
};

export const isAdminConfigured = async () => {
  const { rows } = await pool.query('SELECT EXISTS (SELECT 1 FROM auth_accounts) AS configured');
  return rows[0].configured;
};

export const verifyCredentials = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  const { rows } = await pool.query(
    'SELECT id, email, password_salt, password_hash FROM auth_accounts WHERE email = $1',
    [normalizedEmail],
  );
  const account = rows[0];
  if (!account || typeof password !== 'string' || password.length > 256) {
    await hashPassword('invalid-password');
    return null;
  }

  const { hash } = await hashPassword(password, account.password_salt);
  const expected = Buffer.from(account.password_hash, 'hex');
  const actual = Buffer.from(hash, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return { id: account.id, email: account.email, role: 'admin' };
};

export const createSession = async (accountId) => {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO auth_sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3)',
    [tokenDigest(token), accountId, expiresAt],
  );
  return { token, expiresAt };
};

export const getSessionAccount = async (token) => {
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT a.id, a.email
     FROM auth_sessions s JOIN auth_accounts a ON a.id = s.account_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenDigest(token)],
  );
  return rows[0] ? { id: rows[0].id, email: rows[0].email, role: 'admin' } : null;
};

export const deleteSession = async (token) => {
  if (token) await pool.query('DELETE FROM auth_sessions WHERE token_hash = $1', [tokenDigest(token)]);
};

export const updateAdminPassword = async (accountId, currentPassword, newPassword) => {
  if (!validatePassword(newPassword)) {
    const error = new Error('Mật khẩu mới phải dài từ 12 đến 256 ký tự.');
    error.status = 400;
    throw error;
  }
  if (typeof currentPassword !== 'string' || currentPassword.length > 256) return false;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT email, password_salt, password_hash FROM auth_accounts WHERE id = $1 FOR UPDATE',
      [accountId],
    );
    const account = rows[0];
    if (!account) {
      await client.query('ROLLBACK');
      return false;
    }
    const { hash: currentHash } = await hashPassword(currentPassword, account.password_salt);
    const expected = Buffer.from(account.password_hash, 'hex');
    const actual = Buffer.from(currentHash, 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      await client.query('ROLLBACK');
      return false;
    }

    const { salt, hash } = await hashPassword(newPassword);
    await client.query(
      'UPDATE auth_accounts SET password_salt = $1, password_hash = $2 WHERE id = $3',
      [salt, hash, accountId],
    );
    await client.query('DELETE FROM auth_sessions WHERE account_id = $1', [accountId]);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const setSessionCookie = (res, token) => {
  const attributes = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${SESSION_HOURS * 60 * 60}`,
  ];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
};

export const clearSessionCookie = (res) => {
  const attributes = [`${COOKIE_NAME}=`, 'HttpOnly', 'SameSite=Strict', 'Path=/', 'Max-Age=0'];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
};

export const readSessionCookie = (req) => {
  const cookieHeader = req.headers.cookie || '';
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== COOKIE_NAME) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
};
