import { NotificationProvider, NotificationPayload } from '../types';

// Placeholder for WhatsApp provider (premium tier)
// Implement using Twilio or Meta Business API

export class WhatsAppProvider implements NotificationProvider {
  name = 'whatsapp';

  // TODO: Add WhatsApp API credentials
  // private accountSid: string;
  // private authToken: string;
  // private fromNumber: string;

  constructor() {
    // Constructor for future WhatsApp API setup
    console.log('WhatsApp provider initialized (placeholder)');
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    // TODO: Implement WhatsApp sending via Twilio/Meta API
    //
    // Example Twilio implementation:
    // const client = twilio(this.accountSid, this.authToken);
    // await client.messages.create({
    //   body: payload.message,
    //   from: `whatsapp:${this.fromNumber}`,
    //   to: `whatsapp:${payload.chatId}`,
    // });

    console.log(`[WhatsApp Placeholder] Would send to ${payload.chatId}: ${payload.message}`);
    throw new Error('WhatsApp provider not yet implemented. Coming soon in premium tier!');
  }
}
