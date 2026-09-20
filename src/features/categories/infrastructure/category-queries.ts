import { getDatabase, persistDatabase } from '../../../infrastructure/database/database-client';
import type { Category } from '../../../shared/types/domain.types';
import { generateId } from '../../../shared/utils/formatting';

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const results = db.exec('SELECT * FROM categories ORDER BY name ASC');
  if (results.length === 0) return [];
  return results[0].values.map((row: unknown[]) => mapCategoryRow(row, results[0].columns));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const results = db.exec('SELECT * FROM categories WHERE id = ?', [id]);
  if (results.length === 0 || results[0].values.length === 0) return null;
  return mapCategoryRow(results[0].values[0], results[0].columns);
}

export async function createCategory(data: { name: string; description: string }): Promise<Category> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO categories (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, data.name, data.description, now, now]
  );
  await persistDatabase(db);
  return { id, name: data.name, description: data.description, createdAt: now, updatedAt: now };
}

export async function updateCategory(id: string, data: { name: string; description: string }): Promise<Category | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  db.run('UPDATE categories SET name = ?, description = ?, updated_at = ? WHERE id = ?', [
    data.name,
    data.description,
    now,
    id,
  ]);
  await persistDatabase(db);
  return getCategoryById(id);
}

export async function deleteCategory(id: string): Promise<boolean> {
  const db = await getDatabase();
  const productCount = db.exec('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
  if (productCount.length > 0 && (productCount[0].values[0][0] as number) > 0) {
    return false;
  }
  db.run('DELETE FROM categories WHERE id = ?', [id]);
  await persistDatabase(db);
  return true;
}

export async function categoryHasProducts(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = db.exec('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
  if (result.length === 0) return false;
  return (result[0].values[0][0] as number) > 0;
}

function mapCategoryRow(row: unknown[], columns: string[]): Category {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return {
    id: obj.id as string,
    name: obj.name as string,
    description: (obj.description as string) || '',
    createdAt: obj.created_at as string,
    updatedAt: obj.updated_at as string,
  };
}
