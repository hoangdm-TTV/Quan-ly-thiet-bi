import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, Camera, Check, CheckCircle2, Edit2, FileSpreadsheet, Plus, QrCode, Search, Trash2, X, XCircle,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { exportAuditsToExcel } from '../services/storage';
import { STATUS_MAP } from '../data/assetMetadata';
import { QRScannerModal } from './modals/QRScannerModal';

const FIELD_DEFS = [
  { key: 'holder', label: 'Người đang giữ', actualLabel: 'Người đang giữ thực tế' },
  { key: 'department', label: 'Phòng ban', actualLabel: 'Phòng ban thực tế' },
  { key: 'location', label: 'Vị trí', actualLabel: 'Vị trí thực tế' },
  { key: 'status', label: 'Trạng thái thiết bị', actualLabel: 'Tình trạng / trạng thái thực tế' },
];

export const AuditManagement = ({ audits, devices, users = [], departments = [], currentUser, onOpenNewAudit, onEditAudit, onDeleteAudit, onUpdateAuditItem, onFinishAudit }) => {
  const [selectedAuditId, setSelectedAuditId] = useState(audits[0]?.id || null);
  const [tagScannerInput, setTagScannerInput] = useState('');
  const [scannerMessage, setScannerMessage] = useState(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [discrepancyDevice, setDiscrepancyDevice] = useState(null);
  const [reviewDevice, setReviewDevice] = useState(null);
  const [selectedFields, setSelectedFields] = useState({});
  const [actualValues, setActualValues] = useState({});

  const currentAudit = audits.find((audit) => audit.id === selectedAuditId) || audits[0];
  const records = currentAudit?.records || [];
  const recordByDeviceId = useMemo(() => new Map(records.map((record) => [record.deviceId, record])), [records]);
  const counts = useMemo(() => ({
    confirmed: records.filter((record) => record.status === 'confirmed' || record.status === 'matched').length,
    discrepancy: records.filter((record) => record.status === 'discrepancy').length,
    found: records.filter((record) => record.status === 'found').length,
    unverified: records.filter((record) => record.status === 'unverified').length,
  }), [records]);
  const visibleDevices = useMemo(() => {
    const query = deviceSearch.trim().toLocaleLowerCase('vi');
    if (!query) return devices;
    return devices.filter((device) => [device.code, device.name, device.serial, device.location]
      .some((value) => String(value || '').toLocaleLowerCase('vi').includes(query)));
  }, [devices, deviceSearch]);

  const actualInfo = (device) => {
    const holder = users.find((user) => user.id === device.userId);
    const department = departments.find((item) => item.id === device.departmentId);
    return {
      holder: holder?.name || (device.userId ? 'Không tìm thấy nhân sự' : 'Không có người giữ'),
      department: department?.name || (device.departmentId ? 'Không tìm thấy phòng ban' : 'Chưa gán phòng ban'),
      location: device.location || 'Chưa ghi vị trí',
      status: STATUS_MAP[device.status]?.label || device.status || 'Chưa có trạng thái',
    };
  };
  const expectedInfo = (device, record = recordByDeviceId.get(device.id)) => ({ ...actualInfo(device), ...(record?.systemSnapshot || {}) });
  const optionsFor = (field, device) => {
    const baseline = expectedInfo(device)[field.key];
    const unique = (values) => [...new Set(values.filter(Boolean))].map((value) => ({ value, label: value }));
    if (field.key === 'holder') return unique(['Không có người giữ', ...users.map((user) => user.name), baseline]);
    if (field.key === 'department') return unique(['Chưa gán phòng ban', ...departments.map((item) => item.name), baseline]);
    if (field.key === 'location') return unique([...devices.map((item) => item.location), ...departments.map((item) => item.room), baseline]);
    return unique([...Object.values(STATUS_MAP).map((item) => item.label), baseline]);
  };
  const captureMeta = () => ({ checkedAt: new Date().toISOString(), checkedBy: currentUser?.email || 'Admin' });

  const markFound = (device, source = 'Đã ghi nhận tìm thấy khi kiểm kê') => {
    if (!currentAudit || currentAudit.status === 'completed') return;
    const previous = recordByDeviceId.get(device.id) || {};
    return onUpdateAuditItem(currentAudit.id, device.id, {
      ...previous,
      status: ['confirmed', 'matched', 'discrepancy'].includes(previous.status) ? previous.status : 'found',
      note: previous.note || source,
      foundAt: previous.foundAt || new Date().toISOString(),
      foundBy: previous.foundBy || currentUser?.email || 'Admin',
      systemSnapshot: previous.systemSnapshot || actualInfo(device),
    });
  };

  const findAsset = async (rawValue, source) => {
    const normalizedValue = String(rawValue || '').trim();
    let parsedValue = normalizedValue;
    try {
      const url = new URL(normalizedValue);
      parsedValue = url.searchParams.get('code') || url.searchParams.get('assetCode') || url.searchParams.get('serial') || normalizedValue;
    } catch {
      const urlMatch = normalizedValue.match(/[?&](?:code|assetCode|serial)=([^&]+)/i);
      if (urlMatch) {
        try { parsedValue = decodeURIComponent(urlMatch[1]); } catch { parsedValue = urlMatch[1]; }
      }
    }
    const value = parsedValue.toUpperCase();
    const device = devices.find((item) => item.code.toUpperCase() === value || item.serial && item.serial.toUpperCase() === value);
    if (!device || !currentAudit) {
      setScannerMessage({ type: 'error', text: `Không tìm thấy mã hoặc Serial tài sản: ${parsedValue}` });
      return;
    }
    if (currentAudit.status === 'completed') {
      setScannerMessage({ type: 'error', text: 'Đợt kiểm kê đã chốt, không thể ghi nhận thêm.' });
      return;
    }
    await markFound(device, source);
    setReviewDevice(device);
    setScannerMessage({ type: 'success', text: `Đã tìm thấy ${device.code} · ${device.name}. Hãy đối chiếu thông tin rồi xác nhận hoặc ghi chênh lệch.` });
  };

  const handleQuickScan = async (event) => {
    event?.preventDefault();
    if (!tagScannerInput.trim()) return;
    await findAsset(tagScannerInput, 'Đã tìm thấy qua mã nhập / đầu đọc');
    setTagScannerInput('');
  };

  const handleQRDetected = async (value) => {
    setIsQRScannerOpen(false);
    await findAsset(value, 'Đã tìm thấy qua quét QR');
    setTagScannerInput('');
  };

  const confirmCorrect = (device) => {
    if (!currentAudit || currentAudit.status === 'completed') return;
    const previous = recordByDeviceId.get(device.id) || {};
    onUpdateAuditItem(currentAudit.id, device.id, {
      ...previous, status: 'confirmed', note: previous.note || 'Đã xác nhận thông tin hệ thống đúng với thực tế',
      foundAt: previous.foundAt || new Date().toISOString(), foundBy: previous.foundBy || currentUser?.email || 'Admin',
      discrepancies: [], ...captureMeta(),
    });
    setReviewDevice(null);
  };

  const openDiscrepancy = (device) => {
    const record = recordByDeviceId.get(device.id);
    setSelectedFields(Object.fromEntries((record?.discrepancies || []).map((item) => [item.field, true])));
    setActualValues(Object.fromEntries((record?.discrepancies || []).map((item) => [item.field, item.actual])));
    setReviewDevice(null);
    setDiscrepancyDevice(device);
  };

  const saveDiscrepancy = (event) => {
    event.preventDefault();
    const fields = FIELD_DEFS.filter((field) => selectedFields[field.key]);
    if (!fields.length || fields.some((field) => !String(actualValues[field.key] || '').trim())) return;
    const device = discrepancyDevice;
    const previous = recordByDeviceId.get(device.id) || {};
    const expected = expectedInfo(device, previous);
    onUpdateAuditItem(currentAudit.id, device.id, {
      ...previous,
      status: 'discrepancy',
      note: 'Ghi nhận chênh lệch; thông tin tài sản trong hệ thống chưa bị thay đổi.',
      discrepancies: fields.map((field) => ({ field: field.key, label: field.label, expected: expected[field.key], actual: String(actualValues[field.key]).trim() })),
      foundAt: previous.foundAt || new Date().toISOString(), foundBy: previous.foundBy || currentUser?.email || 'Admin',
      ...captureMeta(),
    });
    setDiscrepancyDevice(null);
  };

  const renderResult = (record) => {
    if (record?.status === 'confirmed' || record?.status === 'matched') return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Đã xác nhận đúng</span>;
    if (record?.status === 'discrepancy') return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700"><AlertTriangle className="h-3.5 w-3.5" /> Có chênh lệch</span>;
    if (record?.status === 'found') return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"><CheckCircle2 className="h-3.5 w-3.5" /> Đã tìm thấy · chờ xác nhận</span>;
    if (record?.status === 'unverified') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800"><AlertTriangle className="h-3.5 w-3.5" /> Chưa xác minh</span>;
    return <span className="text-xs italic text-slate-400">Chưa kiểm</span>;
  };

  const renderActions = (device, record) => {
    if (currentAudit.status === 'completed') return <span className="text-xs text-slate-400">Đợt đã chốt</span>;
    if (!record || record.status === 'unverified') return <button onClick={async () => { await markFound(device); setReviewDevice(device); }} className="min-h-10 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50">Đã tìm thấy</button>;
    if (record.status === 'confirmed' || record.status === 'matched') return <span className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Đã xác nhận</span>;
    return <div className="flex flex-wrap gap-2">
      <button onClick={() => confirmCorrect(device)} aria-label={`Xác nhận ${device.code} đúng`} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"><Check className="h-4 w-4" /><span>Xác nhận đúng</span></button>
      <button onClick={() => openDiscrepancy(device)} aria-label={`Ghi chênh lệch ${device.code}`} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-amber-200 px-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"><XCircle className="h-4 w-4" /><span>Ghi chênh lệch</span></button>
    </div>;
  };

  return <div className="min-w-0 space-y-4 sm:space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"><span>Kiểm kê tài sản</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{audits.length} đợt</span></h2><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">Quét để ghi nhận đã tìm thấy; xác nhận hoặc ghi chênh lệch ở bước riêng.</p></div><div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto"><button onClick={onOpenNewAudit} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:flex-none"><Plus className="h-4 w-4" /> Tạo đợt kiểm kê</button>{currentAudit && currentAudit.status !== 'completed' && <><button onClick={() => onEditAudit(currentAudit)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100" title="Sửa thông tin đợt kiểm kê"><Edit2 className="h-4 w-4" /> Sửa</button><button onClick={() => onDeleteAudit(currentAudit)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-700 hover:bg-amber-50" title="Xóa đợt kiểm kê"><Trash2 className="h-4 w-4" /> Xóa</button></>}</div></div>

    {!currentAudit ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><ClipboardCheckIcon /><h3 className="mt-3 font-semibold text-slate-800">Chưa có đợt kiểm kê</h3><p className="mt-1 text-sm text-slate-500">Tạo đợt kiểm kê để bắt đầu đối chiếu danh sách tài sản.</p></div> : <>
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-center"><label className="min-w-0 text-xs font-semibold text-slate-600">Đợt kiểm kê<select value={currentAudit.id} onChange={(e) => setSelectedAuditId(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500">{audits.map((audit) => <option key={audit.id} value={audit.id}>{audit.code} · {audit.title} ({formatDate(audit.auditDate)})</option>)}</select></label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><button onClick={() => exportAuditsToExcel(currentAudit, devices, users, departments)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><FileSpreadsheet className="h-4 w-4" /> Xuất biên bản Excel</button>{currentAudit.status !== 'completed' && <button onClick={() => onFinishAudit(currentAudit.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"><Check className="h-4 w-4" /> Chốt đợt kiểm kê</button>}</div></div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-4"><div><span className="block text-slate-400">Tổ kiểm kê</span><span className="mt-0.5 block font-medium text-slate-700">{currentAudit.auditor || '—'}</span></div><div><span className="block text-slate-400">Ngày thực hiện</span><span className="mt-0.5 block font-medium text-slate-700">{formatDate(currentAudit.auditDate)}</span></div><div className="col-span-2"><span className="block text-slate-400">Kết quả</span><span className="mt-0.5 block font-semibold text-slate-700">{counts.confirmed} xác nhận · {counts.discrepancy} chênh lệch · {counts.found} chờ xác nhận · {counts.unverified} chưa xác minh · {Math.max(devices.length - records.length, 0)} chưa kiểm</span></div><div><span className="block text-slate-400">Trạng thái</span><span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 font-semibold ${currentAudit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{currentAudit.status === 'completed' ? 'Đã hoàn tất' : 'Đang tiến hành'}</span></div>{currentAudit.notes && <div className="col-span-2 border-t border-slate-100 pt-2 text-slate-500 sm:col-span-4">Ghi chú: {currentAudit.notes}</div>}</div></section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm sm:p-4"><div className="flex items-start gap-2"><QrCode className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-slate-900">Quét mã tài sản</h3><p className="mt-1 text-xs leading-5 text-slate-600">Quét QR chỉ ghi nhận tài sản đã tìm thấy. Sau đó cần đối chiếu người giữ, phòng ban, vị trí và trạng thái thiết bị.</p></div></div><div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><form onSubmit={handleQuickScan} className="contents"><input disabled={currentAudit.status === 'completed'} aria-label="Mã tài sản hoặc Serial" type="text" placeholder="Mã tài sản hoặc Serial (VD: TS-001)" value={tagScannerInput} onChange={(e) => setTagScannerInput(e.target.value)} className="min-h-11 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100" /><button disabled={currentAudit.status === 'completed'} type="submit" className="min-h-11 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Ghi nhận tìm thấy</button></form><button type="button" disabled={currentAudit.status === 'completed'} onClick={() => setIsQRScannerOpen(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"><Camera className="h-4 w-4" /> Mở camera quét QR</button></div>{scannerMessage && <p role="status" className={`mt-3 rounded-lg border px-3 py-2 text-xs font-medium ${scannerMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{scannerMessage.text}</p>}</section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"><div><h3 className="text-sm font-bold text-slate-900">Danh sách đối chiếu</h3><p className="mt-1 text-xs text-slate-500">{visibleDevices.length} / {devices.length} tài sản · {counts.confirmed} đã xác nhận · {counts.discrepancy} chênh lệch</p></div><label className="relative block w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={deviceSearch} onChange={(e) => setDeviceSearch(e.target.value)} placeholder="Tìm mã, tên, serial, vị trí" className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label></div>
        <div className="divide-y divide-slate-100 md:hidden">{visibleDevices.map((device) => { const record = recordByDeviceId.get(device.id); const info = expectedInfo(device, record); return <article key={device.id} className={`space-y-3 p-3 ${record?.status === 'confirmed' ? 'bg-emerald-50/30' : record?.status === 'discrepancy' ? 'bg-rose-50/30' : ''}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-sm font-bold text-blue-700">{device.code}</p><p className="mt-1 break-words text-sm font-semibold text-slate-900">{device.name}</p><p className="mt-1 break-all font-mono text-[11px] text-slate-500">Serial: {device.serial || '—'}</p></div><div className="shrink-0">{renderResult(record)}</div></div><div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-slate-50 p-2.5 text-xs"><InfoLine label="Người giữ (hệ thống)" value={info.holder} /><InfoLine label="Phòng ban (hệ thống)" value={info.department} /><InfoLine label="Vị trí (hệ thống)" value={info.location} /><InfoLine label="Trạng thái thiết bị" value={info.status} /></div>{record?.discrepancies?.length > 0 && <div className="space-y-1 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs">{record.discrepancies.map((item) => <p key={item.field}><b>{item.label}:</b> hệ thống “{item.expected}” → thực tế “{item.actual}”</p>)}</div>}<div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">{record?.foundAt ? <span>Tìm thấy: {formatDateTime(record.foundAt)} · {record.foundBy || '—'}</span> : <span>Chưa ghi nhận quét</span>}{record?.checkedAt && <span>Đối chiếu: {formatDateTime(record.checkedAt)} · {record.checkedBy || '—'}</span>}</div><div className="flex justify-end">{renderActions(device, record)}</div></article>; })}</div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1150px] text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600"><tr><th className="px-3 py-3">Mã TS / Thiết bị</th><th className="px-3 py-3">Người giữ</th><th className="px-3 py-3">Phòng ban</th><th className="px-3 py-3">Vị trí</th><th className="px-3 py-3">Trạng thái thiết bị</th><th className="px-3 py-3">Kiểm kê</th><th className="px-3 py-3">Ghi nhận</th><th className="px-3 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleDevices.map((device) => { const record = recordByDeviceId.get(device.id); const info = expectedInfo(device, record); return <tr key={device.id}><td className="px-3 py-3"><p className="font-mono font-bold text-blue-700">{device.code}</p><p className="mt-1 max-w-48 truncate font-semibold text-slate-800">{device.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{device.serial || '—'}</p></td><td className="px-3 py-3">{info.holder}</td><td className="px-3 py-3">{info.department}</td><td className="px-3 py-3">{info.location}</td><td className="px-3 py-3">{info.status}</td><td className="px-3 py-3">{renderResult(record)}{record?.discrepancies?.length > 0 && <ul className="mt-2 space-y-1 text-[11px] text-rose-700">{record.discrepancies.map((item) => <li key={item.field}>{item.label}: {item.expected} → {item.actual}</li>)}</ul>}</td><td className="px-3 py-3 text-[11px] text-slate-500">{record?.foundAt ? <><p>Tìm thấy: {formatDateTime(record.foundAt)}</p><p>{record.foundBy || '—'}</p></> : '—'}{record?.checkedAt && <><p className="mt-1">Đối chiếu: {formatDateTime(record.checkedAt)}</p><p>{record.checkedBy || '—'}</p></>}</td><td className="px-3 py-3 text-right">{renderActions(device, record)}</td></tr>; })}</tbody></table></div>
        {visibleDevices.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">Không tìm thấy tài sản phù hợp.</p>}
      </section>
    </>}

    {isQRScannerOpen && <QRScannerModal onDetected={handleQRDetected} onClose={() => setIsQRScannerOpen(false)} />}
    {reviewDevice && <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReviewDevice(null); }}><section className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="audit-review-title"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Tài sản đã tìm thấy</p><h3 id="audit-review-title" className="mt-1 text-lg font-bold text-slate-900">{reviewDevice.code} · {reviewDevice.name}</h3><p className="mt-1 font-mono text-xs text-slate-500">Serial: {reviewDevice.serial || '—'}</p></div><button type="button" aria-label="Đóng" onClick={() => setReviewDevice(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm text-slate-600">Đối chiếu thông tin hệ thống với thiết bị đang kiểm kê:</p><div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2"><InfoLine label="Người giữ theo hệ thống" value={expectedInfo(reviewDevice).holder} /><InfoLine label="Phòng ban theo hệ thống" value={expectedInfo(reviewDevice).department} /><InfoLine label="Vị trí theo hệ thống" value={expectedInfo(reviewDevice).location} /><InfoLine label="Trạng thái thiết bị" value={expectedInfo(reviewDevice).status} /></div>{(recordByDeviceId.get(reviewDevice.id)?.status === 'confirmed' || recordByDeviceId.get(reviewDevice.id)?.status === 'matched') ? <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Tài sản đã được xác nhận đúng trong đợt này.</span><button type="button" onClick={() => setReviewDevice(null)} className="min-h-10 rounded-lg border border-emerald-200 bg-white px-3 text-sm">Đóng</button></div> : <><p className="mt-3 text-xs text-slate-500">Chọn kết quả sau khi đã kiểm tra người giữ, phòng ban, vị trí và tình trạng máy.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => confirmCorrect(reviewDevice)} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" /> Xác nhận thông tin đúng</button><button type="button" onClick={() => openDiscrepancy(reviewDevice)} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100"><AlertTriangle className="h-4 w-4" /> Ghi nhận chênh lệch</button></div></>}</section></div>}
    {discrepancyDevice && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDiscrepancyDevice(null); }}><form onSubmit={saveDiscrepancy} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="audit-discrepancy-title"><div className="flex items-start justify-between gap-3"><div><h3 id="audit-discrepancy-title" className="text-lg font-bold text-slate-900">Ghi nhận chênh lệch</h3><p className="mt-1 text-sm text-slate-600">{discrepancyDevice.code} · {discrepancyDevice.name}</p></div><button type="button" aria-label="Đóng" onClick={() => setDiscrepancyDevice(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Chọn mục bị lệch rồi chọn giá trị thực tế từ dữ liệu hệ thống. Biên bản không tự sửa thông tin gốc của tài sản.</p><div className="mt-4 space-y-3">{FIELD_DEFS.map((field) => { const expected = expectedInfo(discrepancyDevice)[field.key]; return <label key={field.key} className="block rounded-xl border border-slate-200 p-3"><span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" checked={Boolean(selectedFields[field.key])} onChange={(event) => setSelectedFields((value) => ({ ...value, [field.key]: event.target.checked }))} className="h-4 w-4 accent-blue-600" />{field.label} bị lệch</span><span className="mt-2 block text-xs text-slate-500">Theo hệ thống: {expected}</span>{selectedFields[field.key] && <select required value={actualValues[field.key] || ''} onChange={(event) => setActualValues((value) => ({ ...value, [field.key]: event.target.value }))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500"><option value="" disabled>Chọn {field.actualLabel.toLocaleLowerCase('vi')}</option>{optionsFor(field, discrepancyDevice).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}</label>; })}</div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setDiscrepancyDevice(null)} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Hủy</button><button type="submit" disabled={!Object.values(selectedFields).some(Boolean) || FIELD_DEFS.some((field) => selectedFields[field.key] && !String(actualValues[field.key] || '').trim())} className="min-h-11 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Lưu chênh lệch</button></div></form></div>}
  </div>;
};

const InfoLine = ({ label, value }) => <div className="min-w-0"><p className="text-[10px] font-medium text-slate-500">{label}</p><p className="mt-0.5 break-words text-slate-800">{value}</p></div>;
const formatDateTime = (value) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const ClipboardCheckIcon = () => <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>;
