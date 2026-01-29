import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { setupBot } from './bot/telegram';
import { notificationService } from './providers';
import { TelegramProvider } from './providers/telegram';
import { runHeartbeat } from './services/heartbeat';
import { runMigrations } from './db/migrate';

const HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN environment variable is required');
    console.error('1. Create a bot via @BotFather on Telegram');
    console.error('2. Copy .env.example to .env and add your token');
    process.exit(1);
  }

  // Run database migrations
  await runMigrations();

  // Initialize bot
  const bot = new Telegraf(token);

  // Register notification provider
  notificationService.registerProvider(new TelegramProvider(bot), true);

  // Setup bot commands
  setupBot(bot);

  // Start heartbeat checker in the same process
  console.log('Starting heartbeat checker...');
  setInterval(async () => {
    try {
      await runHeartbeat();
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Run heartbeat immediately on start
  runHeartbeat().catch(console.error);

  // Enable graceful shutdown
  process.once('SIGINT', () => {
    console.log('\nShutting down...');
    bot.stop('SIGINT');
  });
  process.once('SIGTERM', () => {
    console.log('\nShutting down...');
    bot.stop('SIGTERM');
  });

  // Launch bot
  console.log('Starting Something Sweet bot...');
  await bot.launch();
  console.log('Bot is running! Press Ctrl+C to stop.');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
