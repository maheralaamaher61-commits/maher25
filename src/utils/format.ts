export function formatCurrency(amount: number, currency = 'ج.م'): string {
  const formatted = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatTime(time: string): string {
  return time;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function currentTime(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function getExpiryStatus(expiryDate: string | null, warningDays: number): 'valid' | 'near_expiry' | 'expired' | 'none' {
  if (!expiryDate) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= warningDays) return 'near_expiry';
  return 'valid';
}

export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

export function getMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'نقدي',
    card: 'بطاقة',
    transfer: 'تحويل',
    other: 'أخرى',
    credit: 'آجل',
  };
  return labels[method] ?? method;
}

export function getStockReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    purchase: 'شراء',
    sale: 'بيع',
    sale_return: 'إرجاع بيع',
    purchase_return: 'إرجاع شراء',
    manual_adjust: 'تعديل يدوي',
    damage: 'تلف',
    expiry: 'انتهاء صلاحية',
    settlement: 'تسوية مخزون',
  };
  return labels[reason] ?? reason;
}

export function getInvoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'مدفوعة',
    partial: 'مدفوعة جزئيًا',
    unpaid: 'غير مدفوعة',
    cancelled: 'ملغاة',
  };
  return labels[status] ?? status;
}

export function getInstallmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'قيد الانتظار',
    partial: 'مدفوع جزئيًا',
    paid: 'مدفوع',
    overdue: 'متأخر',
  };
  return labels[status] ?? status;
}
