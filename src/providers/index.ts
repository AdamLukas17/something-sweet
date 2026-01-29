import { NotificationProvider, NotificationPayload } from '../types';

// Abstract notification service that can use multiple providers
export class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map();
  private defaultProvider: string | null = null;

  registerProvider(provider: NotificationProvider, isDefault = false): void {
    this.providers.set(provider.name, provider);
    if (isDefault || this.providers.size === 1) {
      this.defaultProvider = provider.name;
    }
    console.log(`Registered notification provider: ${provider.name}`);
  }

  async send(payload: NotificationPayload, providerName?: string): Promise<boolean> {
    const name = providerName ?? this.defaultProvider;
    if (!name) {
      throw new Error('No notification provider registered');
    }

    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider "${name}" not found`);
    }

    return provider.send(payload);
  }

  getProvider(name: string): NotificationProvider | undefined {
    return this.providers.get(name);
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
export const notificationService = new NotificationService();
