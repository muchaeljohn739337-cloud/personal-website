// SMS Verification System
// Rent virtual numbers to receive verification codes from social media and apps

interface VerificationNumber {
  id: string;
  orderId: string;
  number: string;
  country: string;
  service: string;
  serviceName: string;
  status: 'waiting' | 'received' | 'expired' | 'cancelled';
  code?: string;
  message?: string;
  rentedAt: Date;
  expiresAt: Date;
  cost: number;
}

interface VerificationService {
  id: string;
  name: string;
  shortName: string;
  icon?: string;
  category: 'social' | 'messaging' | 'email' | 'finance' | 'shopping' | 'other';
}

// Popular services for verification
const VERIFICATION_SERVICES: VerificationService[] = [
  // Social Media
  { id: 'facebook', name: 'Facebook', shortName: 'FB', category: 'social' },
  { id: 'instagram', name: 'Instagram', shortName: 'IG', category: 'social' },
  { id: 'twitter', name: 'Twitter/X', shortName: 'TW', category: 'social' },
  { id: 'tiktok', name: 'TikTok', shortName: 'TT', category: 'social' },
  { id: 'snapchat', name: 'Snapchat', shortName: 'SC', category: 'social' },
  { id: 'linkedin', name: 'LinkedIn', shortName: 'LI', category: 'social' },
  { id: 'pinterest', name: 'Pinterest', shortName: 'PI', category: 'social' },
  { id: 'reddit', name: 'Reddit', shortName: 'RD', category: 'social' },
  { id: 'discord', name: 'Discord', shortName: 'DC', category: 'social' },
  { id: 'twitch', name: 'Twitch', shortName: 'TW', category: 'social' },

  // Messaging
  { id: 'whatsapp', name: 'WhatsApp', shortName: 'WA', category: 'messaging' },
  { id: 'telegram', name: 'Telegram', shortName: 'TG', category: 'messaging' },
  { id: 'signal', name: 'Signal', shortName: 'SG', category: 'messaging' },
  { id: 'viber', name: 'Viber', shortName: 'VB', category: 'messaging' },
  { id: 'wechat', name: 'WeChat', shortName: 'WC', category: 'messaging' },
  { id: 'line', name: 'LINE', shortName: 'LN', category: 'messaging' },

  // Email
  { id: 'google', name: 'Google/Gmail', shortName: 'GG', category: 'email' },
  { id: 'microsoft', name: 'Microsoft/Outlook', shortName: 'MS', category: 'email' },
  { id: 'yahoo', name: 'Yahoo', shortName: 'YH', category: 'email' },
  { id: 'protonmail', name: 'ProtonMail', shortName: 'PM', category: 'email' },

  // Finance
  { id: 'paypal', name: 'PayPal', shortName: 'PP', category: 'finance' },
  { id: 'cashapp', name: 'Cash App', shortName: 'CA', category: 'finance' },
  { id: 'venmo', name: 'Venmo', shortName: 'VM', category: 'finance' },
  { id: 'binance', name: 'Binance', shortName: 'BN', category: 'finance' },
  { id: 'coinbase', name: 'Coinbase', shortName: 'CB', category: 'finance' },
  { id: 'stripe', name: 'Stripe', shortName: 'ST', category: 'finance' },

  // Shopping
  { id: 'amazon', name: 'Amazon', shortName: 'AZ', category: 'shopping' },
  { id: 'ebay', name: 'eBay', shortName: 'EB', category: 'shopping' },
  { id: 'uber', name: 'Uber', shortName: 'UB', category: 'shopping' },
  { id: 'lyft', name: 'Lyft', shortName: 'LF', category: 'shopping' },
  { id: 'doordash', name: 'DoorDash', shortName: 'DD', category: 'shopping' },

  // Other
  { id: 'openai', name: 'OpenAI/ChatGPT', shortName: 'AI', category: 'other' },
  { id: 'spotify', name: 'Spotify', shortName: 'SP', category: 'other' },
  { id: 'netflix', name: 'Netflix', shortName: 'NF', category: 'other' },
  { id: 'tinder', name: 'Tinder', shortName: 'TD', category: 'other' },
  { id: 'bumble', name: 'Bumble', shortName: 'BM', category: 'other' },
  { id: 'any', name: 'Any Service', shortName: 'ANY', category: 'other' },
];

// Available countries
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
];

// In-memory storage
const activeVerifications: Map<string, VerificationNumber> = new Map();
const verificationHistory: VerificationNumber[] = [];

class SMSVerificationService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SMSPOOL_API_KEY || 'fS2pMx2K7kxv2gotVOMPwQZEK8K9D0UG';
    this.baseUrl = 'https://api.smspool.net';
  }

  /**
   * Get available services
   */
  getServices(category?: string): VerificationService[] {
    if (category) {
      return VERIFICATION_SERVICES.filter((s) => s.category === category);
    }
    return VERIFICATION_SERVICES;
  }

  /**
   * Get available countries
   */
  getCountries() {
    return COUNTRIES;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/request/balance?key=${this.apiKey}`);
      const data = await response.json();
      return {
        balance: parseFloat(data.balance) || 0,
        currency: 'USD',
      };
    } catch (error) {
      console.error('[SMSVerification] Balance error:', error);
      return { balance: 0, currency: 'USD' };
    }
  }

  /**
   * Get price for a service in a country
   */
  async getPrice(country: string, service: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/request/price?key=${this.apiKey}&country=${country}&service=${service}`
      );
      const data = await response.json();
      return parseFloat(data.price) || 0.5;
    } catch (error) {
      console.error('[SMSVerification] Price error:', error);
      return 0.5; // Default price
    }
  }

  /**
   * Rent a number for verification
   */
  async rentNumber(country: string, service: string): Promise<VerificationNumber | null> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          key: this.apiKey,
          country: country,
          service: service,
        }),
      });

      const data = await response.json();

      if (data.success === 1 || data.order_id) {
        const serviceDef = VERIFICATION_SERVICES.find((s) => s.id === service);
        const verification: VerificationNumber = {
          id: `ver_${Date.now()}`,
          orderId: data.order_id,
          number: data.phonenumber || data.number,
          country,
          service,
          serviceName: serviceDef?.name || service,
          status: 'waiting',
          rentedAt: new Date(),
          expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
          cost: parseFloat(data.cost) || 0.5,
        };

        activeVerifications.set(verification.id, verification);
        verificationHistory.push(verification);

        console.log(`[SMSVerification] Rented number: ${verification.number} for ${service}`);
        return verification;
      }

      console.error('[SMSVerification] Rent failed:', data);
      return null;
    } catch (error) {
      console.error('[SMSVerification] Rent error:', error);
      return null;
    }
  }

  /**
   * Check for received SMS code
   */
  async checkCode(verificationId: string): Promise<VerificationNumber | null> {
    const verification = activeVerifications.get(verificationId);
    if (!verification) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/request/sms?key=${this.apiKey}&orderid=${verification.orderId}`
      );
      const data = await response.json();

      if (data.status === 3 || data.sms) {
        // Code received
        verification.status = 'received';
        verification.message = data.sms || data.full_sms;
        verification.code = this.extractCode(verification.message);

        console.log(`[SMSVerification] Code received: ${verification.code}`);
        return verification;
      }

      if (data.status === 6) {
        // Expired
        verification.status = 'expired';
        activeVerifications.delete(verificationId);
      }

      return verification;
    } catch (error) {
      console.error('[SMSVerification] Check error:', error);
      return verification;
    }
  }

  /**
   * Extract verification code from SMS message
   */
  private extractCode(message?: string): string | undefined {
    if (!message) return undefined;

    // Common patterns for verification codes
    const patterns = [
      /\b(\d{6})\b/, // 6 digits
      /\b(\d{5})\b/, // 5 digits
      /\b(\d{4})\b/, // 4 digits
      /code[:\s]*(\d{4,6})/i,
      /verification[:\s]*(\d{4,6})/i,
      /OTP[:\s]*(\d{4,6})/i,
      /PIN[:\s]*(\d{4,6})/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Cancel a verification
   */
  async cancelVerification(verificationId: string): Promise<boolean> {
    const verification = activeVerifications.get(verificationId);
    if (!verification) return false;

    try {
      await fetch(`${this.baseUrl}/request/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          key: this.apiKey,
          orderid: verification.orderId,
        }),
      });

      verification.status = 'cancelled';
      activeVerifications.delete(verificationId);
      return true;
    } catch (error) {
      console.error('[SMSVerification] Cancel error:', error);
      return false;
    }
  }

  /**
   * Resend/request new SMS
   */
  async resendSMS(verificationId: string): Promise<boolean> {
    const verification = activeVerifications.get(verificationId);
    if (!verification) return false;

    try {
      await fetch(`${this.baseUrl}/request/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          key: this.apiKey,
          orderid: verification.orderId,
        }),
      });
      return true;
    } catch (error) {
      console.error('[SMSVerification] Resend error:', error);
      return false;
    }
  }

  /**
   * Get active verifications
   */
  getActiveVerifications(): VerificationNumber[] {
    // Clean up expired
    const now = Date.now();
    for (const [id, ver] of activeVerifications) {
      if (ver.expiresAt.getTime() < now && ver.status === 'waiting') {
        ver.status = 'expired';
        activeVerifications.delete(id);
      }
    }

    return Array.from(activeVerifications.values());
  }

  /**
   * Get verification history
   */
  getHistory(limit = 50): VerificationNumber[] {
    return verificationHistory.slice(-limit).reverse();
  }

  /**
   * Get stats
   */
  getStats(): {
    active: number;
    received: number;
    expired: number;
    cancelled: number;
    totalSpent: number;
  } {
    const stats = {
      active: 0,
      received: 0,
      expired: 0,
      cancelled: 0,
      totalSpent: 0,
    };

    for (const ver of verificationHistory) {
      stats.totalSpent += ver.cost;
      switch (ver.status) {
        case 'waiting':
          stats.active++;
          break;
        case 'received':
          stats.received++;
          break;
        case 'expired':
          stats.expired++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }
}

// Singleton
let verificationInstance: SMSVerificationService | null = null;

export function getSMSVerification(): SMSVerificationService {
  if (!verificationInstance) {
    verificationInstance = new SMSVerificationService();
  }
  return verificationInstance;
}

export { VERIFICATION_SERVICES, COUNTRIES };
export type { VerificationNumber, VerificationService };
