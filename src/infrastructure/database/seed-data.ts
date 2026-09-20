import { getDatabase, persistDatabase } from '../database/database-client';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase(): Promise<void> {
  const db = await getDatabase();

  // Check if data already exists
  const existing = db.exec('SELECT COUNT(*) FROM categories');
  if (existing.length > 0 && (existing[0].values[0][0] as number) > 0) return;

  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  // Categories
  const categories = [
    { id: uuidv4(), name: 'مواد اولیه', description: 'مواد اولیه تولید' },
    { id: uuidv4(), name: 'قطعات', description: 'قطعات یدکی و مونتاژی' },
    { id: uuidv4(), name: 'مصرفی', description: 'مواد مصرفی و بسته‌بندی' },
    { id: uuidv4(), name: 'محصول نهایی', description: 'محصولات آماده فروش' },
  ];

  for (const cat of categories) {
    db.run('INSERT INTO categories (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.description, now, now]);
  }

  // Products
  const products = [
    { id: uuidv4(), name: 'ورق فولادی ۲ میل', sku: 'STL-001', categoryId: categories[0].id, unit: 'کیلوگرم', minimumStock: 50, currentStock: 120, description: 'ورق فولادی سرد ۲ میلیمتر' },
    { id: uuidv4(), name: 'پیچ M8x30', sku: 'SCR-001', categoryId: categories[1].id, unit: 'عدد', minimumStock: 200, currentStock: 450, description: 'پیچ شش‌گوش M8 طول ۳۰ میلی‌متر' },
    { id: uuidv4(), name: 'رنگ اپوکسی سفید', sku: 'PNT-001', categoryId: categories[2].id, unit: 'لیتر', minimumStock: 10, currentStock: 8, description: 'رنگ اپوکسی دوجزئی سفید' },
    { id: uuidv4(), name: 'دستکش ایمنی', sku: 'SFY-001', categoryId: categories[2].id, unit: 'عدد', minimumStock: 50, currentStock: 30, description: 'دستکش ایمنی صنعتی' },
    { id: uuidv4(), name: 'محصول الف', sku: 'PRD-001', categoryId: categories[3].id, unit: 'عدد', minimumStock: 20, currentStock: 75, description: 'محصول نهایی الف' },
    { id: uuidv4(), name: 'لوله مسی ۱/۲ اینچ', sku: 'PIP-001', categoryId: categories[0].id, unit: 'متر', minimumStock: 30, currentStock: 5, description: 'لوله مسی نیم اینچ' },
    { id: uuidv4(), name: 'واشر فنری M10', sku: 'WSH-001', categoryId: categories[1].id, unit: 'عدد', minimumStock: 100, currentStock: 350, description: 'واشر فنری M10' },
    { id: uuidv4(), name: 'کارتن بسته‌بندی بزرگ', sku: 'BOX-001', categoryId: categories[2].id, unit: 'عدد', minimumStock: 40, currentStock: 15, description: 'کارتن سه‌لایه بزرگ' },
  ];

  for (const p of products) {
    db.run(
      `INSERT INTO products (id, name, sku, category_id, unit, minimum_stock, current_stock, description, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [p.id, p.name, p.sku, p.categoryId, p.unit, p.minimumStock, p.currentStock, p.description, now, now]
    );
  }

  // Transactions
  const transactions = [
    { productId: products[0].id, type: 'IN', quantity: 100, stockAfter: 120, reference: 'PO-001', recipient: '', description: 'خرید از تأمین‌کننده', date: yesterday },
    { productId: products[0].id, type: 'OUT', quantity: 30, stockAfter: 90, reference: 'WO-001', recipient: 'خط تولید ۱', description: 'مصرف تولید', date: today },
    { productId: products[2].id, type: 'IN', quantity: 20, stockAfter: 28, reference: 'PO-002', recipient: '', description: 'خرید رنگ', date: yesterday },
    { productId: products[2].id, type: 'OUT', quantity: 20, stockAfter: 8, reference: 'WO-002', recipient: 'واحد رنگ', description: 'مصرف رنگ‌آمیزی', date: today },
    { productId: products[4].id, type: 'IN', quantity: 50, stockAfter: 75, reference: 'PR-001', recipient: '', description: 'تولید محصول الف', date: yesterday },
    { productId: products[4].id, type: 'OUT', quantity: 10, stockAfter: 65, reference: 'SO-001', recipient: 'مشتری الف', description: 'فروش', date: today },
    { productId: products[5].id, type: 'IN', quantity: 50, stockAfter: 55, reference: 'PO-003', recipient: '', description: 'خرید لوله', date: yesterday },
    { productId: products[5].id, type: 'OUT', quantity: 50, stockAfter: 5, reference: 'WO-003', recipient: 'خط تولید ۲', description: 'مصرف تولید', date: today },
    { productId: products[7].id, type: 'IN', quantity: 100, stockAfter: 115, reference: 'PO-004', recipient: '', description: 'خرید کارتن', date: yesterday },
    { productId: products[7].id, type: 'OUT', quantity: 100, stockAfter: 15, reference: 'WO-004', recipient: 'واحد بسته‌بندی', description: 'مصرف بسته‌بندی', date: today },
  ];

  for (const t of transactions) {
    db.run(
      `INSERT INTO inventory_transactions (id, product_id, type, quantity, stock_after_transaction, reference, recipient, description, transaction_date, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), t.productId, t.type, t.quantity, t.stockAfter, t.reference, t.recipient, t.description, t.date, now]
    );
  }

  await persistDatabase(db);
}
