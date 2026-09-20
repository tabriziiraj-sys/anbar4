import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockExitSchema, type StockExitInput } from '../application/schemas/transaction.schema';
import { createStockExit } from '../infrastructure/transaction-queries';
import { searchProductsForSelect } from '../../products/infrastructure/product-queries';
import type { Product } from '../../../shared/types/domain.types';
import { getTodayISO } from '../../../shared/utils/formatting';
import { useToast } from '../../../shared/ui/toast';

export function StockExitPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<StockExitInput>({
    resolver: zodResolver(stockExitSchema) as never,
    defaultValues: {
      productId: '',
      quantity: 0,
      transactionDate: getTodayISO(),
      reference: '',
      recipient: '',
      description: '',
    },
  });

  useEffect(() => {
    const preselectedId = searchParams.get('product');
    if (preselectedId) {
      searchProductsForSelect('').then((products) => {
        const found = products.find((p) => p.id === preselectedId);
        if (found) {
          setSelectedProduct(found);
          setValue('productId', found.id);
        }
      });
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    if (productSearch.length >= 1) {
      searchProductsForSelect(productSearch).then(setProductResults);
    } else {
      setProductResults([]);
    }
  }, [productSearch]);

  async function onSubmit(data: StockExitInput) {
    try {
      await createStockExit(data);
      showToast('خروج کالا با موفقیت ثبت شد', 'success');
      reset({ productId: '', quantity: 0, transactionDate: getTodayISO(), reference: '', recipient: '', description: '' });
      setSelectedProduct(null);
      setProductSearch('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ثبت خروج کالا', 'error');
    }
  }

  function selectProduct(product: Product) {
    setSelectedProduct(product);
    setValue('productId', product.id);
    setProductSearch('');
    setProductResults([]);
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">ثبت خروج کالا از انبار</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">محصول</label>
            {selectedProduct ? (
              <div className="flex items-center justify-between rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 dark:border-orange-700 dark:bg-orange-900/20">
                <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  {selectedProduct.name} ({selectedProduct.sku}) — موجودی: {selectedProduct.currentStock}
                </span>
                <button type="button" onClick={() => { setSelectedProduct(null); setValue('productId', ''); }} className="text-sm text-red-600 hover:underline">
                  تغییر
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {productResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectProduct(p)}
                        className="block w-full px-3 py-2 text-right text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {p.name} <span className="text-gray-400">({p.sku})</span> — موجودی: {p.currentStock}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.productId && <p className="mt-1 text-xs text-red-600">{errors.productId.message}</p>}
          </div>

          <div>
            <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">مقدار</label>
            <input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
          </div>

          <div>
            <label htmlFor="transactionDate" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">تاریخ</label>
            <input id="transactionDate" type="date" {...register('transactionDate')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>

          <div>
            <label htmlFor="recipient" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">گیرنده</label>
            <input id="recipient" {...register('recipient')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            {errors.recipient && <p className="mt-1 text-xs text-red-600">{errors.recipient.message}</p>}
          </div>

          <div>
            <label htmlFor="reference" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">شماره مرجع</label>
            <input id="reference" {...register('reference')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">توضیحات</label>
            <textarea id="description" {...register('description')} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>

          <button type="submit" disabled={isSubmitting || !selectedProduct} className="w-full rounded-lg bg-orange-600 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">
            {isSubmitting ? 'در حال ثبت...' : 'ثبت خروج کالا'}
          </button>
        </form>
      </div>
    </div>
  );
}
