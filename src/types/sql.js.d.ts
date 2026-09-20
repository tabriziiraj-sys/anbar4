declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  interface Database {
    run(sql: string, params?: unknown[]): Database;
    exec(sql: string, params?: unknown[]): QueryResults[];
    prepare(sql: string): Statement;
    close(): void;
    export(): Uint8Array;
    getRowsModified(): number;
  }

  interface Statement {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    get(params?: unknown[]): unknown[];
    getAsObject(params?: unknown[]): Record<string, unknown>;
    run(params?: unknown[]): void;
    reset(): void;
    free(): void;
  }

  interface QueryResults {
    columns: string[];
    values: unknown[][];
  }

  interface SqlJsInitOptions {
    locateFile?: (filename: string) => string;
  }

  export default function initSqlJs(options?: SqlJsInitOptions): Promise<SqlJsStatic>;
  export { Database, Statement, QueryResults, SqlJsStatic };
}
