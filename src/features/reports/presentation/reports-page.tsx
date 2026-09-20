import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { getProducts } from '../../products/infrastructure/product-queries';
import { getLowStockProducts } from '../../products/infrastructure/product-queries';
import { getAllTransactionsForExport } from '../../inventory-transactions/infrastructure/transaction-queries';
import { getAllCategories } from '../../categories/infrastructure/category-queries';
import type { ProductWithCategory, InventoryTransactionWithProduct, Category } from '../../../shared/types/domain.types';
import { formatDate, getTransactionTypeLabel } from '../../../shared/utils/formatting';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'low-stock' | 'transactions'>('inventory');
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [lowStock, setLowStock] = useState<ProductWithCategory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransactionWithProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [prods, low, trans, cats] = await Promise.all([
        getProducts({ pageSize: 1000, isActive: true }),
        getLowStockProducts(),
        getAllTransactionsForExport({}),
        getAllCategories(),
      ]);
      setProducts(prods.items);
      setLowStock(low);
      setTransactions(trans);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV(filename: string, headers: string[], rows: string[][]) {
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportInventory() {
    const headers = ['کد محصول', 'نام محصول', 'دسته‌بندی', 'موجودی فعلی', 'حداقل موجودی', 'واحد'];
    const rows = products.map((p) => [p.sku, p.name, p.categoryName || '', String(p.currentStock), String(p.minimumStock), p.unit]);
    exportCSV('inventory-report.csv', headers, rows);
  }

  function exportLowStock() {
    const headers = ['کد محصول', 'نام محصول', 'موجودی فعلی', 'حداقل موجودی', 'کسری'];
    const rows = lowStock.map((p) => [p.sku, p.name, String(p.currentStock), String(p.minimumStock), String(Math.max(0, p.minimumStock - p.currentStock))]);
    exportCSV('low-stock-report.csv', headers, rows);
  }

  function exportTransactions() {
    const headers = ['تاریخ', 'محصول', 'کد', 'نوع', 'مقدار', 'موجودی بعد', 'مرجع', 'توضیحات'];
    const rows = transactions.map((t) => [
      formatDate(t.transactionDate), t.productName, t.productSku,
      getTransactionTypeLabel(t.type), String(t.quantity), String(t.stockAfterTransaction),
      t.reference, t.description,
    ]);
    exportCSV('transactions-report.csv', headers, rows);
  }

  if (loading) return <div className="py-20 text-center text-gray-500">در حال بارگذاری...</div>;

  const tabs = [
    { id: 'inventory' as const, label: 'موجودی فعلی' },
    { id: 'low-stock' as const, label: 'موجودی کم' },
    { id: 'transactions' as const, label: 'تراکنش‌ها' },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory Report */}
      {activeTab === 'inventory' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{products.length.toLocaleString('fa-IR')} محصول</span>
            <button onClick={exportInventory} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <Download size={16} />
              خروجی CSV
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-right font-medium text-gray-500">کد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">نام</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">دسته‌بندی</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">موجودی</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">حداقل</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">واحد</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300">{p.sku}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{p.categoryName || '—'}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{p.currentStock.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{p.minimumStock.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Report */}
      {activeTab === 'low-stock' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{lowStock.length.toLocaleString('fa-IR')} محصول با موجودی کم</span>
            <button onClick={exportLowStock} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <Download size={16} />
              خروجی CSV
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-right font-medium text-gray-500">کد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">نام</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">موجودی</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">حداقل</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">کسری</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300">{p.sku}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-2 text-red-600 font-bold">{p.currentStock.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{p.minimumStock.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-2 text-orange-600">{Math.max(0, p.minimumStock - p.currentStock).toLocaleString('fa-IR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Report */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{transactions.length.toLocaleString('fa-IR')} تراکنش</span>
            <button onClick={exportTransactions} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <Download size={16} />
              خروجی CSV
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-right font-medium text-gray-500">تاریخ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">محصول</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">نوع</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">مقدار</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">موجودی بعد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">مرجع</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 100).map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatDate(t.transactionDate)}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{t.productName}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.type === 'IN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{getTransactionTypeLabel(t.type)}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{t.quantity.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{t.stockAfterTransaction.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{t.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
