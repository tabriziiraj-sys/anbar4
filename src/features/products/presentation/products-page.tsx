import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Archive, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { getProducts, deactivateProduct } from '../infrastructure/product-queries';
import { getAllCategories } from '../../categories/infrastructure/category-queries';
import type { ProductWithCategory, Category } from '../../../shared/types/domain.types';
import { formatDate } from '../../../shared/utils/formatting';
import { useToast } from '../../../shared/ui/toast';
import { ConfirmDialog } from '../../../shared/ui/dialog';
import { ProductFormModal } from './product-form-modal';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<ProductWithCategory | null>(null);

  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsResult, cats] = await Promise.all([
        getProducts({ page, search, categoryId: categoryId || undefined, isActive: true }),
        getAllCategories(),
      ]);
      setProducts(productsResult.items);
      setTotal(productsResult.total);
      setTotalPages(productsResult.totalPages);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId]);

  useEffect(() => { loadData(); }, [loadData]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  }

  async function handleArchive() {
    if (!confirmArchive) return;
    await deactivateProduct(confirmArchive.id);
    showToast('محصول با موفقیت غیرفعال شد', 'success');
    setConfirmArchive(null);
    loadData();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="جستجوی محصول..."
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-10 pl-4 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => updateParam('category', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">همه دسته‌بندی‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          محصول جدید
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">در حال بارگذاری...</div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">محصولی یافت نشد</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">کد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">نام</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">دسته‌بندی</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">موجودی</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">حداقل</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">واحد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">تاریخ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.categoryName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={p.currentStock <= p.minimumStock ? 'text-red-600 font-bold' : 'text-gray-700 dark:text-gray-300'}>
                        {p.currentStock.toLocaleString('fa-IR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.minimumStock.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.unit}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/products/${p.id}`)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title="مشاهده" aria-label="مشاهده">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => { setEditingProduct(p); setShowForm(true); }} className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="ویرایش" aria-label="ویرایش">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => navigate(`/stock-entry?product=${p.id}`)} className="rounded p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30" title="ورود کالا" aria-label="ورود کالا">
                          <ArrowDownToLine size={16} />
                        </button>
                        <button onClick={() => navigate(`/stock-exit?product=${p.id}`)} className="rounded p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30" title="خروج کالا" aria-label="خروج کالا">
                          <ArrowUpFromLine size={16} />
                        </button>
                        <button onClick={() => setConfirmArchive(p)} className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="غیرفعال‌سازی" aria-label="غیرفعال‌سازی">
                          <Archive size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {total.toLocaleString('fa-IR')} محصول — صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => updateParam('page', String(page - 1))}
                  className="rounded px-3 py-1 text-sm disabled:opacity-50 border border-gray-300 dark:border-gray-600 dark:text-white"
                >
                  قبلی
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => updateParam('page', String(page + 1))}
                  className="rounded px-3 py-1 text-sm disabled:opacity-50 border border-gray-300 dark:border-gray-600 dark:text-white"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingProduct(null); }}
        product={editingProduct}
        categories={categories}
        onSaved={() => { setShowForm(false); setEditingProduct(null); loadData(); }}
      />

      {/* Archive Confirmation */}
      <ConfirmDialog
        open={!!confirmArchive}
        title="غیرفعال‌سازی محصول"
        message={`آیا از غیرفعال‌سازی محصول "${confirmArchive?.name}" اطمینان دارید؟ این محصول دیگر در لیست فعال نمایش داده نمی‌شود اما تاریخچه تراکنش‌ها حفظ خواهد شد.`}
        confirmLabel="غیرفعال‌سازی"
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(null)}
        variant="danger"
      />
    </div>
  );
}
