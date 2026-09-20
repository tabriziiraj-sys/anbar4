import { useState } from 'react';
import { Database, Download, Upload, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { useDatabaseStatus } from '../../../shared/ui/database-status-provider';
import { useToast } from '../../../shared/ui/toast';
import { ConfirmDialog } from '../../../shared/ui/dialog';
import { resetDatabase } from '../../../infrastructure/database/database-client';
import { seedDatabase } from '../../../infrastructure/database/seed-data';

export function DatabaseManagementPage() {
  const { status, databaseSize, lastChecked, checkConnection, exportDatabase } = useDatabaseStatus();
  const { showToast } = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportDatabase();
      showToast('فایل‌های پشتیبان با موفقیت دانلود شدند', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در خروجی گرفتن', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      await resetDatabase();
      await seedDatabase();
      await checkConnection();
      showToast('دیتابیس با موفقیت بازنشانی شد', 'success');
      setShowResetConfirm(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در بازنشانی دیتابیس', 'error');
    } finally {
      setIsResetting(false);
    }
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Status Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <Database size={24} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">وضعیت دیتابیس</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">وضعیت اتصال</p>
            <p className={`mt-1 text-lg font-bold ${
              status === 'connected' ? 'text-green-600' :
              status === 'connecting' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {status === 'connected' ? '✓ متصل' :
               status === 'connecting' ? '⟳ در حال اتصال' :
               '✗ قطع'}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">حجم دیتابیس</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatSize(databaseSize)}</p>
          </div>

          {lastChecked && (
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700 sm:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">آخرین بررسی</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {lastChecked.toLocaleString('fa-IR')}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={checkConnection}
          disabled={status === 'connecting'}
          className="mt-4 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <RefreshCw size={16} className={status === 'connecting' ? 'animate-spin' : ''} />
          بررسی مجدد اتصال
        </button>
      </div>

      {/* Export Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <Download size={24} className="text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">خروجی گرفتن از دیتابیس</h2>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          با کلیک روی دکمه زیر، دو فایل پشتیبان از دیتابیس دانلود می‌شود:
        </p>

        <ul className="mb-4 mr-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>فایل JSON شامل تمام داده‌ها به صورت ساختاریافته</li>
          <li>فایل SQL شامل دستورات INSERT برای بازسازی دیتابیس</li>
        </ul>

        <button
          onClick={handleExport}
          disabled={isExporting || status !== 'connected'}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Download size={16} />
          {isExporting ? 'در حال آماده‌سازی...' : 'دانلود فایل‌های پشتیبان'}
        </button>
      </div>

      {/* Reset Card */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle size={24} className="text-red-600" />
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-300">بازنشانی دیتابیس</h2>
        </div>

        <p className="mb-4 text-sm text-red-800 dark:text-red-400">
          <strong>هشدار:</strong> این عملیات تمام داده‌های فعلی را حذف کرده و دیتابیس را با داده‌های نمونه بازنشانی می‌کند.
          این عملیات غیرقابل بازگشت است.
        </p>

        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {isResetting ? 'در حال بازنشانی...' : 'بازنشانی دیتابیس'}
        </button>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={showResetConfirm}
        title="بازنشانی دیتابیس"
        message="آیا از بازنشانی دیتابیس اطمینان دارید؟ تمام داده‌های فعلی حذف خواهند شد و دیتابیس با داده‌های نمونه جایگزین می‌شود."
        confirmLabel="بازنشانی"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        variant="danger"
      />
    </div>
  );
}
