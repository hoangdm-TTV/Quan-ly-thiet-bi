import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileSpreadsheet,
  Printer,
  Barcode,
  Calendar,
  Eye,
  Check,
  XCircle,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { exportAuditsToExcel } from '../services/storage';

export const AuditManagement = ({
  audits,
  devices,
  onOpenNewAudit,
  onUpdateAuditItem,
  onFinishAudit,
}) => {
  const [selectedAuditId, setSelectedAuditId] = useState(audits[0]?.id || null);
  const [tagScannerInput, setTagScannerInput] = useState('');
  const [scannerMessage, setScannerMessage] = useState(null);

  const currentAudit = audits.find((a) => a.id === selectedAuditId) || audits[0];

  // Quick scan / check item
  const handleQuickScan = (e) => {
    e.preventDefault();
    if (!tagScannerInput.trim() || !currentAudit) return;

    const inputCode = tagScannerInput.trim().toUpperCase();
    const dev = devices.find(
      (d) =>
        d.code.toUpperCase() === inputCode ||
        (d.serial && d.serial.toUpperCase() === inputCode)
    );

    if (!dev) {
      setScannerMessage({
        type: 'error',
        text: `Không tìm thấy mã hoặc Serial "${tagScannerInput}" trong hệ thống!`,
      });
      setTagScannerInput('');
      return;
    }

    // Mark as matched in current audit
    onUpdateAuditItem(currentAudit.id, dev.id, 'matched', 'Đã quét kiểm tra thực tế khớp');
    setScannerMessage({
      type: 'success',
      text: `✓ Đã kiểm kê thành công thiết bị: ${dev.code} - ${dev.name}`,
    });
    setTagScannerInput('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Kiểm Kê Tài Sản & Đối Chiếu Thiết Bị</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              {audits.length} đợt kiểm kê
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đối chiếu số lượng thực tế với phần mềm, phát hiện chênh lệch và xuất biên bản kiểm kê
          </p>
        </div>

        <button
          onClick={onOpenNewAudit}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đợt kiểm kê mới</span>
        </button>
      </div>

      {/* Select Audit Dropdown / Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase">Đợt kiểm kê:</span>
          <select
            value={currentAudit?.id || ''}
            onChange={(e) => setSelectedAuditId(e.target.value)}
            className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-slate-800"
          >
            {audits.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} - {a.title} ({formatDate(a.auditDate)})
              </option>
            ))}
          </select>
        </div>

        {currentAudit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAuditsToExcel(currentAudit, devices)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất biên bản Excel</span>
            </button>

            {currentAudit.status !== 'completed' && (
              <button
                onClick={() => onFinishAudit(currentAudit.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
              >
                <Check className="w-4 h-4" />
                <span>Chốt hoàn tất đợt kiểm kê</span>
              </button>
            )}
          </div>
        )}
      </div>

      {currentAudit && (
        <>
          {/* Audit Info & Quick Tag Scanner Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Info summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Tổ kiểm kê:</span>
                <span className="font-semibold text-slate-800">{currentAudit.auditor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Ngày thực hiện:</span>
                <span className="text-slate-700">{formatDate(currentAudit.auditDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Trạng thái đợt:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    currentAudit.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {currentAudit.status === 'completed' ? 'Đã hoàn thành chốt sổ' : 'Đang tiến hành'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-slate-500">
                Ghi chú: {currentAudit.notes || 'Không có ghi chú'}
              </div>
            </div>

            {/* Quick Barcode Scanner simulator */}
            <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-blue-950 p-4 rounded-xl text-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Barcode className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Quét nhanh mã Barcode / QR / Serial
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Dùng đầu đọc mã vạch quét tem tài sản trên máy tính để tự động tích kiểm tra.
                </p>
              </div>

              <form onSubmit={handleQuickScan} className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập hoặc quét mã tài sản (vd: TS-001, C02G3498MD6T...)"
                  value={tagScannerInput}
                  onChange={(e) => setTagScannerInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  Kiểm tra
                </button>
              </form>

              {scannerMessage && (
                <div
                  className={`mt-2 p-1.5 rounded-lg text-xs font-medium ${
                    scannerMessage.type === 'success'
                      ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/30'
                      : 'bg-rose-900/60 text-rose-200 border border-rose-500/30'
                  }`}
                >
                  {scannerMessage.text}
                </div>
              )}
            </div>
          </div>

          {/* Device Reconciliation Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Danh Sách Thiết Bị Cần Đối Chiếu ({devices.length} tài sản)
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Đã khớp: {
                    devices.filter((d) => {
                      const rec = (currentAudit.records || []).find((r) => r.deviceId === d.id);
                      return rec && rec.status === 'matched';
                    }).length
                  }
                </span>
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Lệch/Lỗi: {
                    devices.filter((d) => {
                      const rec = (currentAudit.records || []).find((r) => r.deviceId === d.id);
                      return rec && rec.status === 'discrepancy';
                    }).length
                  }
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Mã TS</th>
                    <th className="py-3 px-4">Tên Thiết Bị & Serial</th>
                    <th className="py-3 px-4">Vị trí hệ thống</th>
                    <th className="py-3 px-4">Kết quả đối chiếu</th>
                    <th className="py-3 px-4">Ghi chú thực tế khi kiểm</th>
                    <th className="py-3 px-4 text-right">Đánh dấu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devices.map((dev) => {
                    const record = (currentAudit.records || []).find((r) => r.deviceId === dev.id);
                    const isMatched = record?.status === 'matched';
                    const isDiscrepancy = record?.status === 'discrepancy';

                    return (
                      <tr
                        key={dev.id}
                        className={`transition-colors ${
                          isMatched ? 'bg-emerald-50/20' : isDiscrepancy ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {dev.code}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{dev.name}</p>
                          <p className="font-mono text-[11px] text-slate-500">Serial: {dev.serial || '—'}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          {dev.location || 'Kho IT'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isMatched ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Khớp thực tế
                            </span>
                          ) : isDiscrepancy ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              Lệch / Cần xử lý
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa kiểm kê</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Nhập ghi chú kiểm kê..."
                            defaultValue={record?.note || ''}
                            onBlur={(e) =>
                              onUpdateAuditItem(
                                currentAudit.id,
                                dev.id,
                                record?.status || 'matched',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-xs rounded bg-slate-50 border border-slate-200 focus:bg-white outline-none"
                          />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                onUpdateAuditItem(
                                  currentAudit.id,
                                  dev.id,
                                  'matched',
                                  record?.note || 'Đã kiểm tra khớp'
                                )
                              }
                              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                                isMatched
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                              }`}
                              title="Xác nhận khớp"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() =>
                                onUpdateAuditItem(
                                  currentAudit.id,
                                  dev.id,
                                  'discrepancy',
                                  record?.note || 'Phát hiện lỗi / Lệch vị trí'
                                )
                              }
                              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                                isDiscrepancy
                                  ? 'bg-rose-600 text-white'
                                  : 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                              }`}
                              title="Báo lệch tài sản"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
