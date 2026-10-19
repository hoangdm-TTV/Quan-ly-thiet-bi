import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
    const result = await pool.query('SELECT COUNT(*)::int AS total_devices FROM devices');
    res.json({ status: 'ok', database: 'postgresql', totalDevices: result.rows[0].total_devices });
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
    const db = await replaceSnapshot(req.body);
    res.json({ success: true, message: 'Đã lưu dữ liệu vào PostgreSQL.', db });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reset', async (_req, res, next) => {
  try {
    const { replaceSnapshot } = await import('./database.js');
    const db = await replaceSnapshot(initialSample());
    res.json({ success: true, message: 'Đã khôi phục dữ liệu mẫu trong PostgreSQL.', db });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error('[API] Request failed:', error);
  res.status(500).json({ error: error.message || 'Lỗi máy chủ.' });
});

const start = async () => {
  try {
    const { initializeSchema, pool } = await import('./database.js');
    await initializeSchema();
    await pool.query('SELECT 1');
    app.listen(PORT, '0.0.0.0', () => {
      console.log('====================================================');
      console.log(`  IT ASSETMASTER API RUNNING ON PORT ${PORT}`);
      console.log('  Database: PostgreSQL');
      console.log(`  API Endpoint: http://localhost:${PORT}/api/data`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('[Database] Không thể khởi động backend:', error.message);
    console.error('Kiểm tra PostgreSQL đang chạy và DATABASE_URL trong file .env.');
    process.exitCode = 1;
  }
};

start();
