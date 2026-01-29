import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// SQLite connection for development
let sqliteDb: Database.Database | null = null;

export function getSqliteDb(): Database.Database {
  if (!sqliteDb) {
    const dbPath = path.join(process.cwd(), 'data', 'something-sweet.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
  }
  return sqliteDb;
}

// PostgreSQL connection for production
let pgPool: Pool | null = null;

export function getPgPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    });
  }
  return pgPool;
}

// Generic query interface
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
  if (isProduction) {
    const pool = getPgPool();
    const result = await pool.query(sql, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } else {
    const db = getSqliteDb();
    // Convert PostgreSQL placeholders ($1, $2) to SQLite (?, ?)
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');

    // Detect if it's a SELECT query
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      const stmt = db.prepare(sqliteSql);
      const rows = stmt.all(...params) as T[];
      return { rows, rowCount: rows.length };
    } else {
      const stmt = db.prepare(sqliteSql);
      const result = stmt.run(...params);
      return { rows: [], rowCount: result.changes };
    }
  }
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] ?? null;
}

export function closeConnections(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (pgPool) {
    pgPool.end();
    pgPool = null;
  }
}
