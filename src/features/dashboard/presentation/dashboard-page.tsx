import { useEffect, useState } from 'react';
import { Package, Layers, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { getActiveProductsCount, getTotalStock, getLowStockProducts } from '../../products/infrastructure/product-queries';
import { getRecentTransactions, getTodayStats } from '../../inventory-transactions/infrastructure/transaction-queries';
import type { InventoryTransactionWithProduct } from '../../../shared/types/domain.types';
import { formatDate, getTransactionTypeLabel } from '../../../shared/utils/formatting';

interface DashboardData {
  activeProducts: number;
  totalStock: number;
  lowStockCount: number;
  todayEntries: number;
  todayExits: number;
  recentTransactions: InventoryTransactionWithProduct[];
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [activeProducts, totalStock, lowStock, todayStats, recent] = await Promise.all([
        getActiveProductsCount(),
        getTotalStock(),
        getLowStockProducts(),
        getTodayStats(),
        getRecentTransactions(10),
      ]);
      setData({
        activeProducts,
        totalStock,
        lowStockCount: lowStock.length,
        todayEntries: todayStats.entries,
        todayExits: todayStats.exits,
        recentTransactions: recent,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-gray-500">در حال بارگذاری...</div></div>;
  }

  if (!data) return null;

  const stats = [
    { label: 'محصولات فعال', value: data.activeProducts, icon: Package, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    { label: 'موجودی کل', value: data.totalStock, icon: Layers, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
    { label: 'موجودی کم', value: data.lowStockCount, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
    { label: 'ورودی امروز', value: data.todayEntries, icon: ArrowDownToLine, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'خروجی امروز', value: data.todayExits, icon: ArrowUpFromLine, color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString('fa-IR')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">آخرین تراکنش‌ها</h3>
        </div>
        {data.recentTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            هنوز تراکنشی ثبت نشده است
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">تاریخ</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">محصول</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">نوع</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">مقدار</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">توضیحات</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{formatDate(t.transactionDate)}</td>
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{t.productName}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.type === 'IN' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {getTransactionTypeLabel(t.type)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{t.quantity.toLocaleString('fa-IR')}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{t.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
