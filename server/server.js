import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_USERS,
  INITIAL_DEVICES,
  INITIAL_HANDOVERS,
  INITIAL_MAINTENANCE,
  INITIAL_AUDITS,
} from '../src/data/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Path to physical database file
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database file if not exists
const initializeDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      devices: INITIAL_DEVICES,
      users: INITIAL_USERS,
      departments: INITIAL_DEPARTMENTS,
      handovers: INITIAL_HANDOVERS,
      maintenance: INITIAL_MAINTENANCE,
      audits: INITIAL_AUDITS,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log(`[Database] Đã tạo mới file CSDL vật lý tại: ${DB_FILE}`);
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Database] Lỗi đọc file CSDL, khôi phục từ mẫu:', err);
    return null;
  }
};

let db = initializeDb();

// Helper to save DB to disk
const saveDb = () => {
  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
};

// --- REST API ENDPOINTS ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', file: DB_FILE, totalDevices: db?.devices?.length || 0 });
});

// Get all data
app.get('/api/data', (req, res) => {
  res.json(db);
});

// Full update / restore data
app.post('/api/data', (req, res) => {
  if (!req.body.devices || !req.body.users) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
  db = { ...req.body, updatedAt: new Date().toISOString() };
  saveDb();
  res.json({ success: true, message: 'Đã lưu CSDL vào file thành công', db });
});

// Reset to default sample
app.post('/api/reset', (req, res) => {
  db = {
    devices: INITIAL_DEVICES,
    users: INITIAL_USERS,
    departments: INITIAL_DEPARTMENTS,
    handovers: INITIAL_HANDOVERS,
    maintenance: INITIAL_MAINTENANCE,
    audits: INITIAL_AUDITS,
    updatedAt: new Date().toISOString(),
  };
  saveDb();
  res.json({ success: true, message: 'Đã reset về dữ liệu ban đầu', db });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  BACKEND CSDL IT ASSETMASTER DANG CHAY TAI PORT ${PORT}`);
  console.log(`  File du lieu vat ly: ${DB_FILE}`);
  console.log(`  API Endpoint: http://localhost:${PORT}/api/data`);
  console.log(`====================================================`);
});
