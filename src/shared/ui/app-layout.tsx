import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  AlertTriangle,
  FileBarChart,
  Database,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';
import { DatabaseStatusIndicator } from './database-status-indicator';

const navigation = [
  { name: 'داشبورد', href: '/', icon: LayoutDashboard },
  { name: 'محصولات', href: '/products', icon: Package },
  { name: 'دسته‌بندی‌ها', href: '/categories', icon: Tags },
  { name: 'ورود کالا', href: '/stock-entry', icon: ArrowDownToLine },
  { name: 'خروج کالا', href: '/stock-exit', icon: ArrowUpFromLine },
  { name: 'تراکنش‌ها', href: '/transactions', icon: ClipboardList },
  { name: 'موجودی کم', href: '/low-stock', icon: AlertTriangle },
  { name: 'گزارش‌ها', href: '/reports', icon: FileBarChart },
  { name: 'مدیریت دیتابیس', href: '/database', icon: Database },
];

const pageTitleMap: Record<string, string> = {
  '/': 'داشبورد',
  '/products': 'مدیریت محصولات',
  '/categories': 'دسته‌بندی‌ها',
  '/stock-entry': 'ورود کالا به انبار',
  '/stock-exit': 'خروج کالا از انبار',
  '/transactions': 'تاریخچه تراکنش‌ها',
  '/low-stock': 'محصولات با موجودی کم',
  '/reports': 'گزارش‌ها',
  '/database': 'مدیریت دیتابیس',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/products/') && pathname.endsWith('/edit')) return 'ویرایش محصول';
  if (pathname.startsWith('/products/')) return 'جزئیات محصول';
  return pageTitleMap[pathname] || 'سیستم مدیریت انبار';
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  const today = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 dark:bg-gray-800 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">مدیریت انبار</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:mr-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="باز کردن منو"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <DatabaseStatusIndicator />
            <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">{today}</span>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="تغییر تم"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
