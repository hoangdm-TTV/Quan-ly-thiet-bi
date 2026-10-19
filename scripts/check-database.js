import 'dotenv/config';

let pool;

const describeConnectionError = (error) => {
  switch (error.code) {
    case 'ECONNREFUSED':
      return 'Không kết nối được PostgreSQL. Hãy kiểm tra dịch vụ đang chạy, địa chỉ host và cổng trong DATABASE_URL.';
    case '28P01':
      return 'PostgreSQL từ chối mật khẩu. Hãy kiểm tra username/password trong DATABASE_URL.';
    case '3D000':
      return 'Database được ghi trong DATABASE_URL chưa tồn tại. Hãy tạo database trước rồi chạy lại.';
    case '42501':
      return 'Tài khoản PostgreSQL chưa có quyền truy cập database hoặc tạo/đọc bảng.';
    case 'ENOTFOUND':
      return 'Không tìm thấy máy chủ PostgreSQL theo hostname trong DATABASE_URL.';
    default:
      return error.message || 'Lỗi không xác định khi kết nối PostgreSQL.';
  }
};

try {
  if (!process.env.DATABASE_URL) {
    throw new Error('Thiếu DATABASE_URL. Tạo file .env từ .env.example rồi điền thông tin PostgreSQL.');
  }

  ({ pool } = await import('../server/database.js'));
  const { rows } = await pool.query(`
    SELECT current_database() AS database, current_user AS username,
           to_regclass('public.devices') IS NOT NULL AS schema_initialized
  `);

  console.log('Kết nối PostgreSQL thành công.');
  console.log(`Database: ${rows[0].database}`);
  console.log(`Tài khoản: ${rows[0].username}`);
  console.log(`Schema ứng dụng: ${rows[0].schema_initialized ? 'đã khởi tạo' : 'chưa khởi tạo (server sẽ tự tạo khi khởi động)'}`);
} catch (error) {
  console.error(`Kiểm tra PostgreSQL thất bại: ${describeConnectionError(error)}`);
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}
