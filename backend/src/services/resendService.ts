import { Resend } from "resend";

/**
 * Resend Email Service
 * Professional email delivery service with better deliverability than SMTP
 * Documentation: https://resend.com/docs
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class ResendService {
  private resend: Resend | null = null;
  private defaultFrom: string;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.defaultFrom = process.env.EMAIL_FROM || "noreply@advanciapayledger.com";
    this.enabled = !!apiKey;

    if (apiKey) {
      this.resend = new Resend(apiKey);
      console.log("✅ Resend email service initialized");
    } else {
      console.warn("⚠️  RESEND_API_KEY not configured. Email features disabled.");
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    if (!this.resend || !this.enabled) {
      console.warn("Resend not configured, email not sent:", options.subject);
      return {
        success: false,
        error: "Resend email service not configured",
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });

      if (response.error) {
        console.error("Resend email error:", response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      console.log("✅ Email sent successfully:", response.data?.id);
      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<EmailResponse> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Advancia PayLedger! 🎉</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Thank you for joining Advancia PayLedger! We're excited to have you on board.</p>
              <p>Your account has been successfully created and you can now:</p>
              <ul>
                <li>Track your transactions in real-time</li>
                <li>Manage your digital wallet</li>
                <li>Earn rewards on transactions</li>
                <li>Access advanced analytics</li>
              </ul>
              <a href="https://www.advanciapayledger.com/dashboard" class="button">Go to Dashboard</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The Advancia PayLedger Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Advancia PayLedger. All rights reserved.</p>
              <p>This email was sent to ${to}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: "Welcome to Advancia PayLedger! 🎉",
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<EmailResponse> {
    const resetUrl = `https://www.advanciapayledger.com/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request 🔐</h1>
            </div>
            <div class="content">
              <p>We received a request to reset your password for your Advancia PayLedger account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
              </div>
              <p>Best regards,<br>The Advancia PayLedger Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Advancia PayLedger. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: "Reset Your Password - Advancia PayLedger",
      html,
    });
  }

  /**
   * Send transaction notification email
   */
  async sendTransactionEmail(
    to: string,
    transactionType: string,
    amount: number,
    currency: string
  ): Promise<EmailResponse> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .transaction-box { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Transaction Notification 💰</h1>
            </div>
            <div class="content">
              <p>A new transaction has been processed on your account.</p>
              <div class="transaction-box">
                <p><strong>Type:</strong> ${transactionType}</p>
                <div class="amount">${currency} ${amount.toFixed(2)}</div>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>You can view the full details in your dashboard.</p>
              <a href="https://www.advanciapayledger.com/transactions" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Transactions</a>
              <p>Best regards,<br>The Advancia PayLedger Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Advancia PayLedger. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Transaction Notification - ${currency} ${amount.toFixed(2)}`,
      html,
    });
  }

  /**
   * Check if Resend is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const resendService = new ResendService();
export default resendService;
