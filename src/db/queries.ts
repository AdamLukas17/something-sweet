import { query, queryOne } from './connection';
import { User, Frequency } from '../types';

interface UserRow {
  id: number;
  telegram_id: string;
  chat_id: string;
  frequency: string;
  next_run_at: string | null;
  is_paused: number | boolean;
  created_at: string;
  updated_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    telegram_id: row.telegram_id,
    chat_id: row.chat_id,
    frequency: row.frequency as Frequency,
    next_run_at: row.next_run_at ? new Date(row.next_run_at) : null,
    is_paused: Boolean(row.is_paused),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export async function findUserByTelegramId(telegramId: string): Promise<User | null> {
  const row = await queryOne<UserRow>(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId]
  );
  return row ? rowToUser(row) : null;
}

export async function createUser(
  telegramId: string,
  chatId: string,
  frequency: Frequency = 'weekly'
): Promise<User> {
  const nextRunAt = calculateNextRun(frequency);

  await query(
    `INSERT INTO users (telegram_id, chat_id, frequency, next_run_at)
     VALUES ($1, $2, $3, $4)`,
    [telegramId, chatId, frequency, nextRunAt.toISOString()]
  );

  const user = await findUserByTelegramId(telegramId);
  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function updateUserFrequency(
  telegramId: string,
  frequency: Frequency
): Promise<User | null> {
  const nextRunAt = calculateNextRun(frequency);

  await query(
    `UPDATE users
     SET frequency = $1, next_run_at = $2, updated_at = CURRENT_TIMESTAMP
     WHERE telegram_id = $3`,
    [frequency, nextRunAt.toISOString(), telegramId]
  );

  return findUserByTelegramId(telegramId);
}

export async function pauseUser(telegramId: string): Promise<User | null> {
  await query(
    `UPDATE users SET is_paused = $1, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $2`,
    [1, telegramId]
  );
  return findUserByTelegramId(telegramId);
}

export async function resumeUser(telegramId: string): Promise<User | null> {
  const nextRunAt = new Date();
  await query(
    `UPDATE users
     SET is_paused = $1, next_run_at = $2, updated_at = CURRENT_TIMESTAMP
     WHERE telegram_id = $3`,
    [0, nextRunAt.toISOString(), telegramId]
  );
  return findUserByTelegramId(telegramId);
}

export async function getUsersDueForNotification(): Promise<User[]> {
  const now = new Date().toISOString();
  const result = await query<UserRow>(
    `SELECT * FROM users
     WHERE next_run_at <= $1
     AND is_paused = $2`,
    [now, 0]
  );
  return result.rows.map(rowToUser);
}

export async function updateNextRun(telegramId: string, nextRunAt: Date): Promise<void> {
  await query(
    `UPDATE users SET next_run_at = $1, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $2`,
    [nextRunAt.toISOString(), telegramId]
  );
}

function calculateNextRun(frequency: Frequency): Date {
  const now = new Date();
  const next = new Date(now);

  // Add randomness to spread out notifications
  const randomHour = Math.floor(Math.random() * 12) + 8; // 8 AM - 8 PM
  const randomMinute = Math.floor(Math.random() * 60);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'twice_weekly':
      next.setDate(next.getDate() + Math.floor(Math.random() * 2) + 3); // 3-4 days
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  next.setHours(randomHour, randomMinute, 0, 0);
  return next;
}

export { calculateNextRun };
