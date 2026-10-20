import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionAccount,
  initializeAuth,
  isAdminConfigured,
  readSessionCookie,
  setSessionCookie,
  updateAdminPassword,
  verifyCredentials,
} from './auth.js';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_USERS,
  INITIAL_DEVICES,
  INITIAL_HANDOVERS,
  INITIAL_MAINTENANCE,
  INITIAL_AUDITS,
} from '../src/data/mockData.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.API_HOST || '127.0.0.1';
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const isPrivateLanOrigin = (origin) => {
  if (process.env.ALLOW_LAN_ORIGINS !== 'true') return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' || Number(url.port || 80) !== Number(process.env.VITE_PORT || 5173)) return false;
    const octets = url.hostname.split('.').map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
    return octets[0] === 10
      || (octets[0] === 192 && octets[1] === 168)
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31);
  } catch {
    return false;
  }
};
const isAllowedOrigin = (origin) => allowedOrigins.has(origin) || isPrivateLanOrigin(origin);

app.use(cors({
  origin(origin, callback) {
    // Non-browser clients do not send Origin. CORS is not an authentication mechanism.
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const loginAttempts = new Map();
const loginWindowMs = 15 * 60 * 1000;
const maxLoginAttempts = 5;

const trustedOrigin = (req) => {
  const origin = req.get('Origin');
  return Boolean(origin && isAllowedOrigin(origin));
};

app.get('/api/auth/status', async (_req, res, next) => {
  try {
    res.json({ setupRequired: !(await isAdminConfigured()) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  if (!trustedOrigin(req)) return res.status(403).json({ error: 'Origin không được phép.' });
  try {
    for (const [key, attempt] of loginAttempts) {
      if (Date.now() - attempt.startedAt >= loginWindowMs) loginAttempts.delete(key);
    }
    if (!(await isAdminConfigured())) {
      return res.status(503).json({ error: 'Chưa khởi tạo admin. Hãy cấu hình AUTH_ADMIN_EMAIL và AUTH_ADMIN_PASSWORD trong .env.' });
    }
    const email = String(req.body?.email || '').trim().slice(0, 254).toLowerCase();
    const attemptKey = `${req.ip}:${email}`;
    const previous = loginAttempts.get(attemptKey);
    if (previous && Date.now() - previous.startedAt < loginWindowMs && previous.count >= maxLoginAttempts) {
      res.set('Retry-After', String(Math.ceil((loginWindowMs - (Date.now() - previous.startedAt)) / 1000)));
      return res.status(429).json({ error: 'Đăng nhập sai quá nhiều lần. Hãy thử lại sau 15 phút.' });
    }

    const account = await verifyCredentials(email, req.body?.password);
    if (!account) {
      const current = previous && Date.now() - previous.startedAt < loginWindowMs
        ? previous
        : { startedAt: Date.now(), count: 0 };
      current.count += 1;
      loginAttempts.set(attemptKey, current);
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }

    loginAttempts.delete(attemptKey);
    const { token } = await createSession(account.id);
    setSessionCookie(res, token);
    res.json({ user: account });
  } catch (error) {
    next(error);
  }
});

app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();
  try {
    const token = readSessionCookie(req);
    const account = await getSessionAccount(token);
    if (!account) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.' });
    req.authAccount = account;
    req.sessionToken = token;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !trustedOrigin(req)) {
      return res.status(403).json({ error: 'Origin không được phép.' });
    }
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', (req, res) => res.json({ user: req.authAccount }));

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    await deleteSession(req.sessionToken);
    clearSessionCookie(res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/password', async (req, res, next) => {
  try {
    const updated = await updateAdminPassword(
      req.authAccount.id,
      req.body?.currentPassword,
      req.body?.newPassword,
    );
    if (!updated) return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
    clearSessionCookie(res);
    res.json({ success: true, message: 'Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.' });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    next(error);
  }
});

const initialSample = () => ({
  departments: INITIAL_DEPARTMENTS,
  users: INITIAL_USERS,
  devices: INITIAL_DEVICES,
  handovers: INITIAL_HANDOVERS,
  maintenance: INITIAL_MAINTENANCE,
  audits: INITIAL_AUDITS,
});

app.get('/api/health', async (_req, res) => {
  try {
    const { pool } = await import('./database.js');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'postgresql' });
  } catch (error) {
    console.error('[Database] Health check failed:', error.message);
    res.status(503).json({ status: 'error', database: 'postgresql', error: 'PostgreSQL is unavailable.' });
  }
});

app.get('/api/data', async (_req, res, next) => {
  try {
    const { getSnapshot } = await import('./database.js');
    res.json(await getSnapshot());
  } catch (error) {
    next(error);
  }
});

app.post('/api/data', async (req, res, next) => {
  const collections = ['devices', 'users', 'departments', 'handovers', 'maintenance', 'audits'];
  if (!req.body || collections.some((key) => !Array.isArray(req.body[key]))) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ: cần đủ 6 danh sách dạng mảng.' });
  }
  try {
    const { replaceSnapshot } = await import('./database.js');
    const db = await replaceSnapshot(req.body, req.get('If-Match'));
    res.json({ success: true, message: 'Đã lưu dữ liệu vào PostgreSQL.', db });
  } catch (error) {
    if (error.status === 409 || error.status === 428 || error.status === 422) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

app.post('/api/reset', async (_req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Không tìm thấy API.' });
  }
  try {
    const { replaceSnapshot } = await import('./database.js');
    const db = await replaceSnapshot(initialSample(), _req.get('If-Match'), { allowReset: true });
    res.json({ success: true, message: 'Đã khôi phục dữ liệu mẫu trong PostgreSQL.', db });
  } catch (error) {
    if (error.status === 409 || error.status === 428 || error.status === 422) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ error: 'Origin không được phép.' });
  }
  console.error('[API] Request failed:', error);
  res.status(500).json({ error: 'Lỗi máy chủ. Vui lòng thử lại hoặc liên hệ quản trị viên.' });
});

const start = async () => {
  try {
    const { initializeSchema, pool } = await import('./database.js');
    await initializeSchema();
    await initializeAuth();
    await pool.query('SELECT 1');
    app.listen(PORT, HOST, () => {
      console.log('====================================================');
      console.log(`  IT ASSETMASTER API RUNNING ON PORT ${PORT}`);
      console.log('  Database: PostgreSQL');
      console.log(`  API Endpoint: http://localhost:${PORT}/api/data`);
      console.log(`  Bind address: ${HOST}`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('[Database] Không thể khởi động backend:', error.message);
    console.error('Kiểm tra PostgreSQL đang chạy và DATABASE_URL trong file .env.');
    process.exitCode = 1;
  }
};

start();
