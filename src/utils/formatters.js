export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const getCategoryIcon = (category) => {
  switch (category) {
    case 'laptop':
      return 'Laptop';
    case 'pc':
      return 'Monitor';
    case 'monitor':
      return 'Tv';
    case 'server':
      return 'Server';
    case 'network':
      return 'Wifi';
    case 'printer':
      return 'Printer';
    default:
      return 'Cpu';
  }
};
