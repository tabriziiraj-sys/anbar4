import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, type CreateProductInput } from '../application/schemas/product.schema';
import { createProduct, updateProduct } from '../infrastructure/product-queries';
import type { Category, ProductWithCategory } from '../../../shared/types/domain.types';
import { PRODUCT_UNITS } from '../../../shared/utils/formatting';
import { Modal } from '../../../shared/ui/dialog';
import { useToast } from '../../../shared/ui/toast';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductWithCategory | null;
  categories: Category[];
  onSaved: () => void;
}

export function ProductFormModal({ open, onClose, product, categories, onSaved }: ProductFormModalProps) {
  const { showToast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as never,
    defaultValues: {
      name: '',
      sku: '',
      categoryId: null,
      unit: 'عدد',
      minimumStock: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        unit: product.unit,
        minimumStock: product.minimumStock,
        description: product.description,
      });
    } else {
      reset({
        name: '',
        sku: '',
        categoryId: null,
        unit: 'عدد',
        minimumStock: 0,
        description: '',
      });
    }
  }, [product, reset, open]);

  async function onSubmit(data: CreateProductInput) {
    try {
      if (product) {
        await updateProduct(product.id, data);
        showToast('محصول با موفقیت ویرایش شد', 'success');
      } else {
        await createProduct(data);
        showToast('محصول با موفقیت ایجاد شد', 'success');
      }
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ذخیره محصول';
      showToast(message, 'error');
    }
  }

  return (
    <Modal open={open} title={product ? 'ویرایش محصول' : 'محصول جدید'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">نام محصول</label>
          <input
            id="name"
            {...register('name')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="sku" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">کد محصول (SKU)</label>
          <input
            id="sku"
            {...register('sku')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku.message}</p>}
        </div>

        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">دسته‌بندی</label>
          <select
            id="categoryId"
            {...register('categoryId')}
            onChange={(e) => setValue('categoryId', e.target.value || null)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">بدون دسته‌بندی</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="unit" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">واحد شمارش</label>
          <select
            id="unit"
            {...register('unit')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="minimumStock" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">حداقل موجودی</label>
          <input
            id="minimumStock"
            type="number"
            {...register('minimumStock')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {errors.minimumStock && <p className="mt-1 text-xs text-red-600">{errors.minimumStock.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">توضیحات</label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">
            انصراف
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'در حال ذخیره...' : product ? 'ویرایش' : 'ایجاد'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
