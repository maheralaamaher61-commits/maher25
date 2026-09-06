import { getDB } from './migrations';
import type {
  Category,
  Brand,
  Supplier,
  Customer,
  Product,
  SalesInvoice,
  SalesInvoiceItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  Expense,
  StockMovement,
  CustomerPayment,
  Installment,
  InstallmentPayment,
  Settings,
  DashboardStats,
  LedgerEntry,
  PaymentMethod,
  StockReason,
  InstallmentFrequency,
  InvoiceStatus,
} from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants';

function nowDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nowTime(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function nowDateTime(): string {
  return new Date().toISOString();
}

// ============ Settings ============

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const row = await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE id = 1');
  return row!;
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  const db = await getDB();
  const keys = Object.keys(updates);
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (updates as any)[k]);
  await db.runAsync(`UPDATE settings SET ${setClause} WHERE id = 1`, values);
}

// ============ Categories ============

export async function getCategories(): Promise<Category[]> {
  const db = await getDB();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name');
}

export async function addCategory(name: string): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync('INSERT INTO categories (name) VALUES (?)', [name]);
  return result.lastInsertRowId as number;
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function seedDefaultCategories(): Promise<void> {
  const db = await getDB();
  for (const name of DEFAULT_CATEGORIES) {
    await db.runAsync('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name]);
  }
}

// ============ Brands ============

export async function getBrands(): Promise<Brand[]> {
  const db = await getDB();
  return db.getAllAsync<Brand>('SELECT * FROM brands ORDER BY name');
}

export async function addBrand(name: string): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync('INSERT INTO brands (name) VALUES (?)', [name]);
  return result.lastInsertRowId as number;
}

// ============ Suppliers ============

export async function getSuppliers(): Promise<Supplier[]> {
  const db = await getDB();
  return db.getAllAsync<Supplier>('SELECT * FROM suppliers ORDER BY name');
}

export async function getSupplier(id: number): Promise<Supplier | null> {
  const db = await getDB();
  return (await db.getFirstAsync<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id])) ?? null;
}

export async function addSupplier(s: Omit<Supplier, 'id' | 'created_at'>): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    'INSERT INTO suppliers (name, company, phone, address, tax_number, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [s.name, s.company, s.phone, s.address, s.tax_number, s.notes],
  );
  return result.lastInsertRowId as number;
}

export async function updateSupplier(id: number, s: Partial<Supplier>): Promise<void> {
  const db = await getDB();
  const keys = Object.keys(s).filter((k) => k !== 'id' && k !== 'created_at');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (s as any)[k]);
  await db.runAsync(`UPDATE suppliers SET ${setClause} WHERE id = ?`, [...values, id]);
}

export async function deleteSupplier(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM suppliers WHERE id = ?', [id]);
}

export async function getSupplierStats(id: number) {
  const db = await getDB();
  const totals = await db.getFirstAsync<{ total: number; count: number; last_date: string | null }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count, MAX(date) as last_date
     FROM purchase_invoices WHERE supplier_id = ?`,
    [id],
  );
  const products = await db.getAllAsync<{ product_name: string; total: number; qty: number }>(
    `SELECT pii.product_name, SUM(pii.quantity) as qty, SUM(pii.total) as total
     FROM purchase_invoice_items pii
     JOIN purchase_invoices pi ON pii.invoice_id = pi.id
     WHERE pi.supplier_id = ?
     GROUP BY pii.product_id
     ORDER BY total DESC
     LIMIT 20`,
    [id],
  );
  const invoices = await db.getAllAsync<PurchaseInvoice>(
    'SELECT * FROM purchase_invoices WHERE supplier_id = ? ORDER BY date DESC, id DESC LIMIT 50',
    [id],
  );
  return { ...totals!, products, invoices };
}

// ============ Customers ============

export async function getCustomers(search?: string): Promise<Customer[]> {
  const db = await getDB();
  if (search) {
    return db.getAllAsync<Customer>(
      'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name',
      [`%${search}%`, `%${search}%`],
    );
  }
  return db.getAllAsync<Customer>('SELECT * FROM customers ORDER BY name');
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const db = await getDB();
  return (await db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', [id])) ?? null;
}

export async function addCustomer(c: Omit<Customer, 'id' | 'created_at'>): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    'INSERT INTO customers (name, phone, governorate, address, notes) VALUES (?, ?, ?, ?, ?)',
    [c.name, c.phone, c.governorate, c.address, c.notes],
  );
  return result.lastInsertRowId as number;
}

export async function updateCustomer(id: number, c: Partial<Customer>): Promise<void> {
  const db = await getDB();
  const keys = Object.keys(c).filter((k) => k !== 'id' && k !== 'created_at');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (c as any)[k]);
  await db.runAsync(`UPDATE customers SET ${setClause} WHERE id = ?`, [...values, id]);
}

export async function deleteCustomer(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
}

export async function getCustomerStats(id: number) {
  const db = await getDB();
  const sales = await db.getFirstAsync<{ total: number; paid: number; remaining: number; count: number; incomplete: number; last_date: string | null }>(
    `SELECT COALESCE(SUM(total), 0) as total, COALESCE(SUM(paid), 0) as paid,
            COALESCE(SUM(remaining), 0) as remaining, COUNT(*) as count,
            SUM(CASE WHEN status != 'paid' THEN 1 ELSE 0 END) as incomplete,
            MAX(date) as last_date
     FROM sales_invoices WHERE customer_id = ?`,
    [id],
  );
  const installments = await db.getFirstAsync<{ total: number; pending: number; overdue: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total,
            COALESCE(SUM(CASE WHEN status != 'paid' AND status != 'overdue' THEN remaining ELSE 0 END), 0) as pending,
            COALESCE(SUM(CASE WHEN status = 'overdue' THEN remaining ELSE 0 END), 0) as overdue
     FROM installments WHERE customer_id = ?`,
    [id],
  );
  return { ...sales!, ...installments! };
}

export async function getCustomerLedger(id: number): Promise<LedgerEntry[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    date: string;
    time: string;
    description: string;
    debit: number;
    credit: number;
  }>(
    `SELECT date, time, 'فاتورة بيع رقم ' || invoice_number as description, total as debit, 0 as credit
     FROM sales_invoices WHERE customer_id = ? AND status != 'cancelled'
     UNION ALL
     SELECT date, time, 'دفعة' as description, 0 as debit, amount as credit
     FROM customer_payments WHERE customer_id = ?
     ORDER BY date ASC, time ASC`,
    [id, id],
  );

  let balance = 0;
  return rows.map((r) => {
    balance += r.debit - r.credit;
    return { ...r, balance };
  });
}

// ============ Products ============

export async function getProducts(filters?: {
  search?: string;
  category_id?: number;
  supplier_id?: number;
  lowStock?: boolean;
  expiryFilter?: 'valid' | 'near_expiry' | 'expired';
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  const db = await getDB();
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (filters?.search) {
    sql += ' AND (name LIKE ? OR code LIKE ? OR barcode LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }
  if (filters?.category_id) {
    sql += ' AND category_id = ?';
    params.push(filters.category_id);
  }
  if (filters?.supplier_id) {
    sql += ' AND supplier_id = ?';
    params.push(filters.supplier_id);
  }
  if (filters?.lowStock) {
    sql += ' AND quantity <= min_stock';
  }
  if (filters?.expiryFilter === 'expired') {
    sql += ' AND has_expiry = 1 AND expiry_date < date("now")';
  } else if (filters?.expiryFilter === 'near_expiry') {
    const settings = await getSettings();
    sql += ` AND has_expiry = 1 AND expiry_date >= date("now") AND expiry_date <= date("now", "+${settings.expiry_warning_days} days")`;
  } else if (filters?.expiryFilter === 'valid') {
    sql += ' AND has_expiry = 1 AND expiry_date > date("now", "+30 days")';
  }

  sql += ' ORDER BY name';
  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) {
      sql += ` OFFSET ${filters.offset}`;
    }
  }

  return db.getAllAsync<Product>(sql, params);
}

export async function getProduct(id: number): Promise<Product | null> {
  const db = await getDB();
  return (await db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', [id])) ?? null;
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const db = await getDB();
  return (await db.getFirstAsync<Product>('SELECT * FROM products WHERE barcode = ?', [barcode])) ?? null;
}

export async function addProduct(p: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO products (name, code, barcode, image, category_id, brand, supplier_id, purchase_price, sale_price, wholesale_price, quantity, unit, min_stock, has_expiry, production_date, expiry_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.name, p.code, p.barcode, p.image, p.category_id, p.brand, p.supplier_id,
      p.purchase_price, p.sale_price, p.wholesale_price, p.quantity, p.unit,
      p.min_stock, p.has_expiry, p.production_date, p.expiry_date, p.notes,
    ],
  );
  if (p.quantity > 0) {
    await recordStockMovement(result.lastInsertRowId as number, p.name, p.quantity, '+', 'settlement', null, p.quantity);
  }
  return result.lastInsertRowId as number;
}

export async function updateProduct(id: number, p: Partial<Product>): Promise<void> {
  const db = await getDB();
  const keys = Object.keys(p).filter((k) => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
  if (keys.length === 0) return;
  keys.push('updated_at');
  (p as any).updated_at = nowDateTime();
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (p as any)[k]);
  await db.runAsync(`UPDATE products SET ${setClause} WHERE id = ?`, [...values, id]);
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
}

export async function getProductCount(): Promise<number> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products');
  return row?.count ?? 0;
}

// ============ Stock Movements ============

export async function recordStockMovement(
  productId: number,
  productName: string,
  quantity: number,
  type: '+' | '-',
  reason: StockReason,
  invoiceId: number | null,
  balanceAfter: number,
): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO stock_movements (product_id, product_name, quantity, type, reason, invoice_id, balance_after, date, time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [productId, productName, quantity, type, reason, invoiceId, balanceAfter, nowDate(), nowTime()],
  );
}

export async function getStockMovements(filters?: {
  productId?: number;
  limit?: number;
  offset?: number;
}): Promise<StockMovement[]> {
  const db = await getDB();
  let sql = 'SELECT * FROM stock_movements WHERE 1=1';
  const params: any[] = [];
  if (filters?.productId) {
    sql += ' AND product_id = ?';
    params.push(filters.productId);
  }
  sql += ' ORDER BY id DESC';
  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) {
      sql += ` OFFSET ${filters.offset}`;
    }
  }
  return db.getAllAsync<StockMovement>(sql, params);
}

export async function adjustStock(productId: number, delta: number, reason: StockReason, invoiceId: number | null): Promise<void> {
  const db = await getDB();
  const product = await getProduct(productId);
  if (!product) throw new Error('المنتج غير موجود');
  const newQty = product.quantity + delta;
  await db.runAsync('UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?', [newQty, nowDateTime(), productId]);
  await recordStockMovement(productId, product.name, Math.abs(delta), delta > 0 ? '+' : '-', reason, invoiceId, newQty);
}

// ============ Sales Invoices ============

function generateInvoiceNumber(prefix: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const ts = Date.now().toString().slice(-6);
  return `${prefix}-${y}${m}${day}-${ts}`;
}

export async function createSalesInvoice(data: {
  customer_id: number;
  items: { product_id: number; product_name: string; quantity: number; sale_price: number; discount: number }[];
  discount: number;
  paid: number;
  payment_method: PaymentMethod;
  notes?: string;
}): Promise<number> {
  const db = await getDB();
  const settings = await getSettings();

  const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.sale_price - i.discount, 0);
  const total = subtotal - data.discount;
  const paid = data.paid;
  const remaining = total - paid;
  let status: InvoiceStatus = 'paid';
  if (remaining > 0) {
    status = paid > 0 ? 'partial' : 'unpaid';
  }

  // Check stock
  if (!settings.allow_negative_stock) {
    for (const item of data.items) {
      const product = await getProduct(item.product_id);
      if (product && item.quantity > product.quantity) {
        throw new Error(`الكمية المطلوبة من "${item.product_name}" (${item.quantity}) أكبر من المخزون المتاح (${product.quantity})`);
      }
    }
  }

  const invoiceNumber = generateInvoiceNumber('S');
  const date = nowDate();
  const time = nowTime();

  const result = await db.runAsync(
    `INSERT INTO sales_invoices (invoice_number, customer_id, date, time, subtotal, discount, total, paid, remaining, payment_method, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [invoiceNumber, data.customer_id, date, time, subtotal, data.discount, total, paid, remaining, data.payment_method, status, data.notes ?? null],
  );
  const invoiceId = result.lastInsertRowId as number;

  for (const item of data.items) {
    const itemTotal = item.quantity * item.sale_price - item.discount;
    await db.runAsync(
      `INSERT INTO sales_invoice_items (invoice_id, product_id, product_name, quantity, sale_price, discount, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, item.product_id, item.product_name, item.quantity, item.sale_price, item.discount, itemTotal],
    );

    // Deduct stock
    const product = await getProduct(item.product_id);
    if (product) {
      const newQty = product.quantity - item.quantity;
      await db.runAsync('UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?', [newQty, nowDateTime(), item.product_id]);
      await recordStockMovement(item.product_id, item.product_name, item.quantity, '-', 'sale', invoiceId, newQty);
    }
  }

  return invoiceId;
}

export async function getSalesInvoices(filters?: {
  customerId?: number;
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<(SalesInvoice & { customer_name: string })[]> {
  const db = await getDB();
  let sql = `SELECT si.*, c.name as customer_name FROM sales_invoices si
             JOIN customers c ON si.customer_id = c.id WHERE 1=1`;
  const params: any[] = [];
  if (filters?.customerId) {
    sql += ' AND si.customer_id = ?';
    params.push(filters.customerId);
  }
  if (filters?.status) {
    sql += ' AND si.status = ?';
    params.push(filters.status);
  }
  if (filters?.dateFrom) {
    sql += ' AND si.date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    sql += ' AND si.date <= ?';
    params.push(filters.dateTo);
  }
  sql += ' ORDER BY si.id DESC';
  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) sql += ` OFFSET ${filters.offset}`;
  }
  return db.getAllAsync<SalesInvoice & { customer_name: string }>(sql, params);
}

export async function getSalesInvoice(id: number): Promise<SalesInvoice | null> {
  const db = await getDB();
  return (await db.getFirstAsync<SalesInvoice>('SELECT * FROM sales_invoices WHERE id = ?', [id])) ?? null;
}

export async function getSalesInvoiceItems(invoiceId: number): Promise<SalesInvoiceItem[]> {
  const db = await getDB();
  return db.getAllAsync<SalesInvoiceItem>('SELECT * FROM sales_invoice_items WHERE invoice_id = ?', [invoiceId]);
}

export async function cancelSalesInvoice(id: number): Promise<void> {
  const db = await getDB();
  const invoice = await getSalesInvoice(id);
  if (!invoice) throw new Error('الفاتورة غير موجودة');
  if (invoice.status === 'cancelled') throw new Error('الفاتورة ملغاة بالفعل');

  const items = await getSalesInvoiceItems(id);
  for (const item of items) {
    const product = await getProduct(item.product_id);
    if (product) {
      const newQty = product.quantity + item.quantity;
      await db.runAsync('UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?', [newQty, nowDateTime(), item.product_id]);
      await recordStockMovement(item.product_id, item.product_name, item.quantity, '+', 'sale_return', id, newQty);
    }
  }

  await db.runAsync('UPDATE sales_invoices SET status = ? WHERE id = ?', ['cancelled', id]);
}

// ============ Purchase Invoices ============

export async function createPurchaseInvoice(data: {
  supplier_id: number;
  items: { product_id: number; product_name: string; quantity: number; purchase_price: number }[];
  discount: number;
  paid: number;
  payment_method: PaymentMethod;
  notes?: string;
}): Promise<number> {
  const db = await getDB();

  const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.purchase_price, 0);
  const total = subtotal - data.discount;
  const remaining = total - data.paid;

  const invoiceNumber = generateInvoiceNumber('P');
  const date = nowDate();

  const result = await db.runAsync(
    `INSERT INTO purchase_invoices (invoice_number, supplier_id, date, subtotal, discount, total, paid, remaining, payment_method, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [invoiceNumber, data.supplier_id, date, subtotal, data.discount, total, data.paid, remaining, data.payment_method, data.notes ?? null],
  );
  const invoiceId = result.lastInsertRowId as number;

  for (const item of data.items) {
    const itemTotal = item.quantity * item.purchase_price;
    await db.runAsync(
      `INSERT INTO purchase_invoice_items (invoice_id, product_id, product_name, quantity, purchase_price, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceId, item.product_id, item.product_name, item.quantity, item.purchase_price, itemTotal],
    );

    const product = await getProduct(item.product_id);
    if (product) {
      const newQty = product.quantity + item.quantity;
      await db.runAsync(
        'UPDATE products SET quantity = ?, purchase_price = ?, updated_at = ? WHERE id = ?',
        [newQty, item.purchase_price, nowDateTime(), item.product_id],
      );
      await recordStockMovement(item.product_id, item.product_name, item.quantity, '+', 'purchase', invoiceId, newQty);
    }
  }

  return invoiceId;
}

export async function getPurchaseInvoices(filters?: {
  supplierId?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<(PurchaseInvoice & { supplier_name: string })[]> {
  const db = await getDB();
  let sql = `SELECT pi.*, s.name as supplier_name FROM purchase_invoices pi
             JOIN suppliers s ON pi.supplier_id = s.id WHERE 1=1`;
  const params: any[] = [];
  if (filters?.supplierId) {
    sql += ' AND pi.supplier_id = ?';
    params.push(filters.supplierId);
  }
  if (filters?.dateFrom) {
    sql += ' AND pi.date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    sql += ' AND pi.date <= ?';
    params.push(filters.dateTo);
  }
  sql += ' ORDER BY pi.id DESC';
  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) sql += ` OFFSET ${filters.offset}`;
  }
  return db.getAllAsync<PurchaseInvoice & { supplier_name: string }>(sql, params);
}

export async function getPurchaseInvoice(id: number): Promise<PurchaseInvoice | null> {
  const db = await getDB();
  return (await db.getFirstAsync<PurchaseInvoice>('SELECT * FROM purchase_invoices WHERE id = ?', [id])) ?? null;
}

export async function getPurchaseInvoiceItems(invoiceId: number): Promise<PurchaseInvoiceItem[]> {
  const db = await getDB();
  return db.getAllAsync<PurchaseInvoiceItem>('SELECT * FROM purchase_invoice_items WHERE invoice_id = ?', [invoiceId]);
}

export async function cancelPurchaseInvoice(id: number): Promise<void> {
  const db = await getDB();
  const invoice = await getPurchaseInvoice(id);
  if (!invoice) throw new Error('الفاتورة غير موجودة');

  const items = await getPurchaseInvoiceItems(id);
  for (const item of items) {
    const product = await getProduct(item.product_id);
    if (product) {
      const newQty = product.quantity - item.quantity;
      await db.runAsync('UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?', [newQty, nowDateTime(), item.product_id]);
      await recordStockMovement(item.product_id, item.product_name, item.quantity, '-', 'purchase_return', id, newQty);
    }
  }

  await db.runAsync('UPDATE purchase_invoices SET remaining = ? WHERE id = ?', [invoice.total, id]);
}

// ============ Expenses ============

export async function getExpenses(filters?: {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<Expense[]> {
  const db = await getDB();
  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params: any[] = [];
  if (filters?.dateFrom) {
    sql += ' AND date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    sql += ' AND date <= ?';
    params.push(filters.dateTo);
  }
  if (filters?.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }
  sql += ' ORDER BY id DESC';
  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) sql += ` OFFSET ${filters.offset}`;
  }
  return db.getAllAsync<Expense>(sql, params);
}

export async function addExpense(e: Omit<Expense, 'id' | 'created_at'>): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    'INSERT INTO expenses (name, category, amount, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [e.name, e.category, e.amount, e.date, e.time, e.notes],
  );
  return result.lastInsertRowId as number;
}

export async function getExpense(id: number): Promise<Expense | null> {
  const db = await getDB();
  return (await db.getFirstAsync<Expense>('SELECT * FROM expenses WHERE id = ?', [id])) ?? null;
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

// ============ Customer Payments ============

export async function addCustomerPayment(data: {
  customer_id: number;
  invoice_id: number | null;
  installment_id: number | null;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
}): Promise<number> {
  const db = await getDB();
  const date = nowDate();
  const time = nowTime();

  const result = await db.runAsync(
    `INSERT INTO customer_payments (customer_id, invoice_id, installment_id, amount, date, time, payment_method, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.customer_id, data.invoice_id, data.installment_id, data.amount, date, time, data.payment_method, data.notes ?? null],
  );
  const paymentId = result.lastInsertRowId as number;

  // Update invoice remaining
  if (data.invoice_id) {
    const invoice = await getSalesInvoice(data.invoice_id);
    if (invoice && invoice.status !== 'cancelled') {
      const newPaid = invoice.paid + data.amount;
      const newRemaining = invoice.total - newPaid;
      const newStatus: InvoiceStatus = newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
      await db.runAsync(
        'UPDATE sales_invoices SET paid = ?, remaining = ?, status = ? WHERE id = ?',
        [newPaid, Math.max(0, newRemaining), newStatus, data.invoice_id],
      );
    }
  }

  // Update installment if linked
  if (data.installment_id) {
    const installment = await db.getFirstAsync<Installment>('SELECT * FROM installments WHERE id = ?', [data.installment_id]);
    if (installment) {
      const newPaid = installment.paid_amount + data.amount;
      const newRemaining = installment.amount - newPaid;
      let newStatus: Installment['status'] = 'pending';
      if (newRemaining <= 0) newStatus = 'paid';
      else if (newPaid > 0) newStatus = 'partial';

      await db.runAsync(
        'UPDATE installments SET paid_amount = ?, remaining = ?, status = ? WHERE id = ?',
        [newPaid, Math.max(0, newRemaining), newStatus, data.installment_id],
      );

      // Record installment payment
      await db.runAsync(
        `INSERT INTO installment_payments (installment_id, customer_id, invoice_id, amount, date, time, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.installment_id, data.customer_id, installment.invoice_id, data.amount, date, time, data.payment_method, data.notes ?? null],
      );
    }
  }

  return paymentId;
}

export async function getCustomerPayments(customerId: number): Promise<CustomerPayment[]> {
  const db = await getDB();
  return db.getAllAsync<CustomerPayment>(
    'SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY id DESC',
    [customerId],
  );
}

// ============ Installments ============

export async function createInstallments(data: {
  invoice_id: number;
  customer_id: number;
  total_amount: number;
  down_payment: number;
  remaining: number;
  count: number;
  first_due_date: string;
  frequency: InstallmentFrequency;
}): Promise<Installment[]> {
  const db = await getDB();
  const installmentAmount = data.remaining / data.count;
  const installments: Installment[] = [];

  const firstDate = new Date(data.first_due_date);
  for (let i = 0; i < data.count; i++) {
    let dueDate: Date;
    if (data.frequency === 'daily') {
      dueDate = new Date(firstDate.getTime() + i * 24 * 60 * 60 * 1000);
    } else if (data.frequency === 'weekly') {
      dueDate = new Date(firstDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    } else if (data.frequency === 'monthly') {
      dueDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, firstDate.getDate());
    } else {
      dueDate = new Date(firstDate.getTime() + i * 30 * 24 * 60 * 60 * 1000);
    }

    const dueStr = dueDate.toISOString().split('T')[0];
    const result = await db.runAsync(
      `INSERT INTO installments (invoice_id, customer_id, installment_number, amount, paid_amount, remaining, due_date, status, frequency)
       VALUES (?, ?, ?, ?, 0, ?, 'pending', ?)`,
      [data.invoice_id, data.customer_id, i + 1, installmentAmount, installmentAmount, dueStr, data.frequency],
    );
    const row = await db.getFirstAsync<Installment>('SELECT * FROM installments WHERE id = ?', [result.lastInsertRowId]);
    if (row) installments.push(row);
  }

  return installments;
}

export async function getInstallments(filters?: {
  customerId?: number;
  invoiceId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<(Installment & { customer_name: string; invoice_number: string })[]> {
  const db = await getDB();
  let sql = `SELECT ins.*, c.name as customer_name, si.invoice_number as invoice_number
             FROM installments ins
             JOIN customers c ON ins.customer_id = c.id
             JOIN sales_invoices si ON ins.invoice_id = si.id
             WHERE 1=1`;
  const params: any[] = [];
  if (filters?.customerId) {
    sql += ' AND ins.customer_id = ?';
    params.push(filters.customerId);
  }
  if (filters?.invoiceId) {
    sql += ' AND ins.invoice_id = ?';
    params.push(filters.invoiceId);
  }
  if (filters?.status) {
    sql += ' AND ins.status = ?';
    params.push(filters.status);
  }
  sql += ' ORDER BY ins.due_date ASC';
  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) sql += ` OFFSET ${filters.offset}`;
  }
  return db.getAllAsync<Installment & { customer_name: string; invoice_number: string }>(sql, params);
}

export async function updateOverdueInstallments(): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE installments SET status = 'overdue'
     WHERE status IN ('pending', 'partial') AND due_date < date('now') AND remaining > 0`,
  );
}

// ============ Dashboard ============

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDB();
  const today = nowDate();
  const settings = await getSettings();

  const todaySales = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM sales_invoices WHERE date = ? AND status != 'cancelled'`,
    [today],
  );
  const todayPurchases = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM purchase_invoices WHERE date = ?`,
    [today],
  );
  const todayExpenses = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?`,
    [today],
  );

  const todayProfit = await db.getFirstAsync<{ profit: number }>(
    `SELECT COALESCE(SUM((sii.quantity * sii.sale_price - sii.discount) - (sii.quantity * p.purchase_price)), 0) as profit
     FROM sales_invoice_items sii
     JOIN sales_invoices si ON sii.invoice_id = si.id
     JOIN products p ON sii.product_id = p.id
     WHERE si.date = ? AND si.status != 'cancelled'`,
    [today],
  );

  const inventoryValue = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(quantity * purchase_price), 0) as total FROM products`,
  );

  const totalReceivables = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(remaining), 0) as total FROM sales_invoices WHERE status != 'cancelled' AND remaining > 0`,
  );

  const todayDue = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(remaining), 0) as total FROM installments WHERE due_date = ? AND remaining > 0`,
    [today],
  );

  const overdue = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM installments WHERE due_date < date('now') AND remaining > 0`,
  );

  const lowStock = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE quantity <= min_stock`,
  );

  const nearExpiry = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE has_expiry = 1 AND expiry_date >= date('now') AND expiry_date <= date('now', '+${settings.expiry_warning_days} days')`,
  );

  const expired = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE has_expiry = 1 AND expiry_date < date('now')`,
  );

  return {
    today_sales: todaySales?.total ?? 0,
    today_purchases: todayPurchases?.total ?? 0,
    today_expenses: todayExpenses?.total ?? 0,
    today_profit: todayProfit?.profit ?? 0,
    sales_invoice_count: todaySales?.count ?? 0,
    purchase_invoice_count: todayPurchases?.count ?? 0,
    inventory_value: inventoryValue?.total ?? 0,
    total_receivables: totalReceivables?.total ?? 0,
    today_due: todayDue?.total ?? 0,
    overdue_installments: overdue?.count ?? 0,
    low_stock_count: lowStock?.count ?? 0,
    near_expiry_count: nearExpiry?.count ?? 0,
    expired_count: expired?.count ?? 0,
  };
}

export async function getRecentSalesInvoices(limit = 5): Promise<(SalesInvoice & { customer_name: string })[]> {
  return getSalesInvoices({ limit });
}

export async function getRecentPurchaseInvoices(limit = 5): Promise<(PurchaseInvoice & { supplier_name: string })[]> {
  return getPurchaseInvoices({ limit });
}

export async function getRecentStockMovements(limit = 5): Promise<StockMovement[]> {
  return getStockMovements({ limit });
}

export async function getRecentCustomerPayments(limit = 5): Promise<(CustomerPayment & { customer_name: string })[]> {
  const db = await getDB();
  return db.getAllAsync<CustomerPayment & { customer_name: string }>(
    `SELECT cp.*, c.name as customer_name FROM customer_payments cp
     JOIN customers c ON cp.customer_id = c.id
     ORDER BY cp.id DESC LIMIT ?`,
    [limit],
  );
}

// ============ Reports ============

export async function getSalesReport(dateFrom: string, dateTo: string) {
  const db = await getDB();
  const summary = await db.getFirstAsync<{ total: number; paid: number; remaining: number; count: number; profit: number }>(
    `SELECT COALESCE(SUM(si.total), 0) as total, COALESCE(SUM(si.paid), 0) as paid,
            COALESCE(SUM(si.remaining), 0) as remaining, COUNT(*) as count,
            COALESCE(SUM((sii.quantity * sii.sale_price - sii.discount) - (sii.quantity * p.purchase_price)), 0) as profit
     FROM sales_invoices si
     LEFT JOIN sales_invoice_items sii ON sii.invoice_id = si.id
     LEFT JOIN products p ON sii.product_id = p.id
     WHERE si.date >= ? AND si.date <= ? AND si.status != 'cancelled'`,
    [dateFrom, dateTo],
  );
  return summary!;
}

export async function getPurchaseReport(dateFrom: string, dateTo: string) {
  const db = await getDB();
  const summary = await db.getFirstAsync<{ total: number; paid: number; remaining: number; count: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COALESCE(SUM(paid), 0) as paid,
            COALESCE(SUM(remaining), 0) as remaining, COUNT(*) as count
     FROM purchase_invoices WHERE date >= ? AND date <= ?`,
    [dateFrom, dateTo],
  );
  return summary!;
}

export async function getExpensesReport(dateFrom: string, dateTo: string) {
  const db = await getDB();
  const summary = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses WHERE date >= ? AND date <= ?`,
    [dateFrom, dateTo],
  );
  const byCategory = await db.getAllAsync<{ category: string; total: number }>(
    `SELECT category, COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date <= ? GROUP BY category ORDER BY total DESC`,
    [dateFrom, dateTo],
  );
  return { ...summary!, byCategory };
}

export async function getTopProducts(dateFrom: string, dateTo: string, limit = 10) {
  const db = await getDB();
  return db.getAllAsync<{ product_name: string; qty: number; total: number }>(
    `SELECT sii.product_name, SUM(sii.quantity) as qty, SUM(sii.total) as total
     FROM sales_invoice_items sii
     JOIN sales_invoices si ON sii.invoice_id = si.id
     WHERE si.date >= ? AND si.date <= ? AND si.status != 'cancelled'
     GROUP BY sii.product_id
     ORDER BY qty DESC
     LIMIT ?`,
    [dateFrom, dateTo, limit],
  );
}

export async function getBottomProducts(dateFrom: string, dateTo: string, limit = 10) {
  const db = await getDB();
  return db.getAllAsync<{ product_name: string; qty: number; total: number }>(
    `SELECT sii.product_name, SUM(sii.quantity) as qty, SUM(sii.total) as total
     FROM sales_invoice_items sii
     JOIN sales_invoices si ON sii.invoice_id = si.id
     WHERE si.date >= ? AND si.date <= ? AND si.status != 'cancelled'
     GROUP BY sii.product_id
     ORDER BY qty ASC
     LIMIT ?`,
    [dateFrom, dateTo, limit],
  );
}

export async function getReceivablesSummary() {
  const db = await getDB();
  const today = nowDate();
  const total = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(remaining), 0) as total FROM installments WHERE remaining > 0`,
  );
  const todayDue = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(remaining), 0) as total FROM installments WHERE due_date = ? AND remaining > 0`,
    [today],
  );
  const overdue = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(remaining), 0) as total FROM installments WHERE due_date < ? AND remaining > 0`,
    [today],
  );
  const weekDue = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(remaining), 0) as total FROM installments WHERE due_date >= ? AND due_date <= date('now', '+7 days') AND remaining > 0`,
    [today],
  );
  const monthDue = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(remaining), 0) as total FROM installments WHERE due_date >= ? AND due_date <= date('now', '+30 days') AND remaining > 0`,
    [today],
  );
  return {
    total: total?.total ?? 0,
    today: todayDue?.total ?? 0,
    overdue: overdue?.total ?? 0,
    week: weekDue?.total ?? 0,
    month: monthDue?.total ?? 0,
  };
}

export async function getReceivablesByCustomer() {
  const db = await getDB();
  const today = nowDate();
  return db.getAllAsync<{
    customer_name: string;
    phone: string | null;
    total_remaining: number;
    today_due: number;
    overdue: number;
    next_due: string | null;
  }>(
    `SELECT c.name as customer_name, c.phone,
            COALESCE(SUM(ins.remaining), 0) as total_remaining,
            COALESCE(SUM(CASE WHEN ins.due_date = ? THEN ins.remaining ELSE 0 END), 0) as today_due,
            COALESCE(SUM(CASE WHEN ins.due_date < ? THEN ins.remaining ELSE 0 END), 0) as overdue,
            MIN(CASE WHEN ins.remaining > 0 THEN ins.due_date END) as next_due
     FROM installments ins
     JOIN customers c ON ins.customer_id = c.id
     WHERE ins.remaining > 0
     GROUP BY ins.customer_id
     ORDER BY total_remaining DESC`,
    [today, today],
  );
}

// ============ Backup / Restore ============

export async function exportAllData(): Promise<Record<string, any[]>> {
  const db = await getDB();
  const tables = [
    'settings', 'categories', 'brands', 'suppliers', 'customers', 'products',
    'sales_invoices', 'sales_invoice_items', 'purchase_invoices', 'purchase_invoice_items',
    'expenses', 'stock_movements', 'customer_payments', 'installments', 'installment_payments',
  ];
  const data: Record<string, any[]> = {};
  for (const table of tables) {
    data[table] = await db.getAllAsync<any>(`SELECT * FROM ${table}`);
  }
  return data;
}

export async function importAllData(data: Record<string, any[]>): Promise<void> {
  const db = await getDB();

  const tables = [
    'installment_payments', 'installments', 'customer_payments', 'stock_movements',
    'expenses', 'purchase_invoice_items', 'purchase_invoices',
    'sales_invoice_items', 'sales_invoices', 'products',
    'customers', 'suppliers', 'brands', 'categories', 'settings',
  ];

  for (const table of tables) {
    await db.execAsync(`DELETE FROM ${table}`);
  }

  for (const table of tables) {
    const rows = data[table];
    if (!rows || rows.length === 0) continue;
    for (const row of rows) {
      const keys = Object.keys(row);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((k) => row[k]);
      await db.runAsync(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
        values,
      );
    }
  }
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tables = [
    'installment_payments', 'installments', 'customer_payments', 'stock_movements',
    'expenses', 'purchase_invoice_items', 'purchase_invoices',
    'sales_invoice_items', 'sales_invoices', 'products',
    'customers', 'suppliers', 'brands', 'categories',
  ];
  for (const table of tables) {
    await db.execAsync(`DELETE FROM ${table}`);
  }
  await db.runAsync(
    `UPDATE settings SET store_name='متجري', store_phone='', store_address='', logo=NULL, currency='ج.م', accent_color='#2563EB', invoice_size='80mm', allow_negative_stock=0, expiry_warning_days=30, installment_notifications=1, pin_enabled=0, pin_hash=NULL WHERE id=1`,
  );
}
