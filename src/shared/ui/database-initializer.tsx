import { useEffect, useState, type ReactNode } from 'react';
import { getDatabase } from '../../infrastructure/database/database-client';
import { seedDatabase } from '../../infrastructure/database/seed-data';

export function DatabaseInitializer({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await seedDatabase();
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در اتصال به پایگاه داده');
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800 text-center">
          <p className="text-red-600 text-lg font-medium">خطا در بارگذاری</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری سیستم...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
