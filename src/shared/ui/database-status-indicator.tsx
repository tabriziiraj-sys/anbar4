import { useEffect, useState } from 'react';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { useDatabaseStatus } from './database-status-provider';
import { useToast } from './toast';

export function DatabaseStatusIndicator() {
  const { status, errorMessage, databaseSize, lastChecked, checkConnection, exportDatabase } = useDatabaseStatus();
  const { showToast } = useToast();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  async function handleExport() {
    try {
      await exportDatabase();
      showToast('فایل‌های پشتیبان با موفقیت دانلود شدند', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در خروجی گرفتن', 'error');
    }
  }

  async function handleCheck() {
    await checkConnection();
    showToast('اتصال بررسی شد', 'info');
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'connecting':
        return { icon: RefreshCw, color: 'text-yellow-500', label: 'در حال اتصال...', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
      case 'connected':
        return { icon: CheckCircle, color: 'text-green-500', label: 'متصل', bg: 'bg-green-50 dark:bg-green-900/20' };
      case 'disconnected':
        return { icon: XCircle, color: 'text-red-500', label: 'قطع', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-500', label: 'خطا', bg: 'bg-red-50 dark:bg-red-900/20' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${statusInfo.bg} ${statusInfo.color}`}
        title="وضعیت اتصال دیتابیس"
      >
        <Database size={16} />
        <StatusIcon size={16} className={status === 'connecting' ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">{statusInfo.label}</span>
      </button>

      {showDetails && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDetails(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Database size={18} />
              وضعیت دیتابیس
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                <span className={`flex items-center gap-1 font-medium ${statusInfo.color}`}>
                  <StatusIcon size={14} />
                  {statusInfo.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">حجم دیتابیس:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatSize(databaseSize)}</span>
              </div>

              {lastChecked && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">آخرین بررسی:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {lastChecked.toLocaleTimeString('fa-IR')}
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  <p className="font-medium">خطا:</p>
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={handleCheck}
                    disabled={status === 'connecting'}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <RefreshCw size={14} className={status === 'connecting' ? 'animate-spin' : ''} />
                    بررسی مجدد
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={status !== 'connected'}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Download size={14} />
                    خروجی دیتابیس
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
