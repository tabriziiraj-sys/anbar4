import { getDatabase, persistDatabase } from '../../../infrastructure/database/database-client';
import type { Product, ProductWithCategory, PaginationResult, ProductFilters } from '../../../shared/types/domain.types';
import { generateId } from '../../../shared/utils/formatting';

export async function getProducts(filters: ProductFilters): Promise<PaginationResult<ProductWithCategory>> {
  const db = await getDatabase();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params: unknown[] = [];

  if (filters.isActive !== undefined) {
    whereClause += ' AND p.is_active = ?';
    params.push(filters.isActive ? 1 : 0);
  } else {
    whereClause += ' AND p.is_active = 1';
  }

  if (filters.search) {
    whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.categoryId) {
    whereClause += ' AND p.category_id = ?';
    params.push(filters.categoryId);
  }

  const countResult = db.exec(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    params
  );
  const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

  const results = db.exec(
    `SELECT p.*, c.name as category_name FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id 
     ${whereClause} 
     ORDER BY p.created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const items: ProductWithCategory[] = results.length > 0
    ? results[0].values.map((row: unknown[]) => mapProductWithCategoryRow(row, results[0].columns))
    : [];

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductById(id: string): Promise<ProductWithCategory | null> {
  const db = await getDatabase();
  const results = db.exec(
    `SELECT p.*, c.name as category_name FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id 
     WHERE p.id = ?`,
    [id]
  );
  if (results.length === 0 || results[0].values.length === 0) return null;
  return mapProductWithCategoryRow(results[0].values[0], results[0].columns);
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  const db = await getDatabase();
  const results = db.exec('SELECT * FROM products WHERE sku = ?', [sku]);
  if (results.length === 0 || results[0].values.length === 0) return null;
  return mapProductRow(results[0].values[0], results[0].columns);
}

export async function createProduct(data: {
  name: string;
  sku: string;
  categoryId: string | null;
  unit: string;
  minimumStock: number;
  description: string;
}): Promise<Product> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO products (id, name, sku, category_id, unit, minimum_stock, current_stock, description, is_active, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, ?, ?)`,
    [id, data.name, data.sku, data.categoryId, data.unit, data.minimumStock, data.description, now, now]
  );
  await persistDatabase(db);
  return {
    id,
    name: data.name,
    sku: data.sku,
    categoryId: data.categoryId,
    unit: data.unit,
    minimumStock: data.minimumStock,
    currentStock: 0,
    description: data.description,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateProduct(id: string, data: {
  name: string;
  sku: string;
  categoryId: string | null;
  unit: string;
  minimumStock: number;
  description: string;
}): Promise<Product | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  db.run(
    `UPDATE products SET name = ?, sku = ?, category_id = ?, unit = ?, minimum_stock = ?, description = ?, updated_at = ? WHERE id = ?`,
    [data.name, data.sku, data.categoryId, data.unit, data.minimumStock, data.description, now, id]
  );
  await persistDatabase(db);
  const result = await getProductById(id);
  return result;
}

export async function deactivateProduct(id: string): Promise<boolean> {
  const db = await getDatabase();
  db.run('UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), id]);
  await persistDatabase(db);
  return true;
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const db = await getDatabase();
  db.run('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?', [
    newStock,
    new Date().toISOString(),
    id,
  ]);
}

export async function getLowStockProducts(): Promise<ProductWithCategory[]> {
  const db = await getDatabase();
  const results = db.exec(
    `SELECT p.*, c.name as category_name FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id 
     WHERE p.is_active = 1 AND p.current_stock <= p.minimum_stock
     ORDER BY (p.current_stock - p.minimum_stock) ASC`
  );
  if (results.length === 0) return [];
  return results[0].values.map((row: unknown[]) => mapProductWithCategoryRow(row, results[0].columns));
}

export async function getActiveProductsCount(): Promise<number> {
  const db = await getDatabase();
  const result = db.exec('SELECT COUNT(*) FROM products WHERE is_active = 1');
  return result.length > 0 ? (result[0].values[0][0] as number) : 0;
}

export async function getTotalStock(): Promise<number> {
  const db = await getDatabase();
  const result = db.exec('SELECT COALESCE(SUM(current_stock), 0) FROM products WHERE is_active = 1');
  return result.length > 0 ? (result[0].values[0][0] as number) : 0;
}

export async function searchProductsForSelect(search: string): Promise<Product[]> {
  const db = await getDatabase();
  const results = db.exec(
    `SELECT * FROM products WHERE is_active = 1 AND (name LIKE ? OR sku LIKE ?) ORDER BY name ASC LIMIT 20`,
    [`%${search}%`, `%${search}%`]
  );
  if (results.length === 0) return [];
  return results[0].values.map((row: unknown[]) => mapProductRow(row, results[0].columns));
}

function mapProductRow(row: Array<unknown>, columns: string[]): Product {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return {
    id: obj.id as string,
    name: obj.name as string,
    sku: obj.sku as string,
    categoryId: (obj.category_id as string) || null,
    unit: obj.unit as string,
    minimumStock: obj.minimum_stock as number,
    currentStock: obj.current_stock as number,
    description: (obj.description as string) || '',
    isActive: (obj.is_active as number) === 1,
    createdAt: obj.created_at as string,
    updatedAt: obj.updated_at as string,
  };
}

function mapProductWithCategoryRow(row: Array<unknown>, columns: string[]): ProductWithCategory {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return {
    ...mapProductRow(row, columns),
    categoryName: (obj.category_name as string) || null,
  };
}
