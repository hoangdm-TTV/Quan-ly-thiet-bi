import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(scriptDir, '..', 'server', 'seed-existing-data.sql');
let pool;

try {
  ({ pool } = await import('../server/database.js'));
  const sql = await fs.readFile(seedPath, 'utf8');
  await pool.query(sql);
  console.log('Đã nạp dữ liệu ban đầu từ server/seed-existing-data.sql.');
  console.log('Kết quả: 7 phòng ban, 3 nhân sự, 14 thiết bị, 5 phiếu bàn giao, 4 phiếu bảo trì, 3 đợt kiểm kê, 25 dòng kiểm kê.');
  console.warn('18 liên kết tới ID nhân sự không còn tồn tại đã được đặt NULL; cần đối chiếu và gán lại nếu biết người tương ứng.');
} catch (error) {
  console.error(`Không thể nạp dữ liệu SQL: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}
