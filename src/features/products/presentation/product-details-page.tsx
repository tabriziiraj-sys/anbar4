import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRight, Package } from 'lucide-react';
import { getProductById } from '../infrastructure/product-queries';
import { getProductTransactions } from '../../inventory-transactions/infrastructure/transaction-queries';
import type { ProductWithCategory, InventoryTransaction } from '../../../shared/types/domain.types';
import { formatDate, formatDateTime, getTransactionTypeLabel } from '../../../shared/utils/formatting';

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getProductById(id),
      getProductTransactions(id),
    ]).then(([prod, trans]) => {
      setProduct(prod);
      setTransactions(trans);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 text-center text-gray-500">در حال بارگذاری...</div>;
  if (!product) return <div className="py-20 text-center text-gray-500">محصول یافت نشد</div>;

  const isLow = product.currentStock <= product.minimumStock;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => navigate('/products')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <ArrowRight size={16} />
        بازگشت به لیست محصولات
      </button>

      {/* Product Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Package size={24} className="text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                product.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {product.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            <p className="font-mono text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/stock-entry?product=${product.id}`)} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <ArrowDownToLine size={16} />
              ورود کالا
            </button>
            <button onClick={() => navigate(`/stock-exit?product=${product.id}`)} className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              <ArrowUpFromLine size={16} />
              خروج کالا
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">موجودی فعلی</p>
            <p className={`text-lg font-bold ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {product.currentStock.toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">حداقل موجودی</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{product.minimumStock.toLocaleString('fa-IR')}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">دسته‌بندی</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{product.categoryName || '—'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">واحد</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{product.unit}</p>
          </div>
        </div>

        {product.description && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">توضیحات</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{product.description}</p>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400">
          تاریخ ایجاد: {formatDateTime(product.createdAt)} | آخرین به‌روزرسانی: {formatDateTime(product.updatedAt)}
        </p>
      </div>

      {/* Transaction History */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تراکنش‌های اخیر</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            هنوز تراکنشی ثبت نشده است
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">تاریخ</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">نوع</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">مقدار</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">موجودی بعد</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">مرجع</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">توضیحات</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{formatDate(t.transactionDate)}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.type === 'IN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{getTransactionTypeLabel(t.type)}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{t.quantity.toLocaleString('fa-IR')}</td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{t.stockAfterTransaction.toLocaleString('fa-IR')}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{t.reference || '—'}</td>
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
