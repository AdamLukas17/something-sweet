import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { getUsersDueForNotification, updateNextRun } from '../db/queries';
import { notificationService } from '../providers';
import { TelegramProvider } from '../providers/telegram';
import { calculateNextRun } from './scheduler';
import sweetIdeas from '../data/sweet-ideas.json';
import { SweetIdea } from '../types';

const HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Pick a random sweet idea
function getRandomIdea(): SweetIdea {
  const { ideas } = sweetIdeas;
  const index = Math.floor(Math.random() * ideas.length);
  return ideas[index];
}

// Format the notification message
function formatMessage(idea: SweetIdea): string {
  return (
    `💕 <b>Something Sweet for Today</b>\n\n` +
    `<b>${idea.title}</b>\n\n` +
    `${idea.description}\n\n` +
    `<i>Category: ${idea.category.replace('_', ' ')}</i>`
  );
}

// Process due notifications
async function processDueNotifications(): Promise<number> {
  const users = await getUsersDueForNotification();
  let sentCount = 0;

  console.log(`Found ${users.length} users due for notification`);

  for (const user of users) {
    try {
      const idea = getRandomIdea();
      const message = formatMessage(idea);

      const success = await notificationService.send({
        userId: user.telegram_id,
        chatId: user.chat_id,
        message,
      });

      if (success) {
        // Calculate and update next run time
        const nextRun = calculateNextRun(user.frequency);
        await updateNextRun(user.telegram_id, nextRun);
        sentCount++;
        console.log(
          `Sent notification to user ${user.telegram_id}, next run: ${nextRun.toISOString()}`
        );
      } else {
        console.error(`Failed to send notification to user ${user.telegram_id}`);
      }
    } catch (error) {
      console.error(`Error processing user ${user.telegram_id}:`, error);
    }
  }

  return sentCount;
}

// Run the heartbeat once
async function runHeartbeat(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Running heartbeat check...`);
  const sentCount = await processDueNotifications();
  console.log(`[${new Date().toISOString()}] Heartbeat complete. Sent ${sentCount} notifications.`);
}

// Start the heartbeat loop
async function startHeartbeatLoop(): Promise<void> {
  console.log('Starting heartbeat service...');
  console.log(`Check interval: ${HEARTBEAT_INTERVAL_MS / 1000 / 60} minutes`);

  // Initialize Telegram provider
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  const bot = new Telegraf(token);
  notificationService.registerProvider(new TelegramProvider(bot), true);

  // Run immediately on start
  await runHeartbeat();

  // Then run on interval
  setInterval(async () => {
    try {
      await runHeartbeat();
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, HEARTBEAT_INTERVAL_MS);

  console.log('Heartbeat service started. Press Ctrl+C to stop.');
}

// Run as standalone service
if (require.main === module) {
  startHeartbeatLoop().catch((error) => {
    console.error('Failed to start heartbeat service:', error);
    process.exit(1);
  });
}

export { runHeartbeat, processDueNotifications, getRandomIdea, formatMessage };
