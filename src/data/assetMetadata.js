// Static UI metadata only; this module contains no sample records or database data.
export const CATEGORIES = [
  { id: 'laptop', name: 'Laptop / Máy tính xách tay', icon: 'Laptop' },
  { id: 'pc', name: 'PC / Máy tính để bàn', icon: 'Monitor' },
  { id: 'monitor', name: 'Màn hình hiển thị', icon: 'Tv' },
  { id: 'server', name: 'Máy chủ & Lưu trữ (Server/NAS)', icon: 'Server' },
  { id: 'network', name: 'Thiết bị mạng (Router/Switch/AP)', icon: 'Wifi' },
  { id: 'printer', name: 'Máy in & Thiết bị VP', icon: 'Printer' },
  { id: 'accessory', name: 'Phụ kiện & Linh kiện', icon: 'Keyboard' },
];

export const STATUS_MAP = {
  available: { label: 'Sẵn sàng cấp phát', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  in_use: { label: 'Đang sử dụng', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  borrowed: { label: 'Đang cho mượn', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  maintenance: { label: 'Đang bảo dưỡng / Sửa chữa', color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  broken: { label: 'Hỏng hóc / Chờ xử lý', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  liquidated: { label: 'Đã thanh lý', color: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' },
};
