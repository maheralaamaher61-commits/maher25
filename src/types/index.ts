export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other' | 'credit';

export type StockReason =
  | 'purchase'
  | 'sale'
  | 'sale_return'
  | 'purchase_return'
  | 'manual_adjust'
  | 'damage'
  | 'expiry'
  | 'settlement';

export type InstallmentFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'cancelled';

export type ExpiryStatus = 'valid' | 'near_expiry' | 'expired';

export type InvoiceSize = '58mm' | '80mm' | 'A4';

export interface Settings {
  id: number;
  store_name: string;
  store_phone: string;
  store_address: string;
  logo: string | null;
  currency: string;
  accent_color: string;
  invoice_size: InvoiceSize;
  allow_negative_stock: number;
  expiry_warning_days: number;
  installment_notifications: number;
  pin_enabled: number;
  pin_hash: string | null;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  governorate: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  code: string | null;
  barcode: string | null;
  image: string | null;
  category_id: number | null;
  brand: string | null;
  supplier_id: number | null;
  purchase_price: number;
  sale_price: number;
  wholesale_price: number;
  quantity: number;
  unit: string;
  min_stock: number;
  has_expiry: number;
  production_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesInvoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  date: string;
  time: string;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  payment_method: PaymentMethod;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
}

export interface SalesInvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  sale_price: number;
  discount: number;
  total: number;
}

export interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

export interface PurchaseInvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  purchase_price: number;
  total: number;
}

export interface Expense {
  id: number;
  name: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  notes: string | null;
  created_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  type: '+' | '-';
  reason: StockReason;
  invoice_id: number | null;
  balance_after: number;
  date: string;
  time: string;
  created_at: string;
}

export interface CustomerPayment {
  id: number;
  customer_id: number;
  invoice_id: number | null;
  installment_id: number | null;
  amount: number;
  date: string;
  time: string;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

export interface Installment {
  id: number;
  invoice_id: number;
  customer_id: number;
  installment_number: number;
  amount: number;
  paid_amount: number;
  remaining: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  frequency: InstallmentFrequency;
  created_at: string;
}

export interface InstallmentPayment {
  id: number;
  installment_id: number;
  customer_id: number;
  invoice_id: number;
  amount: number;
  date: string;
  time: string;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

export interface DashboardStats {
  today_sales: number;
  today_purchases: number;
  today_expenses: number;
  today_profit: number;
  sales_invoice_count: number;
  purchase_invoice_count: number;
  inventory_value: number;
  total_receivables: number;
  today_due: number;
  overdue_installments: number;
  low_stock_count: number;
  near_expiry_count: number;
  expired_count: number;
}

export interface LedgerEntry {
  date: string;
  time: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
