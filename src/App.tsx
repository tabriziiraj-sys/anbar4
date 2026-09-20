import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './shared/ui/theme-provider';
import { ToastProvider } from './shared/ui/toast';
import { AppLayout } from './shared/ui/app-layout';
import { DashboardPage } from './features/dashboard/presentation/dashboard-page';
import { ProductsPage } from './features/products/presentation/products-page';
import { ProductDetailsPage } from './features/products/presentation/product-details-page';
import { CategoriesPage } from './features/categories/presentation/categories-page';
import { StockEntryPage } from './features/inventory-transactions/presentation/stock-entry-page';
import { StockExitPage } from './features/inventory-transactions/presentation/stock-exit-page';
import { TransactionsPage } from './features/inventory-transactions/presentation/transactions-page';
import { LowStockPage } from './features/low-stock/presentation/low-stock-page';
import { ReportsPage } from './features/reports/presentation/reports-page';
import { DatabaseInitializer } from './shared/ui/database-initializer';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <DatabaseInitializer>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/stock-entry" element={<StockEntryPage />} />
                <Route path="/stock-exit" element={<StockExitPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/low-stock" element={<LowStockPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </AppLayout>
          </DatabaseInitializer>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
