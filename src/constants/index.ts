export const GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الشرقية',
  'القليوبية',
  'المنوفية',
  'الغربية',
  'كفر الشيخ',
  'البحيرة',
  'الإسماعيلية',
  'بورسعيد',
  'السويس',
  'دمياط',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
] as const;

export const EXPENSE_CATEGORIES = [
  'إيجار',
  'كهرباء',
  'مياه',
  'إنترنت',
  'شحن',
  'إعلانات',
  'صيانة',
  'رواتب',
  'أخرى',
  'تصنيف مخصص',
] as const;

export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'cash', label: 'نقدي' },
  { value: 'card', label: 'بطاقة' },
  { value: 'transfer', label: 'تحويل' },
  { value: 'other', label: 'أخرى' },
  { value: 'credit', label: 'آجل' },
];

export const INSTALLMENT_FREQUENCIES: { value: string; label: string }[] = [
  { value: 'daily', label: 'يومي' },
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'monthly', label: 'شهري' },
  { value: 'custom', label: 'مخصص' },
];

export const STOCK_REASONS: { value: string; label: string }[] = [
  { value: 'purchase', label: 'شراء' },
  { value: 'sale', label: 'بيع' },
  { value: 'sale_return', label: 'إرجاع بيع' },
  { value: 'purchase_return', label: 'إرجاع شراء' },
  { value: 'manual_adjust', label: 'تعديل يدوي' },
  { value: 'damage', label: 'تلف' },
  { value: 'expiry', label: 'انتهاء صلاحية' },
  { value: 'settlement', label: 'تسوية مخزون' },
];

export const ACCENT_COLORS: { name: string; value: string }[] = [
  { name: 'أزرق', value: '#2563EB' },
  { name: 'أخضر', value: '#059669' },
  { name: 'أحمر', value: '#DC2626' },
  { name: 'برتقالي', value: '#EA580C' },
  { name: 'سماوي', value: '#0891B2' },
  { name: 'وردي', value: '#DB2777' },
  { name: 'بنفسجي', value: '#7C3AED' },
  { name: 'رمادي', value: '#4B5563' },
];

export const DEFAULT_SETTINGS = {
  store_name: 'متجري',
  store_phone: '',
  store_address: '',
  logo: null as string | null,
  currency: 'ج.م',
  accent_color: '#2563EB',
  invoice_size: '80mm' as const,
  allow_negative_stock: 0,
  expiry_warning_days: 30,
  installment_notifications: 1,
  pin_enabled: 0,
  pin_hash: null as string | null,
};

export const INVOICE_SIZES = [
  { value: '58mm', label: 'حرارية 58 مم' },
  { value: '80mm', label: 'حرارية 80 مم' },
  { value: 'A4', label: 'A4' },
];

export const NOTIFICATION_REMINDERS = [
  { value: 7, label: 'قبل الاستحقاق بـ 7 أيام' },
  { value: 3, label: 'قبل الاستحقاق بـ 3 أيام' },
  { value: 1, label: 'قبل الاستحقاق بيوم' },
  { value: 0, label: 'يوم الاستحقاق' },
  { value: -1, label: 'بعد التأخير' },
];

export const DEFAULT_CATEGORIES = [
  'مواد غذائية',
  'مشروبات',
  'منظفات',
  'إلكترونيات',
  'ملابس',
  'أدوات',
  'أخرى',
];
