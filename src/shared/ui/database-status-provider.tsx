import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getDatabase, persistDatabase } from '../../infrastructure/database/database-client';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface DatabaseStatusContextType {
  status: ConnectionStatus;
  errorMessage: string | null;
  databaseSize: number | null;
  lastChecked: Date | null;
  checkConnection: () => Promise<void>;
  exportDatabase: () => Promise<void>;
}

const DatabaseStatusContext = createContext<DatabaseStatusContextType | null>(null);

export function DatabaseStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [databaseSize, setDatabaseSize] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      setStatus('connecting');
      const db = await getDatabase();
      
      // تست اتصال با یه کوئری ساده
      const result = db.exec('SELECT 1 as test');
      
      if (result.length > 0 && result[0].values.length > 0) {
        setStatus('connected');
        setErrorMessage(null);
        
        // محاسبه حجم دیتابیس
        const data = db.export();
        setDatabaseSize(data.length);
        setLastChecked(new Date());
      } else {
        setStatus('error');
        setErrorMessage('پاسخ نامعتبر از دیتابیس');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'خطای ناشناخته');
    }
  }, []);

  const exportDatabase = useCallback(async () => {
    try {
      const db = await getDatabase();
      
      // استخراج تمام داده‌ها
      const tables = ['categories', 'products', 'inventory_transactions'];
      const exportData: Record<string, unknown[]> = {};
      
      for (const table of tables) {
        const result = db.exec(`SELECT * FROM ${table}`);
        if (result.length > 0) {
          const columns = result[0].columns;
          exportData[table] = result[0].values.map((row: unknown[]) => {
            const obj: Record<string, unknown> = {};
            columns.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          });
        } else {
          exportData[table] = [];
        }
      }
      
      // ایجاد فایل JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      // همچنین یه فایل SQL dump بساز
      const sqlDump = generateSQLDump(db);
      const sqlBlob = new Blob([sqlDump], { type: 'text/plain' });
      const sqlUrl = URL.createObjectURL(sqlBlob);
      const sqlLink = document.createElement('a');
      sqlLink.href = sqlUrl;
      sqlLink.download = `database-backup-${new Date().toISOString().split('T')[0]}.sql`;
      sqlLink.click();
      URL.revokeObjectURL(sqlUrl);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'خطا در خروجی گرفتن از دیتابیس');
    }
  }, []);

  return (
    <DatabaseStatusContext.Provider value={{
      status,
      errorMessage,
      databaseSize,
      lastChecked,
      checkConnection,
      exportDatabase,
    }}>
      {children}
    </DatabaseStatusContext.Provider>
  );
}

export function useDatabaseStatus() {
  const context = useContext(DatabaseStatusContext);
  if (!context) throw new Error('useDatabaseStatus must be used within DatabaseStatusProvider');
  return context;
}

function generateSQLDump(db: unknown): string {
  const database = db as { exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }> };
  const tables = ['categories', 'products', 'inventory_transactions'];
  let sql = '-- Database Backup\n';
  sql += `-- Generated at: ${new Date().toISOString()}\n\n`;
  
  for (const table of tables) {
    const result = database.exec(`SELECT * FROM ${table}`);
    if (result.length > 0 && result[0].values.length > 0) {
      sql += `-- Table: ${table}\n`;
      for (const row of result[0].values) {
        const values = row.map((val) => {
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'number') return val.toString();
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');
        sql += `INSERT INTO ${table} VALUES (${values});\n`;
      }
      sql += '\n';
    }
  }
  
  return sql;
}
