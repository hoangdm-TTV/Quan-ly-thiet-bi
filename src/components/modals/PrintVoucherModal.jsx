import React from 'react';
import { X, Printer } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const PrintVoucherModal = ({
  isOpen,
  onClose,
  handover,
  device,
  user,
  department,
}) => {
  if (!isOpen || !handover) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header - Not printed */}
        <div className="no-print px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="font-bold text-slate-800 text-sm">
            Xem trước bản in: {handover.type === 'handover' ? 'Biên bản bàn giao thiết bị' : 'Phiếu mượn thiết bị IT'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>In ra giấy A4 / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (A4 style) */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 text-slate-900 bg-white font-serif printable-card">
          {/* Header */}
          <div className="text-center space-y-1 mb-6 border-b pb-4 border-slate-300">
            <p className="font-bold text-xs uppercase tracking-wider font-sans text-slate-600">
              CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ TRUYỀN THÔNG • BỘ PHẬN IT
            </p>
            <h2 className="text-base font-bold uppercase tracking-widest pt-2">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h2>
            <p className="text-xs italic underline">Độc lập - Tự do - Hạnh phúc</p>
            <div className="pt-4">
              <h1 className="text-xl font-bold uppercase tracking-wide">
                {handover.type === 'handover'
                  ? 'BIÊN BẢN BÀN GIAO THIẾT BỊ LÀM VIỆC'
                  : 'PHIẾU XÁC NHẬN MƯỢN THIẾT BỊ IT'}
              </h1>
              <p className="text-xs italic text-slate-600 mt-1">
                Số phiếu: <strong>{handover.code}</strong> • Ngày lập: {formatDate(handover.handoverDate)}
              </p>
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-4 text-xs sm:text-sm font-sans mb-6">
            <p className="italic text-xs">
              Hôm nay, ngày {formatDate(handover.handoverDate)}, tại văn phòng Công ty, chúng tôi gồm có:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-800 uppercase text-xs mb-1">I. ĐẠI DIỆN BÊN GIAO (BỘ PHẬN IT):</p>
                <p>Họ và tên: <strong>{handover.giverName || 'Đại diện IT'}</strong></p>
                <p>Bộ phận: Phòng Công Nghệ Thông Tin</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 uppercase text-xs mb-1">II. ĐẠI DIỆN BÊN NHẬN:</p>
                <p>Họ và tên: <strong>{user ? user.name : '—'}</strong> ({user?.code})</p>
                <p>Phòng ban: {department ? department.name : '—'}</p>
                <p>Chức vụ: {user?.position || 'Nhân viên'}</p>
              </div>
            </div>
          </div>

          {/* Device Table */}
          <div className="mb-6 font-sans">
            <p className="font-bold text-xs uppercase text-slate-800 mb-2">
              III. DANH MỤC THIẾT BỊ VÀ TÀI SẢN BÀN GIAO:
            </p>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                  <th className="p-2 border border-slate-300 text-center w-10">STT</th>
                  <th className="p-2 border border-slate-300">Mã Tài Sản</th>
                  <th className="p-2 border border-slate-300">Tên Thiết Bị / Model</th>
                  <th className="p-2 border border-slate-300">Số Serial</th>
                  <th className="p-2 border border-slate-300">Tình trạng thực tế khi giao</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-300 text-center">1</td>
                  <td className="p-2 border border-slate-300 font-mono font-bold">{device?.code}</td>
                  <td className="p-2 border border-slate-300">
                    <p className="font-bold">{device?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{device?.specs}</p>
                  </td>
                  <td className="p-2 border border-slate-300 font-mono">{device?.serial || '—'}</td>
                  <td className="p-2 border border-slate-300">{handover.condition || 'Máy hoạt động tốt'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Obligations */}
          <div className="text-xs font-sans space-y-1.5 text-slate-700 mb-8 leading-relaxed">
            <p className="font-bold text-slate-800">IV. CAM KẾT VÀ TRÁCH NHIỆM CỦA NGƯỜI SỬ DỤNG:</p>
            <p>1. Người nhận có trách nhiệm bảo quản, giữ gìn tài sản cẩn thận và chỉ sử dụng cho mục đích công việc của Công ty.</p>
            <p>2. Không tự ý tháo dỡ linh kiện, cài đặt phần mềm độc hại hoặc chuyển nhượng thiết bị cho bên thứ ba khi chưa có sự đồng ý của IT.</p>
            <p>3. Khi có hư hỏng, sự cố phát sinh hoặc khi kết thúc hợp đồng làm việc, có trách nhiệm bàn giao hoàn trả đầy đủ cho Bộ phận IT.</p>
            {handover.type === 'borrow' && handover.expectedReturnDate && (
              <p className="font-semibold text-amber-900">
                4. Thời hạn hoàn trả thiết bị chậm nhất vào ngày: {formatDate(handover.expectedReturnDate)}.
              </p>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 text-center font-sans text-xs pt-4 border-t border-slate-200">
            <div>
              <p className="font-bold uppercase">NGƯỜI GIAO</p>
              <p className="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold">{handover.giverName || 'Bộ phận IT'}</p>
            </div>
            <div>
              <p className="font-bold uppercase">NGƯỜI NHẬN</p>
              <p className="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold">{user?.name}</p>
            </div>
            <div>
              <p className="font-bold uppercase">TRƯỞNG PHÒNG IT</p>
              <p className="italic text-[11px] text-slate-500">(Ký và xác nhận)</p>
              <div className="h-16"></div>
              <p className="font-semibold">Nguyễn Văn Hùng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
