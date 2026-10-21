export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getLocalDateInputValue = (date = new Date()) => {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

export const getCategoryIcon = (category) => {
  switch (category) {
    case "laptop":
      return "Laptop";
    case "pc":
      return "Monitor";
    case "monitor":
      return "Tv";
    case "server":
      return "Server";
    case "network":
      return "Wifi";
    case "printer":
      return "Printer";
    default:
      return "Cpu";
  }
};
// Sinh mã tuần tự: lấy số lớn nhất đang có với cùng tiền tố (và năm) rồi +1.
// Ví dụ: getNextCode(codes, 'TS') -> TS-015 ; getNextCode(codes, 'BT', { year: 2026 }) -> BT-2026-001
export const getNextCode = (
  existingCodes = [],
  prefix,
  { year, pad = 3 } = {},
) => {
  const head = year ? `${prefix}-${year}-` : `${prefix}-`;
  let max = 0;
  for (const code of existingCodes) {
    const text = String(code || "")
      .trim()
      .toUpperCase();
    if (!text.startsWith(head)) continue;
    const suffix = text.slice(head.length);
    if (/^\d+$/.test(suffix)) max = Math.max(max, Number(suffix));
  }
  return `${head}${String(max + 1).padStart(pad, "0")}`;
};

// Dùng khi mã gốc có thể đã tồn tại (ví dụ mã đợt kiểm kê theo quý): thêm hậu tố -2, -3...
export const getUniqueCode = (baseCode, existingCodes = []) => {
  const used = new Set(
    existingCodes.map((code) =>
      String(code || "")
        .trim()
        .toUpperCase(),
    ),
  );
  if (!used.has(baseCode.toUpperCase())) return baseCode;
  let n = 2;
  while (used.has(`${baseCode}-${n}`.toUpperCase())) n += 1;
  return `${baseCode}-${n}`;
};
