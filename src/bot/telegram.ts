import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import {
  findUserByTelegramId,
  createUser,
  updateUserFrequency,
  pauseUser,
  resumeUser,
} from '../db/queries';
import { Frequency, FREQUENCY_LABELS, SweetIdea } from '../types';
import sweetIdeas from '../data/sweet-ideas.json';

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

export function setupBot(bot: Telegraf): void {
  // /start command - register new user
  bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();

    try {
      let user = await findUserByTelegramId(telegramId);

      if (user) {
        await ctx.reply(
          `Welcome back! You're already registered.\n\n` +
            `Current frequency: ${FREQUENCY_LABELS[user.frequency]}\n` +
            `Status: ${user.is_paused ? 'Paused' : 'Active'}\n\n` +
            `Use /frequency to change how often you get reminders.\n` +
            `Use /pause or /resume to control notifications.`
        );
      } else {
        user = await createUser(telegramId, chatId);
        await ctx.reply(
          `Welcome to Something Sweet! 💕\n\n` +
            `I'll send you random reminders to do kind things for your significant other.\n\n` +
            `Your current frequency is set to: ${FREQUENCY_LABELS[user.frequency]}\n\n` +
            `Commands:\n` +
            `/frequency - Change reminder frequency\n` +
            `/pause - Pause reminders\n` +
            `/resume - Resume reminders\n` +
            `/status - Check your settings`
        );
      }
    } catch (error) {
      console.error('Error in /start:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /frequency command - show frequency options
  bot.command('frequency', async (ctx) => {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Once a day', 'freq_daily')],
      [Markup.button.callback('Twice a week', 'freq_twice_weekly')],
      [Markup.button.callback('Once a week', 'freq_weekly')],
      [Markup.button.callback('Every two weeks', 'freq_biweekly')],
      [Markup.button.callback('Once a month', 'freq_monthly')],
    ]);

    await ctx.reply('How often would you like to receive sweet reminders?', keyboard);
  });

  // Handle frequency selection callbacks
  bot.action(/^freq_(.+)$/, async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const frequency = ctx.match[1] as Frequency;

    try {
      const user = await updateUserFrequency(telegramId, frequency);

      if (user) {
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          `Frequency updated to: ${FREQUENCY_LABELS[frequency]}\n\n` +
            `Your next reminder is scheduled for ${user.next_run_at?.toLocaleDateString()}.`
        );
      } else {
        await ctx.answerCbQuery('Please use /start first to register.');
      }
    } catch (error) {
      console.error('Error updating frequency:', error);
      await ctx.answerCbQuery('Something went wrong. Please try again.');
    }
  });

  // /pause command
  bot.command('pause', async (ctx) => {
    const telegramId = ctx.from.id.toString();

    try {
      const user = await pauseUser(telegramId);

      if (user) {
        await ctx.reply(
          `Reminders paused. Use /resume when you're ready to continue.`
        );
      } else {
        await ctx.reply('Please use /start first to register.');
      }
    } catch (error) {
      console.error('Error pausing:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /resume command
  bot.command('resume', async (ctx) => {
    const telegramId = ctx.from.id.toString();

    try {
      const user = await resumeUser(telegramId);

      if (user) {
        await ctx.reply(
          `Reminders resumed! You'll get your next reminder soon.\n\n` +
            `Frequency: ${FREQUENCY_LABELS[user.frequency]}`
        );
      } else {
        await ctx.reply('Please use /start first to register.');
      }
    } catch (error) {
      console.error('Error resuming:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /status command
  bot.command('status', async (ctx) => {
    const telegramId = ctx.from.id.toString();

    try {
      const user = await findUserByTelegramId(telegramId);

      if (user) {
        const nextRun = user.next_run_at
          ? user.next_run_at.toLocaleString()
          : 'Not scheduled';

        await ctx.reply(
          `Your Something Sweet Settings:\n\n` +
            `Frequency: ${FREQUENCY_LABELS[user.frequency]}\n` +
            `Status: ${user.is_paused ? 'Paused' : 'Active'}\n` +
            `Next reminder: ${user.is_paused ? 'Paused' : nextRun}\n` +
            `Member since: ${user.created_at.toLocaleDateString()}`
        );
      } else {
        await ctx.reply('You are not registered yet. Use /start to begin.');
      }
    } catch (error) {
      console.error('Error in /status:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /test command - send a random sweet idea immediately
  bot.command('test', async (ctx) => {
    const telegramId = ctx.from.id.toString();

    try {
      const user = await findUserByTelegramId(telegramId);

      if (user) {
        const idea = getRandomIdea();
        const message = formatMessage(idea);
        await ctx.reply(message, { parse_mode: 'HTML' });
      } else {
        await ctx.reply('Please use /start first to register.');
      }
    } catch (error) {
      console.error('Error in /test:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /help command
  bot.help(async (ctx) => {
    await ctx.reply(
      `Something Sweet - Relationship Reminder Bot\n\n` +
        `Commands:\n` +
        `/start - Register or see welcome message\n` +
        `/frequency - Change how often you get reminders\n` +
        `/pause - Temporarily stop reminders\n` +
        `/resume - Start getting reminders again\n` +
        `/status - Check your current settings\n` +
        `/test - Get a random sweet idea now\n` +
        `/help - Show this help message\n\n` +
        `I'll send you random ideas for sweet things to do for your partner!`
    );
  });

  // Handle unknown commands
  bot.on(message('text'), async (ctx) => {
    if (ctx.message.text.startsWith('/')) {
      await ctx.reply(
        `Unknown command. Use /help to see available commands.`
      );
    }
  });

  console.log('Telegram bot handlers configured');
}
