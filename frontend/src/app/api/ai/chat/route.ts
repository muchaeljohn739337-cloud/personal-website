import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  message: string;
  sessionId: string;
  history?: ChatMessage[];
}

// AI-powered response generator with financial domain knowledge
function generateAIResponse(message: string, history: ChatMessage[]): string {
  const lowerMessage = message.toLowerCase();

  // Context-aware responses based on financial domain

  // Balance and Account Inquiries
  if (lowerMessage.includes("balance") || lowerMessage.includes("account")) {
    const mockBalance = (Math.random() * 10000 + 1000).toFixed(2);
    return `📊 **Account Summary**

Your current account balance is **$${mockBalance}**.

**Recent Activity:**
• ✅ Deposit: +$500.00 (Dec 1, 2025)
• 💳 Purchase: -$45.99 (Nov 30, 2025)
• 💳 Purchase: -$129.00 (Nov 29, 2025)

Would you like me to:
1. Show more transaction details?
2. Download a statement?
3. Set up balance alerts?`;
  }

  // Refund Requests
  if (lowerMessage.includes("refund")) {
    return `🔄 **Refund Request Assistance**

I can help you with a refund request. Our 30-day money-back guarantee covers most transactions.

**To process your refund, I need:**
1. Transaction ID or date of purchase
2. Reason for the refund request
3. Your preferred refund method (original payment / account credit)

You can also submit a refund request directly through:
**Dashboard → Settings → Refund Requests**

Would you like me to guide you through the refund process step by step?`;
  }

  // Security and 2FA
  if (
    lowerMessage.includes("security") ||
    lowerMessage.includes("2fa") ||
    lowerMessage.includes("password")
  ) {
    return `🔐 **Security Assistance**

I can help you with the following security features:

**Two-Factor Authentication (2FA):**
• Currently: ${Math.random() > 0.5 ? "✅ Enabled" : "⚠️ Not enabled"}
• To enable: Go to **Settings → Security → Enable 2FA**

**Password Security:**
• Last changed: 45 days ago
• Recommendation: Update every 90 days

**Recent Security Events:**
• No suspicious activity detected
• Last login: Today from your usual location

**Need to:**
1. Enable/disable 2FA?
2. Reset your password?
3. Review login history?
4. Report suspicious activity?

Let me know how I can help!`;
  }

  // Transaction Issues
  if (
    lowerMessage.includes("transaction") ||
    lowerMessage.includes("payment") ||
    lowerMessage.includes("charge")
  ) {
    return `💳 **Transaction Support**

I can help you with transaction-related questions.

**What would you like help with?**
1. **Dispute a charge** - If you don't recognize a transaction
2. **Track a payment** - Check the status of a pending transfer
3. **Transaction history** - View or export your transactions
4. **Failed payment** - Troubleshoot payment issues

Please provide the transaction ID or date, and I'll look into it for you.

💡 **Tip:** You can find transaction IDs in your **Dashboard → Transactions** section.`;
  }

  // Fraud or Suspicious Activity
  if (
    lowerMessage.includes("fraud") ||
    lowerMessage.includes("suspicious") ||
    lowerMessage.includes("stolen")
  ) {
    return `🚨 **Fraud Alert Assistance**

I'm taking this seriously. Here's what we'll do:

**Immediate Actions:**
1. ✅ Your account is being monitored for unusual activity
2. 🔒 I recommend temporarily freezing your card

**Please confirm:**
• When did you notice the suspicious activity?
• Which transaction(s) are concerning?
• Have you shared your credentials with anyone?

**If your card is stolen:**
→ I can immediately block it and issue a replacement

**Emergency Contact:**
For urgent fraud concerns, call our 24/7 hotline: **1-800-SECURE**

Would you like me to freeze your account temporarily while we investigate?`;
  }

  // Crypto/ETH related
  if (
    lowerMessage.includes("crypto") ||
    lowerMessage.includes("eth") ||
    lowerMessage.includes("bitcoin") ||
    lowerMessage.includes("withdraw")
  ) {
    return `₿ **Cryptocurrency Support**

I can help with crypto-related questions.

**Your Crypto Holdings:**
• ETH: View in **Dashboard → Crypto**
• Recent prices are updated in real-time

**Common Actions:**
1. **Buy Crypto** - Purchase ETH, BTC, and more
2. **Withdraw** - Transfer to external wallet
3. **Deposit** - Add crypto from external source
4. **Transaction History** - View all crypto transactions

**Important Notes:**
• Withdrawals require 2FA confirmation
• Network fees vary based on blockchain congestion
• Minimum withdrawal: 0.01 ETH

What would you like to do?`;
  }

  // Subscription/Plan
  if (
    lowerMessage.includes("subscription") ||
    lowerMessage.includes("plan") ||
    lowerMessage.includes("upgrade") ||
    lowerMessage.includes("pricing")
  ) {
    return `💎 **Subscription & Plans**

**Your Current Plan:** Premium
**Billing Cycle:** Monthly ($29.99/month)
**Next Billing Date:** December 15, 2025

**Available Plans:**
| Plan | Price | Features |
|------|-------|----------|
| Basic | $9.99/mo | Core features |
| Premium | $29.99/mo | All features + Priority support |
| Enterprise | Custom | Dedicated account manager |

**Would you like to:**
1. Upgrade or downgrade your plan?
2. Cancel subscription?
3. View billing history?
4. Update payment method?`;
  }

  // Greeting
  if (
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi") ||
    lowerMessage.includes("hey")
  ) {
    return `👋 Hello! Great to hear from you!

I'm your AI-powered financial assistant. I can help you with:

• 💰 Account balances and transactions
• 🔄 Refund requests
• 🔐 Security and 2FA setup
• 💳 Payment issues
• ₿ Cryptocurrency questions
• 📊 Financial insights

What can I help you with today?`;
  }

  // Thank you
  if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
    return `You're welcome! 😊

Is there anything else I can help you with? I'm here 24/7 to assist with:
• Account questions
• Transactions
• Security settings
• And more!

Have a great day! 🌟`;
  }

  // Default response for unrecognized queries
  return `I understand you're asking about: "${message}"

Let me help you with that. Here are some ways I can assist:

**Common Topics:**
• 💰 **Account & Balance** - "What's my balance?"
• 🔄 **Refunds** - "I need a refund"
• 🔐 **Security** - "Help with 2FA"
• 💳 **Transactions** - "Check my payments"
• ₿ **Crypto** - "ETH withdrawal help"

**Can't find what you need?**
Our human support team is available:
• 📧 Email: support@advanciapayledger.com
• 📞 Phone: 1-800-ADVANCIA
• 💬 Live Chat: Available 9am-6pm EST

Please try rephrasing your question, or let me know which topic above matches your needs!`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, sessionId, history = [] } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "Message and sessionId are required" },
        { status: 400 },
      );
    }

    // Simulate AI processing delay (would be real API call in production)
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000),
    );

    // In production, this would call OpenAI/Claude API:
    // const openaiResponse = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [
    //     { role: "system", content: "You are a helpful financial assistant..." },
    //     ...history,
    //     { role: "user", content: message }
    //   ]
    // });

    const response = generateAIResponse(message, history);

    // Log for analytics (in production, store in database)
    console.log(
      `[AI Chat] Session: ${sessionId}, Query: "${message.slice(0, 50)}..."`,
    );

    return NextResponse.json({
      response,
      sessionId,
      timestamp: new Date().toISOString(),
      tokens: {
        prompt: message.length,
        completion: response.length,
        total: message.length + response.length,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "online",
    model: "financial-assistant-v1",
    capabilities: [
      "account-inquiries",
      "refund-requests",
      "security-assistance",
      "transaction-support",
      "crypto-support",
      "subscription-management",
    ],
  });
}
