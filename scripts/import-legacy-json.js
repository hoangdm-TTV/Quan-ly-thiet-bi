import 'dotenv/config';

const { initializeSchema, importLegacyJsonIfEmpty, closePool } = await import('../server/database.js');
try {
  await initializeSchema();
  const result = await importLegacyJsonIfEmpty();
  console.log('Import JSON -> PostgreSQL thành công:');
  console.table(result.counts);
  if (result.warnings.clearedUserReferences || result.warnings.clearedDepartmentReferences) {
    console.warn('Cảnh báo: các liên kết không có bản ghi đích đã được đặt thành NULL để bảo đảm khóa ngoại PostgreSQL.');
    console.warn(JSON.stringify(result.warnings, null, 2));
    console.warn('File JSON gốc vẫn được giữ nguyên; hãy đối chiếu/cập nhật lại các liên kết sau khi import.');
  }
} catch (error) {
  console.error('Import thất bại:', error.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
