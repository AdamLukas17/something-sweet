# Something Sweet

A Telegram bot that sends random reminders to do kind things for your significant other.

## Project Overview

This bot helps users maintain their relationships by sending periodic reminders with "sweet" task ideas - small gestures of love and kindness.

## Architecture

### Core Components

1. **Telegram Bot** (`src/bot/`) - Handles user interactions via Telegraf
   - `/start` - Registers new users
   - `/frequency` - Sets reminder frequency
   - `/pause` / `/resume` - Pause/resume reminders
   - `/status` - Check current settings

2. **Database** (`src/db/`) - Dual-database support
   - SQLite for local development (via better-sqlite3)
   - PostgreSQL for production (Supabase/Neon ready)
   - Schema: users table with frequency settings and next_run_at timestamp

3. **Heartbeat Service** (`src/services/heartbeat.ts`) - Hourly scheduler
   - Checks for users where `next_run_at <= NOW()`
   - Picks random sweet task from seed data
   - Sends notification via abstracted provider
   - Calculates next run time based on user frequency

4. **Notification Providers** (`src/providers/`) - Abstracted messaging
   - TelegramProvider (implemented)
   - WhatsAppProvider (placeholder for premium tier)

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  chat_id TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  next_run_at TIMESTAMP,
  is_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Frequency Options
- `daily` - Once per day
- `twice_weekly` - Twice per week
- `weekly` - Once per week (default)
- `biweekly` - Every two weeks
- `monthly` - Once per month

## Development

### Setup
```bash
npm install
cp .env.example .env
# Add your TELEGRAM_BOT_TOKEN to .env
npm run db:migrate
npm run db:seed
```

### Running
```bash
# Start bot (development)
npm run dev

# Run heartbeat checker (separate process)
npm run heartbeat

# Production
npm run build
npm start
```

### Environment Variables
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `DATABASE_URL` - PostgreSQL connection string (production)
- `NODE_ENV` - 'development' for SQLite, 'production' for PostgreSQL

## Key Design Decisions

1. **Heartbeat over Cron**: Using an hourly database check instead of cron jobs allows for:
   - Per-user scheduling flexibility
   - Easy horizontal scaling
   - No external cron dependencies

2. **Provider Abstraction**: The NotificationService interface allows easy addition of new channels (WhatsApp, Email) without changing core logic.

3. **SQLite for Dev**: Enables immediate local testing without cloud database setup.

## File Structure

```
src/
├── index.ts              # Main entry point
├── bot/
│   └── telegram.ts       # Telegram bot handlers
├── db/
│   ├── connection.ts     # Database connection factory
│   ├── migrate.ts        # Schema migrations
│   ├── seed.ts           # Seed sweet ideas
│   └── queries.ts        # Database operations
├── services/
│   ├── heartbeat.ts      # Hourly checker service
│   └── scheduler.ts      # Next run calculation
├── providers/
│   ├── index.ts          # Provider interface
│   ├── telegram.ts       # Telegram notification provider
│   └── whatsapp.ts       # WhatsApp placeholder
├── types/
│   └── index.ts          # TypeScript types
└── data/
    └── sweet-ideas.json  # 20 sweet task ideas
```
