import { getDatabase, persistDatabase } from '../../../infrastructure/database/database-client';
import type {
  InventoryTransaction,
  InventoryTransactionWithProduct,
  PaginationResult,
  TransactionFilters,
  TransactionType,
} from '../../../shared/types/domain.types';
import { generateId } from '../../../shared/utils/formatting';

export async function getTransactions(
  filters: TransactionFilters
): Promise<PaginationResult<InventoryTransactionWithProduct>> {
  const db = await getDatabase();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params: unknown[] = [];

  if (filters.search) {
    whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR t.reference LIKE ? OR t.description LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.productId) {
    whereClause += ' AND t.product_id = ?';
    params.push(filters.productId);
  }

  if (filters.categoryId) {
    whereClause += ' AND p.category_id = ?';
    params.push(filters.categoryId);
  }

  if (filters.type) {
    whereClause += ' AND t.type = ?';
    params.push(filters.type);
  }

  if (filters.dateFrom) {
    whereClause += ' AND t.transaction_date >= ?';
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    whereClause += ' AND t.transaction_date <= ?';
    params.push(filters.dateTo);
  }

  const countResult = db.exec(
    `SELECT COUNT(*) FROM inventory_transactions t 
     JOIN products p ON t.product_id = p.id ${whereClause}`,
    params
  );
  const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

  const results = db.exec(
    `SELECT t.*, p.name as product_name, p.sku as product_sku 
     FROM inventory_transactions t 
     JOIN products p ON t.product_id = p.id 
     ${whereClause} 
     ORDER BY t.transaction_date DESC, t.created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const items: InventoryTransactionWithProduct[] = results.length > 0
    ? results[0].values.map((row: unknown[]) => mapTransactionWithProductRow(row, results[0].columns))
    : [];

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getRecentTransactions(limit: number = 10): Promise<InventoryTransactionWithProduct[]> {
  const db = await getDatabase();
  const results = db.exec(
    `SELECT t.*, p.name as product_name, p.sku as product_sku 
     FROM inventory_transactions t 
     JOIN products p ON t.product_id = p.id 
     ORDER BY t.created_at DESC 
     LIMIT ?`,
    [limit]
  );
  if (results.length === 0) return [];
  return results[0].values.map((row: unknown[]) => mapTransactionWithProductRow(row, results[0].columns));
}

export async function getProductTransactions(productId: string, limit: number = 20): Promise<InventoryTransaction[]> {
  const db = await getDatabase();
  const results = db.exec(
    `SELECT * FROM inventory_transactions WHERE product_id = ? ORDER BY transaction_date DESC, created_at DESC LIMIT ?`,
    [productId, limit]
  );
  if (results.length === 0) return [];
  return results[0].values.map((row: unknown[]) => mapTransactionRow(row, results[0].columns));
}

export async function getTodayStats(): Promise<{ entries: number; exits: number }> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const entriesResult = db.exec(
    `SELECT COALESCE(SUM(quantity), 0) FROM inventory_transactions WHERE type = 'IN' AND transaction_date = ?`,
    [today]
  );
  const exitsResult = db.exec(
    `SELECT COALESCE(SUM(quantity), 0) FROM inventory_transactions WHERE type = 'OUT' AND transaction_date = ?`,
    [today]
  );

  return {
    entries: entriesResult.length > 0 ? (entriesResult[0].values[0][0] as number) : 0,
    exits: exitsResult.length > 0 ? (exitsResult[0].values[0][0] as number) : 0,
  };
}

export async function createStockEntry(data: {
  productId: string;
  quantity: number;
  transactionDate: string;
  reference: string;
  description: string;
}): Promise<InventoryTransaction> {
  const db = await getDatabase();

  const productResult = db.exec('SELECT current_stock, is_active FROM products WHERE id = ?', [data.productId]);
  if (productResult.length === 0 || productResult[0].values.length === 0) {
    throw new Error('محصول یافت نشد');
  }

  const isActive = (productResult[0].values[0][1] as number) === 1;
  if (!isActive) {
    throw new Error('امکان ثبت تراکنش برای محصول غیرفعال وجود ندارد');
  }

  if (data.quantity <= 0) {
    throw new Error('مقدار باید بزرگتر از صفر باشد');
  }

  const currentStock = productResult[0].values[0][0] as number;
  const newStock = currentStock + data.quantity;
  const id = generateId();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO inventory_transactions (id, product_id, type, quantity, stock_after_transaction, reference, recipient, description, transaction_date, created_at) 
     VALUES (?, ?, 'IN', ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.productId, data.quantity, newStock, data.reference, '', data.description, data.transactionDate, now]
  );

  db.run('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?', [newStock, now, data.productId]);

  await persistDatabase(db);

  return {
    id,
    productId: data.productId,
    type: 'IN',
    quantity: data.quantity,
    stockAfterTransaction: newStock,
    reference: data.reference,
    recipient: '',
    description: data.description,
    transactionDate: data.transactionDate,
    createdAt: now,
  };
}

export async function createStockExit(data: {
  productId: string;
  quantity: number;
  transactionDate: string;
  reference: string;
  recipient: string;
  description: string;
}): Promise<InventoryTransaction> {
  const db = await getDatabase();

  const productResult = db.exec('SELECT current_stock, is_active FROM products WHERE id = ?', [data.productId]);
  if (productResult.length === 0 || productResult[0].values.length === 0) {
    throw new Error('محصول یافت نشد');
  }

  const isActive = (productResult[0].values[0][1] as number) === 1;
  if (!isActive) {
    throw new Error('امکان ثبت تراکنش برای محصول غیرفعال وجود ندارد');
  }

  if (data.quantity <= 0) {
    throw new Error('مقدار باید بزرگتر از صفر باشد');
  }

  const currentStock = productResult[0].values[0][0] as number;
  if (data.quantity > currentStock) {
    throw new Error('موجودی کافی نیست. موجودی فعلی: ' + currentStock);
  }

  const newStock = currentStock - data.quantity;
  const id = generateId();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO inventory_transactions (id, product_id, type, quantity, stock_after_transaction, reference, recipient, description, transaction_date, created_at) 
     VALUES (?, ?, 'OUT', ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.productId, data.quantity, newStock, data.reference, data.recipient, data.description, data.transactionDate, now]
  );

  db.run('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?', [newStock, now, data.productId]);

  await persistDatabase(db);

  return {
    id,
    productId: data.productId,
    type: 'OUT',
    quantity: data.quantity,
    stockAfterTransaction: newStock,
    reference: data.reference,
    recipient: data.recipient,
    description: data.description,
    transactionDate: data.transactionDate,
    createdAt: now,
  };
}

export async function getAllTransactionsForExport(filters: Omit<TransactionFilters, 'page' | 'pageSize'>): Promise<InventoryTransactionWithProduct[]> {
  const db = await getDatabase();

  let whereClause = 'WHERE 1=1';
  const params: unknown[] = [];

  if (filters.search) {
    whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR t.reference LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.productId) {
    whereClause += ' AND t.product_id = ?';
    params.push(filters.productId);
  }
  if (filters.categoryId) {
    whereClause += ' AND p.category_id = ?';
    params.push(filters.categoryId);
  }
  if (filters.type) {
    whereClause += ' AND t.type = ?';
    params.push(filters.type);
  }
  if (filters.dateFrom) {
    whereClause += ' AND t.transaction_date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    whereClause += ' AND t.transaction_date <= ?';
    params.push(filters.dateTo);
  }

  const results = db.exec(
    `SELECT t.*, p.name as product_name, p.sku as product_sku 
     FROM inventory_transactions t 
     JOIN products p ON t.product_id = p.id 
     ${whereClause} 
     ORDER BY t.transaction_date DESC, t.created_at DESC`,
    params
  );

  if (results.length === 0) return [];
  return results[0].values.map((row: unknown[]) => mapTransactionWithProductRow(row, results[0].columns));
}

function mapTransactionRow(row: unknown[], columns: string[]): InventoryTransaction {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return {
    id: obj.id as string,
    productId: obj.product_id as string,
    type: obj.type as TransactionType,
    quantity: obj.quantity as number,
    stockAfterTransaction: obj.stock_after_transaction as number,
    reference: (obj.reference as string) || '',
    recipient: (obj.recipient as string) || '',
    description: (obj.description as string) || '',
    transactionDate: obj.transaction_date as string,
    createdAt: obj.created_at as string,
  };
}

function mapTransactionWithProductRow(row: unknown[], columns: string[]): InventoryTransactionWithProduct {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return {
    ...mapTransactionRow(row, columns),
    productName: obj.product_name as string,
    productSku: obj.product_sku as string,
  };
}
