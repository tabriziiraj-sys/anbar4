import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getAllCategories, createCategory, updateCategory, deleteCategory, categoryHasProducts } from '../infrastructure/category-queries';
import type { Category } from '../../../shared/types/domain.types';
import { formatDate } from '../../../shared/utils/formatting';
import { useToast } from '../../../shared/ui/toast';
import { Modal, ConfirmDialog } from '../../../shared/ui/dialog';

export function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [deleting, setDeleting] = useState<Category | null>(null);

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormName('');
    setFormDesc('');
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setFormName(cat.name);
    setFormDesc(cat.description);
    setShowForm(true);
  }

  async function handleSave() {
    try {
      if (editing) {
        await updateCategory(editing.id, { name: formName, description: formDesc });
        showToast('دسته‌بندی ویرایش شد', 'success');
      } else {
        await createCategory({ name: formName, description: formDesc });
        showToast('دسته‌بندی ایجاد شد', 'success');
      }
      setShowForm(false);
      loadCategories();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ذخیره', 'error');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    const hasProducts = await categoryHasProducts(deleting.id);
    if (hasProducts) {
      showToast('این دسته‌بندی دارای محصول است و قابل حذف نیست', 'error');
      setDeleting(null);
      return;
    }
    await deleteCategory(deleting.id);
    showToast('دسته‌بندی حذف شد', 'success');
    setDeleting(null);
    loadCategories();
  }

  if (loading) return <div className="py-20 text-center text-gray-500">در حال بارگذاری...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">دسته‌بندی‌ها</h3>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus size={18} />
          دسته‌بندی جدید
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">دسته‌بندی‌ای وجود ندارد</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{cat.name}</h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{cat.description || 'بدون توضیحات'}</p>
                  <p className="mt-2 text-xs text-gray-400">{formatDate(cat.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cat)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" aria-label="ویرایش">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setDeleting(cat)} className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" aria-label="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} title={editing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'} onClose={() => setShowForm(false)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">نام</label>
            <input id="cat-name" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label htmlFor="cat-desc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">توضیحات</label>
            <textarea id="cat-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">انصراف</button>
            <button onClick={handleSave} disabled={!formName.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">ذخیره</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="حذف دسته‌بندی"
        message={`آیا از حذف دسته‌بندی "${deleting?.name}" اطمینان دارید؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        variant="danger"
      />
    </div>
  );
}
