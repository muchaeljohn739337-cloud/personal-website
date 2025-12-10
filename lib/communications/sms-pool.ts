// SMS Pool Integration for Business Communications
// Handles virtual numbers, SMS, and call routing to AI agents

interface SMSPoolConfig {
  apiKey: string;
  baseUrl: string;
  webhookUrl: string;
}

interface VirtualNumber {
  id: string;
  number: string;
  country: string;
  type: 'sms' | 'voice' | 'both';
  status: 'active' | 'expired' | 'pending';
  expiresAt: Date;
  assignedTo?: string;
}

interface IncomingMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  receivedAt: Date;
  type: 'sms' | 'call';
  status: 'pending' | 'processed' | 'failed';
  aiResponse?: string;
}

interface CallSession {
  id: string;
  from: string;
  to: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  status: 'ringing' | 'answered' | 'ended' | 'missed' | 'voicemail';
  recording?: string;
  transcript?: string;
  aiHandled: boolean;
  agentType?: string;
}

// In-memory state (in production, use database)
const activeNumbers: Map<string, VirtualNumber> = new Map();
const messageHistory: IncomingMessage[] = [];
const callHistory: CallSession[] = [];
let aiAnsweringEnabled = true;
let businessHoursOnly = false;

class SMSPoolClient {
  private config: SMSPoolConfig;

  constructor() {
    this.config = {
      apiKey: process.env.SMSPOOL_API_KEY || '',
      baseUrl: 'https://api.smspool.net',
      webhookUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/communications/webhook',
    };
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Get available countries for numbers
   */
  async getCountries(): Promise<Array<{ code: string; name: string; price: number }>> {
    if (!this.isConfigured()) {
      return [
        { code: 'US', name: 'United States', price: 0.5 },
        { code: 'UK', name: 'United Kingdom', price: 0.6 },
        { code: 'CA', name: 'Canada', price: 0.5 },
      ];
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/country/retrieve_all`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return await response.json();
    } catch (error) {
      console.error('[SMSPool] Failed to get countries:', error);
      return [];
    }
  }

  /**
   * Rent a virtual number
   */
  async rentNumber(
    country: string,
    type: 'sms' | 'voice' | 'both' = 'both'
  ): Promise<VirtualNumber | null> {
    const id = `num_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!this.isConfigured()) {
      // Mock number for testing
      const mockNumber: VirtualNumber = {
        id,
        number: `+1555${Math.floor(Math.random() * 9000000 + 1000000)}`,
        country,
        type,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
      activeNumbers.set(id, mockNumber);
      return mockNumber;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/purchase/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ country, service: 'any' }),
      });

      const data = await response.json();

      if (data.success) {
        const number: VirtualNumber = {
          id: data.order_id,
          number: data.phonenumber,
          country,
          type,
          status: 'active',
          expiresAt: new Date(Date.now() + data.expires_in * 1000),
        };
        activeNumbers.set(number.id, number);
        return number;
      }

      return null;
    } catch (error) {
      console.error('[SMSPool] Failed to rent number:', error);
      return null;
    }
  }

  /**
   * Get all active numbers
   */
  getActiveNumbers(): VirtualNumber[] {
    return Array.from(activeNumbers.values()).filter((n) => n.status === 'active');
  }

  /**
   * Release a number
   */
  async releaseNumber(numberId: string): Promise<boolean> {
    const number = activeNumbers.get(numberId);
    if (number) {
      number.status = 'expired';
      activeNumbers.delete(numberId);
      return true;
    }
    return false;
  }

  /**
   * Process incoming SMS
   */
  async processIncomingSMS(from: string, to: string, body: string): Promise<string> {
    const message: IncomingMessage = {
      id: `msg_${Date.now()}`,
      from,
      to,
      body,
      receivedAt: new Date(),
      type: 'sms',
      status: 'pending',
    };

    messageHistory.push(message);

    if (!aiAnsweringEnabled) {
      message.status = 'processed';
      message.aiResponse =
        'AI answering is currently disabled. A representative will contact you soon.';
      return message.aiResponse;
    }

    // Generate AI response
    try {
      const aiResponse = await this.generateAIResponse(body, 'sms');
      message.aiResponse = aiResponse;
      message.status = 'processed';
      return aiResponse;
    } catch (error) {
      message.status = 'failed';
      return 'Thank you for your message. We will get back to you shortly.';
    }
  }

  /**
   * Process incoming call
   */
  async processIncomingCall(from: string, to: string): Promise<CallSession> {
    const session: CallSession = {
      id: `call_${Date.now()}`,
      from,
      to,
      startedAt: new Date(),
      status: 'ringing',
      aiHandled: aiAnsweringEnabled,
    };

    callHistory.push(session);

    if (!aiAnsweringEnabled) {
      session.status = 'voicemail';
      return session;
    }

    // Check business hours if enabled
    if (businessHoursOnly && !this.isBusinessHours()) {
      session.status = 'voicemail';
      session.aiHandled = false;
      return session;
    }

    session.status = 'answered';
    session.agentType = 'business'; // Use business agent for calls

    return session;
  }

  /**
   * End a call session
   */
  endCall(callId: string, transcript?: string): CallSession | null {
    const session = callHistory.find((c) => c.id === callId);
    if (session) {
      session.endedAt = new Date();
      session.duration = Math.floor(
        (session.endedAt.getTime() - session.startedAt.getTime()) / 1000
      );
      session.status = 'ended';
      if (transcript) session.transcript = transcript;
    }
    return session || null;
  }

  /**
   * Generate AI response for messages/calls
   */
  private async generateAIResponse(input: string, type: 'sms' | 'call'): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return this.getDefaultResponse(type);
    }

    try {
      const systemPrompt =
        type === 'sms'
          ? `You are a professional business assistant responding to SMS messages. 
             Be concise, helpful, and professional. Keep responses under 160 characters when possible.
             Company: Advancia PayLedger - Digital Payment Solutions`
          : `You are a professional AI receptionist for Advancia PayLedger.
             Be warm, professional, and helpful. Guide callers to the right department.
             Available departments: Sales, Support, Billing, General Inquiries`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: type === 'sms' ? 200 : 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: input }],
        }),
      });

      const data = await response.json();
      return data.content?.[0]?.text || this.getDefaultResponse(type);
    } catch (error) {
      console.error('[SMSPool] AI response error:', error);
      return this.getDefaultResponse(type);
    }
  }

  /**
   * Default responses when AI is unavailable
   */
  private getDefaultResponse(type: 'sms' | 'call'): string {
    if (type === 'sms') {
      return 'Thank you for contacting Advancia PayLedger. A team member will respond shortly.';
    }
    return 'Thank you for calling Advancia PayLedger. Please hold while we connect you.';
  }

  /**
   * Check if current time is within business hours
   */
  private isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Monday-Friday, 9 AM - 6 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }

  /**
   * Get message history
   */
  getMessageHistory(limit = 50): IncomingMessage[] {
    return messageHistory.slice(-limit).reverse();
  }

  /**
   * Get call history
   */
  getCallHistory(limit = 50): CallSession[] {
    return callHistory.slice(-limit).reverse();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalCalls: number;
    totalMessages: number;
    aiHandledCalls: number;
    aiHandledMessages: number;
    avgCallDuration: number;
    activeNumbers: number;
  } {
    const aiCalls = callHistory.filter((c) => c.aiHandled).length;
    const aiMessages = messageHistory.filter((m) => m.aiResponse).length;
    const completedCalls = callHistory.filter((c) => c.duration);
    const avgDuration =
      completedCalls.length > 0
        ? completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls.length
        : 0;

    return {
      totalCalls: callHistory.length,
      totalMessages: messageHistory.length,
      aiHandledCalls: aiCalls,
      aiHandledMessages: aiMessages,
      avgCallDuration: Math.round(avgDuration),
      activeNumbers: this.getActiveNumbers().length,
    };
  }
}

// Singleton instance
let smsPoolInstance: SMSPoolClient | null = null;

export function getSMSPool(): SMSPoolClient {
  if (!smsPoolInstance) {
    smsPoolInstance = new SMSPoolClient();
  }
  return smsPoolInstance;
}

// Admin control functions
export function setAIAnsweringEnabled(enabled: boolean): void {
  aiAnsweringEnabled = enabled;
  console.log(`[SMSPool] AI answering ${enabled ? 'enabled' : 'disabled'}`);
}

export function getAIAnsweringEnabled(): boolean {
  return aiAnsweringEnabled;
}

export function setBusinessHoursOnly(enabled: boolean): void {
  businessHoursOnly = enabled;
  console.log(`[SMSPool] Business hours only ${enabled ? 'enabled' : 'disabled'}`);
}

export function getBusinessHoursOnly(): boolean {
  return businessHoursOnly;
}

// Export types
export type { VirtualNumber, IncomingMessage, CallSession };
