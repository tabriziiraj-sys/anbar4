import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fa-IR');
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('fa-IR');
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function isLowStock(currentStock: number, minimumStock: number): boolean {
  return currentStock <= minimumStock;
}

export function getTransactionTypeLabel(type: 'IN' | 'OUT'): string {
  return type === 'IN' ? 'ورود' : 'خروج';
}

export const PRODUCT_UNITS = [
  'عدد',
  'کارتن',
  'کیلوگرم',
  'گرم',
  'متر',
  'لیتر',
  'بسته',
] as const;
