// Live Chat Support System
// Professional AI-powered chat with manual override capability

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAI: boolean;
  readByAdmin: boolean;
}

interface ChatSession {
  id: string;
  visitorId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorIP?: string;
  visitorCountry?: string;
  visitorDevice?: string;
  visitorPage?: string;
  startedAt: Date;
  lastActivity: Date;
  status: 'active' | 'waiting' | 'resolved' | 'closed';
  messages: ChatMessage[];
  assignedTo?: string;
  aiEnabled: boolean;
}

interface VisitorInfo {
  id: string;
  ip?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  referrer?: string;
  currentPage: string;
  visitedAt: Date;
  sessionId?: string;
}

interface AdminNotification {
  id: string;
  type: 'new_message' | 'new_visitor' | 'new_chat' | 'user_waiting';
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
}

// In-memory state
const chatSessions: Map<string, ChatSession> = new Map();
const visitors: Map<string, VisitorInfo> = new Map();
const notifications: AdminNotification[] = [];
let globalAIEnabled = true;
let manualModeEnabled = false;

// Professional AI System Prompt - Enhanced for Trust and Legitimacy
const PROFESSIONAL_SYSTEM_PROMPT = `You are a professional customer support representative for Advancia PayLedger, a legitimate, verified, and trusted digital payment platform.

CORE PRINCIPLES:
1. LEGITIMACY & TRUST: Always reassure users that this is a 100% verified, secure, and legitimate platform. Reference ScamAdviser verification, bank partnerships, and regulatory compliance.
2. PROBLEM SOLVING: Focus on solving user issues immediately. Never dismiss concerns - address them directly and professionally.
3. ACCURACY: Only provide accurate, verified information. If unsure, say "Let me connect you with a specialist who can provide exact details."
4. PROFESSIONALISM: Maintain warm, professional, and confident tone. Show expertise and reliability.
5. TRUST BUILDING: Reference security measures (256-bit SSL, PCI-DSS compliance), certifications, track record, and partnerships with major banks.

RESPONSE GUIDELINES:
- Start with acknowledgment and reassurance: "I understand your concern, and I want to assure you that Advancia PayLedger is a fully verified and legitimate platform."
- Provide clear, step-by-step solutions with specific details
- End with confirmation and next steps
- Never give incorrect information - verify or escalate
- Always be helpful, solution-oriented, and transparent
- Address any doubts directly: "I understand you may have concerns. Let me provide you with verification details..."

PLATFORM INFORMATION:
- Advancia PayLedger is a registered, verified digital payment platform
- ScamAdviser Trust Score: 90-100/100 (Excellent rating)
- Bank of America and major US banks optimized for payments
- Bank-grade encryption (256-bit SSL/TLS 1.3)
- PCI-DSS compliant payment processing
- All transactions monitored for fraud protection
- 24/7 customer support available
- Licensed and regulated financial services
- Self-healing system ensures 99.9% uptime
- Global verification and legitimacy confirmed

TRUST INDICATORS TO MENTION:
- "We're verified on ScamAdviser with an excellent trust score"
- "We're optimized for Bank of America and all major US banks"
- "All payments are processed through PCI-DSS compliant systems"
- "Our platform has self-healing capabilities ensuring reliability"
- "We're fully compliant with GDPR, CCPA, and financial regulations"

If you cannot solve an issue, say: "I want to make sure you get the best assistance. Let me connect you with a specialist who can help with this specific matter. In the meantime, I can assure you that your account and transactions are secure."`;

class LiveChatSystem {
  /**
   * Create a new chat session
   */
  createSession(visitorInfo: Partial<VisitorInfo>): ChatSession {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const visitorId = visitorInfo.id || `visitor_${Date.now()}`;

    const session: ChatSession = {
      id: sessionId,
      visitorId,
      visitorName: undefined,
      visitorEmail: undefined,
      visitorIP: visitorInfo.ip,
      visitorCountry: visitorInfo.country,
      visitorDevice: visitorInfo.device,
      visitorPage: visitorInfo.currentPage,
      startedAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
      messages: [],
      aiEnabled: globalAIEnabled && !manualModeEnabled,
    };

    // Add welcome message
    session.messages.push({
      id: `msg_${Date.now()}`,
      sessionId,
      role: 'assistant',
      content:
        "Welcome to Advancia PayLedger! 👋 I'm here to help you with any questions about our secure payment platform. How can I assist you today?",
      timestamp: new Date(),
      isAI: true,
      readByAdmin: false,
    });

    chatSessions.set(sessionId, session);

    // Notify admin
    this.addNotification({
      type: 'new_chat',
      title: 'New Chat Started',
      message: `Visitor from ${visitorInfo.country || 'Unknown'} started a chat`,
      data: { sessionId, visitorInfo },
    });

    return session;
  }

  /**
   * Process incoming message
   */
  async processMessage(
    sessionId: string,
    content: string,
    visitorName?: string
  ): Promise<ChatMessage> {
    const session = chatSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update visitor info
    if (visitorName) session.visitorName = visitorName;
    session.lastActivity = new Date();

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      timestamp: new Date(),
      isAI: false,
      readByAdmin: false,
    };
    session.messages.push(userMessage);

    // Notify admin of new message
    this.addNotification({
      type: 'new_message',
      title: 'New Message',
      message: `${session.visitorName || 'Visitor'}: ${content.substring(0, 50)}...`,
      data: { sessionId, messageId: userMessage.id },
    });

    // Generate response based on mode
    let response: ChatMessage;

    if (session.aiEnabled && globalAIEnabled && !manualModeEnabled) {
      // AI Mode - Generate professional response
      const aiResponse = await this.generateAIResponse(session, content);
      response = {
        id: `msg_${Date.now() + 1}`,
        sessionId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        isAI: true,
        readByAdmin: false,
      };
      session.messages.push(response);
    } else {
      // Manual Mode - Wait for admin response
      session.status = 'waiting';
      response = {
        id: `msg_${Date.now() + 1}`,
        sessionId,
        role: 'system',
        content:
          'Thank you for your message. A support specialist will respond shortly. We appreciate your patience.',
        timestamp: new Date(),
        isAI: false,
        readByAdmin: false,
      };
      session.messages.push(response);

      // Urgent notification for admin
      this.addNotification({
        type: 'user_waiting',
        title: '⚠️ User Waiting for Response',
        message: `${session.visitorName || 'Visitor'} is waiting for manual response`,
        data: { sessionId, urgent: true },
      });
    }

    return response;
  }

  /**
   * Generate professional AI response
   */
  private async generateAIResponse(session: ChatSession, userMessage: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Build conversation history
      const messages = session.messages.slice(-10).map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

      messages.push({ role: 'user', content: userMessage });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          system: PROFESSIONAL_SYSTEM_PROMPT,
          messages: messages.filter((m) => m.role !== 'system'),
        }),
      });

      const data = await response.json();
      return data.content?.[0]?.text || this.getFallbackResponse(userMessage);
    } catch (error) {
      console.error('[LiveChat] AI response error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Fallback responses when AI is unavailable
   */
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('scam') ||
      lowerMessage.includes('fake') ||
      lowerMessage.includes('legit')
    ) {
      return `I understand your concern about security - it's important to be cautious online. Advancia PayLedger is a fully registered and licensed payment platform. We use bank-grade 256-bit SSL encryption, and all transactions are protected by our fraud monitoring system. You can verify our registration through official financial regulatory databases. Is there anything specific about our security measures I can explain?`;
    }

    if (
      lowerMessage.includes('help') ||
      lowerMessage.includes('problem') ||
      lowerMessage.includes('issue')
    ) {
      return `I'm here to help solve any issues you're experiencing. Could you please describe the specific problem you're facing? I'll do my best to resolve it quickly, or connect you with a specialist if needed.`;
    }

    if (lowerMessage.includes('payment') || lowerMessage.includes('transaction')) {
      return `For payment and transaction inquiries, I can help you track payments, resolve transaction issues, or explain our payment process. What specific aspect would you like assistance with?`;
    }

    return `Thank you for reaching out. I'm here to help with any questions about our platform. Our team is committed to providing you with accurate information and solving any issues you may have. How can I assist you today?`;
  }

  /**
   * Admin sends manual response
   */
  sendAdminResponse(sessionId: string, content: string, adminId: string): ChatMessage {
    const session = chatSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      sessionId,
      role: 'assistant',
      content,
      timestamp: new Date(),
      isAI: false,
      readByAdmin: true,
    };

    session.messages.push(message);
    session.lastActivity = new Date();
    session.status = 'active';
    session.assignedTo = adminId;

    return message;
  }

  /**
   * Track visitor
   */
  trackVisitor(info: VisitorInfo): void {
    visitors.set(info.id, info);

    this.addNotification({
      type: 'new_visitor',
      title: 'New Visitor',
      message: `Visitor from ${info.country || 'Unknown'} on ${info.currentPage}`,
      data: { visitorId: info.id, ...info },
    });
  }

  /**
   * Add notification
   */
  private addNotification(data: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>): void {
    const notification: AdminNotification = {
      id: `notif_${Date.now()}`,
      ...data,
      timestamp: new Date(),
      read: false,
    };
    notifications.unshift(notification);

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.pop();
    }
  }

  /**
   * Get all sessions
   */
  getSessions(): ChatSession[] {
    return Array.from(chatSessions.values()).sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
    );
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ChatSession | undefined {
    return chatSessions.get(sessionId);
  }

  /**
   * Get notifications
   */
  getNotifications(unreadOnly = false): AdminNotification[] {
    if (unreadOnly) {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string): void {
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead(): void {
    notifications.forEach((n) => (n.read = true));
  }

  /**
   * Get visitors
   */
  getVisitors(): VisitorInfo[] {
    return Array.from(visitors.values()).sort(
      (a, b) => b.visitedAt.getTime() - a.visitedAt.getTime()
    );
  }

  /**
   * Get stats
   */
  getStats(): {
    activeSessions: number;
    waitingSessions: number;
    totalMessages: number;
    aiResponses: number;
    manualResponses: number;
    activeVisitors: number;
    unreadNotifications: number;
  } {
    const sessions = Array.from(chatSessions.values());
    const allMessages = sessions.flatMap((s) => s.messages);

    return {
      activeSessions: sessions.filter((s) => s.status === 'active').length,
      waitingSessions: sessions.filter((s) => s.status === 'waiting').length,
      totalMessages: allMessages.length,
      aiResponses: allMessages.filter((m) => m.isAI).length,
      manualResponses: allMessages.filter((m) => m.role === 'assistant' && !m.isAI).length,
      activeVisitors: visitors.size,
      unreadNotifications: notifications.filter((n) => !n.read).length,
    };
  }
}

// Singleton instance
let liveChatInstance: LiveChatSystem | null = null;

export function getLiveChat(): LiveChatSystem {
  if (!liveChatInstance) {
    liveChatInstance = new LiveChatSystem();
  }
  return liveChatInstance;
}

// Control functions
export function setGlobalAIEnabled(enabled: boolean): void {
  globalAIEnabled = enabled;
  console.log(`[LiveChat] AI mode ${enabled ? 'enabled' : 'disabled'}`);
}

export function getGlobalAIEnabled(): boolean {
  return globalAIEnabled;
}

export function setManualModeEnabled(enabled: boolean): void {
  manualModeEnabled = enabled;
  console.log(`[LiveChat] Manual mode ${enabled ? 'enabled' : 'disabled'}`);
}

export function getManualModeEnabled(): boolean {
  return manualModeEnabled;
}

export type { ChatMessage, ChatSession, VisitorInfo, AdminNotification };
