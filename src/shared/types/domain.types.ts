export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  unit: string;
  minimumStock: number;
  currentStock: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'IN' | 'OUT';

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  stockAfterTransaction: number;
  reference: string;
  recipient: string;
  description: string;
  transactionDate: string;
  createdAt: string;
}

export interface ProductWithCategory extends Product {
  categoryName: string | null;
}

export interface InventoryTransactionWithProduct extends InventoryTransaction {
  productName: string;
  productSku: string;
}

export interface DashboardStats {
  activeProductsCount: number;
  totalInventoryQuantity: number;
  lowStockCount: number;
  todayEntries: number;
  todayExits: number;
  recentTransactions: InventoryTransactionWithProduct[];
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TransactionFilters {
  search?: string;
  productId?: string;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
