import * as SQLite from 'expo-sqlite';
import { DEFAULT_SETTINGS } from '@/constants';

const DB_NAME = 'store_manager.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);
  dbInstance = db;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  await runMigrations(db);
  return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      store_name TEXT NOT NULL DEFAULT 'متجري',
      store_phone TEXT DEFAULT '',
      store_address TEXT DEFAULT '',
      logo TEXT,
      currency TEXT NOT NULL DEFAULT 'ج.م',
      accent_color TEXT NOT NULL DEFAULT '#2563EB',
      invoice_size TEXT NOT NULL DEFAULT '80mm',
      allow_negative_stock INTEGER NOT NULL DEFAULT 0,
      expiry_warning_days INTEGER NOT NULL DEFAULT 30,
      installment_notifications INTEGER NOT NULL DEFAULT 1,
      pin_enabled INTEGER NOT NULL DEFAULT 0,
      pin_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      address TEXT,
      tax_number TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      governorate TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      barcode TEXT,
      image TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      brand TEXT,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      purchase_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      wholesale_price REAL NOT NULL DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'قطعة',
      min_stock REAL NOT NULL DEFAULT 0,
      has_expiry INTEGER NOT NULL DEFAULT 0,
      production_date TEXT,
      expiry_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

    CREATE TABLE IF NOT EXISTS sales_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paid REAL NOT NULL DEFAULT 0,
      remaining REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      status TEXT NOT NULL DEFAULT 'paid',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_invoices(date);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_invoices(status);

    CREATE TABLE IF NOT EXISTS sales_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      sale_price REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sales_items_invoice ON sales_invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_invoice_items(product_id);

    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
      date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paid REAL NOT NULL DEFAULT 0,
      remaining REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchase_invoices(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchase_invoices(date);

    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      purchase_price REAL NOT NULL,
      total REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_purchase_items_invoice ON purchase_invoice_items(invoice_id);

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('+', '-')),
      reason TEXT NOT NULL,
      invoice_id INTEGER,
      balance_after REAL NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_stock_date ON stock_movements(date);
    CREATE INDEX IF NOT EXISTS idx_stock_invoice ON stock_movements(invoice_id);

    CREATE TABLE IF NOT EXISTS customer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE SET NULL,
      installment_id INTEGER,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_payments_customer ON customer_payments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON customer_payments(invoice_id);

    CREATE TABLE IF NOT EXISTS installments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      installment_number INTEGER NOT NULL,
      amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      remaining REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      frequency TEXT NOT NULL DEFAULT 'monthly',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_installments_invoice ON installments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_installments_customer ON installments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_installments_due ON installments(due_date);
    CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);

    CREATE TABLE IF NOT EXISTS installment_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      installment_id INTEGER NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_installment_payments_installment ON installment_payments(installment_id);
  `);

  await db.runAsync(
    `INSERT OR IGNORE INTO settings (id, store_name, store_phone, store_address, logo, currency, accent_color, invoice_size, allow_negative_stock, expiry_warning_days, installment_notifications, pin_enabled, pin_hash)
     VALUES (1, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      DEFAULT_SETTINGS.store_name,
      DEFAULT_SETTINGS.store_phone,
      DEFAULT_SETTINGS.store_address,
      DEFAULT_SETTINGS.currency,
      DEFAULT_SETTINGS.accent_color,
      DEFAULT_SETTINGS.invoice_size,
      DEFAULT_SETTINGS.allow_negative_stock,
      DEFAULT_SETTINGS.expiry_warning_days,
      DEFAULT_SETTINGS.installment_notifications,
      DEFAULT_SETTINGS.pin_enabled,
    ],
  );
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
