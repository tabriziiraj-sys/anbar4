import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Eye } from 'lucide-react';
import { getLowStockProducts } from '../../products/infrastructure/product-queries';
import type { ProductWithCategory } from '../../../shared/types/domain.types';

export function LowStockPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLowStockProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-gray-500">در حال بارگذاری...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-900/20">
        <AlertTriangle size={20} className="text-orange-600" />
        <span className="text-sm text-orange-800 dark:text-orange-300">
          {products.length.toLocaleString('fa-IR')} محصول با موجودی کمتر یا مساوی حداقل تعیین‌شده
        </span>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">همه محصولات موجودی کافی دارند ✓</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">کد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">نام محصول</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">دسته‌بندی</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">موجودی فعلی</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">حداقل</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">کسری</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const deficit = p.minimumStock - p.currentStock;
                  return (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.categoryName || '—'}</td>
                      <td className="px-4 py-3 font-bold text-red-600">{p.currentStock.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.minimumStock.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-orange-600">{deficit > 0 ? deficit.toLocaleString('fa-IR') : '0'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/products/${p.id}`)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="مشاهده">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => navigate(`/stock-entry?product=${p.id}`)} className="rounded p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30" aria-label="ورود کالا">
                            <ArrowDownToLine size={16} />
                          </button>
                          <button onClick={() => navigate(`/stock-exit?product=${p.id}`)} className="rounded p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30" aria-label="خروج کالا">
                            <ArrowUpFromLine size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
