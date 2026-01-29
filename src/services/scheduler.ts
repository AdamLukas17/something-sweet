import { Frequency } from '../types';

// Calculate next notification time based on frequency
export function calculateNextRun(frequency: Frequency): Date {
  const now = new Date();
  const next = new Date(now);

  // Add randomness to spread out notifications
  // Random time between 8 AM and 8 PM
  const randomHour = Math.floor(Math.random() * 12) + 8;
  const randomMinute = Math.floor(Math.random() * 60);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'twice_weekly':
      // Random interval of 3-4 days to average ~2x per week
      next.setDate(next.getDate() + Math.floor(Math.random() * 2) + 3);
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

// Get a human-readable description of when the next run will be
export function describeNextRun(nextRun: Date): string {
  const now = new Date();
  const diffMs = nextRun.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'later today';
  } else if (diffDays === 1) {
    return 'tomorrow';
  } else if (diffDays < 7) {
    return `in ${diffDays} days`;
  } else if (diffDays < 14) {
    return 'next week';
  } else if (diffDays < 30) {
    return `in ${Math.ceil(diffDays / 7)} weeks`;
  } else {
    return 'next month';
  }
}
