import { Telegraf } from 'telegraf';
import { NotificationProvider, NotificationPayload } from '../types';

export class TelegramProvider implements NotificationProvider {
  name = 'telegram';
  private bot: Telegraf;

  constructor(bot: Telegraf) {
    this.bot = bot;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(payload.chatId, payload.message, {
        parse_mode: 'HTML',
      });
      return true;
    } catch (error) {
      console.error(`Failed to send Telegram message to ${payload.chatId}:`, error);
      return false;
    }
  }
}
