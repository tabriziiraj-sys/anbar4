import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getTransactions } from '../infrastructure/transaction-queries';
import { getAllCategories } from '../../categories/infrastructure/category-queries';
import { searchProductsForSelect } from '../../products/infrastructure/product-queries';
import type { InventoryTransactionWithProduct, Category, Product } from '../../../shared/types/domain.types';
import { formatDate, getTransactionTypeLabel } from '../../../shared/utils/formatting';

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<InventoryTransactionWithProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const productId = searchParams.get('product') || '';
  const categoryId = searchParams.get('category') || '';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [transResult, cats, prods] = await Promise.all([
        getTransactions({
          page,
          search,
          type: (type as 'IN' | 'OUT') || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          productId: productId || undefined,
          categoryId: categoryId || undefined,
        }),
        getAllCategories(),
        searchProductsForSelect(''),
      ]);
      setTransactions(transResult.items);
      setTotal(transResult.total);
      setTotalPages(transResult.totalPages);
      setCategories(cats);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, dateFrom, dateTo, productId, categoryId]);

  useEffect(() => { loadData(); }, [loadData]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-10 pl-4 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select value={type} onChange={(e) => updateParam('type', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="">همه انواع</option>
          <option value="IN">ورود</option>
          <option value="OUT">خروج</option>
        </select>
        <select value={productId} onChange={(e) => updateParam('product', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="">همه محصولات</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={categoryId} onChange={(e) => updateParam('category', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="">همه دسته‌ها</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => updateParam('dateFrom', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" title="از تاریخ" />
        <input type="date" value={dateTo} onChange={(e) => updateParam('dateTo', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" title="تا تاریخ" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-500">در حال بارگذاری...</div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">تراکنشی یافت نشد</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">تاریخ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">محصول</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">کد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">نوع</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">مقدار</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">موجودی بعد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">مرجع</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">توضیحات</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(t.transactionDate)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.productName}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{t.productSku}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.type === 'IN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {getTransactionTypeLabel(t.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.quantity.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.stockAfterTransaction.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.reference || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <span className="text-sm text-gray-500">{total.toLocaleString('fa-IR')} تراکنش</span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))} className="rounded px-3 py-1 text-sm disabled:opacity-50 border border-gray-300 dark:border-gray-600 dark:text-white">قبلی</button>
                <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => updateParam('page', String(page + 1))} className="rounded px-3 py-1 text-sm disabled:opacity-50 border border-gray-300 dark:border-gray-600 dark:text-white">بعدی</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
