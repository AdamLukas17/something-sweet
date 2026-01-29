import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getSqliteDb, getPgPool } from './connection';

const isProduction = process.env.NODE_ENV === 'production';

// PostgreSQL schema
const pgSchema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  chat_id TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  next_run_at TIMESTAMP,
  is_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_next_run_at ON users(next_run_at);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
`;

// SQLite schema
const sqliteSchema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  chat_id TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  next_run_at TEXT,
  is_paused INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_next_run_at ON users(next_run_at);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
`;

async function migrate() {
  console.log(`Running migrations (${isProduction ? 'PostgreSQL' : 'SQLite'})...`);

  if (isProduction) {
    const pool = getPgPool();
    await pool.query(pgSchema);
    await pool.end();
  } else {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = getSqliteDb();
    db.exec(sqliteSchema);
    db.close();
  }

  console.log('Migrations completed successfully!');
}

migrate().catch(console.error);
