export type Frequency = 'daily' | 'twice_weekly' | 'weekly' | 'biweekly' | 'monthly';

export interface User {
  id: number;
  telegram_id: string;
  chat_id: string;
  frequency: Frequency;
  next_run_at: Date | null;
  is_paused: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SweetIdea {
  id: number;
  title: string;
  description: string;
  category: string;
}

export interface NotificationPayload {
  userId: string;
  chatId: string;
  message: string;
}

export interface NotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<boolean>;
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Once a day',
  twice_weekly: 'Twice a week',
  weekly: 'Once a week',
  biweekly: 'Every two weeks',
  monthly: 'Once a month',
};
