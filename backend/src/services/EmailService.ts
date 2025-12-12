import sgMail from "@sendgrid/mail";
import nodemailer, { Transporter } from "nodemailer";
import prisma from "../prismaClient";

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailOptions {
  to: string | string[];
  template: string;
  data: Record<string, any>;
  from?: string;
  replyTo?: string;
}

/**
 * EmailService - Unified email sending service
 * Primary: SendGrid for production transactional emails
 * Fallback: Nodemailer for development/SMTP
 */
export class EmailService {
  private static instance: EmailService;
  private sgConfigured: boolean = false;
  private smtpClient: Transporter | null = null;
  private defaultFrom: string = process.env.EMAIL_FROM || "noreply@saas-platform.com";

  private constructor() {
    this.initializeSendGrid();
    this.initializeNodemailer();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize SendGrid (primary email service)
   */
  private initializeSendGrid(): void {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (apiKey && apiKey.length > 0) {
      try {
        sgMail.setApiKey(apiKey);
        this.sgConfigured = true;
        console.log("[EmailService] ✅ SendGrid configured");
      } catch (error) {
        console.error("[EmailService] ❌ SendGrid configuration failed:", error);
        this.sgConfigured = false;
      }
    } else {
      console.warn("[EmailService] ⚠️  SendGrid API key not found, using fallback");
      this.sgConfigured = false;
    }
  }

  /**
   * Initialize Nodemailer (fallback SMTP service)
   */
  private initializeNodemailer(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        this.smtpClient = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        console.log("[EmailService] ✅ Nodemailer (SMTP) configured");
      } catch (error) {
        console.error("[EmailService] ❌ Nodemailer configuration failed:", error);
        this.smtpClient = null;
      }
    } else {
      console.warn("[EmailService] ⚠️  SMTP credentials not found, fallback unavailable");
    }
  }

  /**
   * Load email template from database or filesystem
   */
  private async loadTemplate(templateName: string, data: Record<string, any>): Promise<EmailTemplate> {
    // Try to load from templates directory
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.html`);

      let html = await fs.readFile(templatePath, "utf-8");

      // Replace template variables {{variable}}
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, String(data[key]));
      });

      // Extract subject from template (look for <!-- SUBJECT: ... --> comment)
      const subjectMatch = html.match(/<!--\s*SUBJECT:\s*(.+?)\s*-->/i);
      const subject = subjectMatch ? subjectMatch[1] : "Notification";

      // Generate plain text version (strip HTML tags)
      const text = html
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      return { subject, html, text };
    } catch (error) {
      console.error(`[EmailService] Failed to load template ${templateName}:`, error);
      throw new Error(`Email template '${templateName}' not found`);
    }
  }

  /**
   * Send email using SendGrid (primary method)
   */
  private async sendViaSendGrid(options: EmailOptions, template: EmailTemplate): Promise<boolean> {
    if (!this.sgConfigured) {
      throw new Error("SendGrid not configured");
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      await sgMail.send({
        to: recipients,
        from: options.from || this.defaultFrom,
        replyTo: options.replyTo,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[EmailService] ✅ Email sent via SendGrid to ${recipients.join(", ")}`);
      return true;
    } catch (error: any) {
      console.error("[EmailService] SendGrid error:", error.response?.body || error.message);
      throw error;
    }
  }

  /**
   * Send email using Nodemailer (fallback method)
   */
  private async sendViaNodemailer(options: EmailOptions, template: EmailTemplate): Promise<boolean> {
    if (!this.smtpClient) {
      throw new Error("Nodemailer not configured");
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;

      const info = await this.smtpClient.sendMail({
        from: options.from || this.defaultFrom,
        to: recipients,
        replyTo: options.replyTo,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[EmailService] ✅ Email sent via Nodemailer: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error("[EmailService] Nodemailer error:", error.message);
      throw error;
    }
  }

  /**
   * Send email with automatic fallback
   * Tries SendGrid first, falls back to Nodemailer on failure
   */
  public async send(options: EmailOptions): Promise<boolean> {
    try {
      // Load and render template
      const template = await this.loadTemplate(options.template, options.data);

      // Try SendGrid first (production)
      if (this.sgConfigured) {
        try {
          return await this.sendViaSendGrid(options, template);
        } catch (sgError) {
          console.warn("[EmailService] SendGrid failed, trying fallback...");

          // Fallback to Nodemailer if SendGrid fails
          if (this.smtpClient) {
            return await this.sendViaNodemailer(options, template);
          }
          throw sgError;
        }
      }

      // Use Nodemailer if SendGrid not configured
      if (this.smtpClient) {
        return await this.sendViaNodemailer(options, template);
      }

      // No email service available
      console.error("[EmailService] ❌ No email service configured");

      // In development, log email instead of failing
      if (process.env.NODE_ENV === "development") {
        console.log("[EmailService] 📧 [DEV MODE] Email would be sent:");
        console.log(`To: ${options.to}`);
        console.log(`Template: ${options.template}`);
        console.log(`Subject: ${template.subject}`);
        console.log("---");
        return true; // Simulate success in dev mode
      }

      throw new Error("No email service available");
    } catch (error) {
      console.error("[EmailService] ❌ Failed to send email:", error);

      // Log failed email to database for retry
      try {
        await this.logFailedEmail(options, error);
      } catch (logError) {
        console.error("[EmailService] Failed to log email error:", logError);
      }

      throw error;
    }
  }

  /**
   * Log failed email attempts to database for manual review/retry
   */
  private async logFailedEmail(options: EmailOptions, error: any): Promise<void> {
    try {
      // Store in audit_logs for tracking
      await prisma.audit_logs.create({
        data: {
          action: "EMAIL_SEND_FAILED",
          userId: null,
          resourceType: "EMAIL",
          resourceId: options.template,
          changes: JSON.stringify(options),
          metadata: JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString(),
          }),
          ip_address: "127.0.0.1",
          user_agent: "EmailService",
        },
      });
    } catch (dbError) {
      // Silent fail - don't throw on logging errors
      console.error("[EmailService] Failed to log to database:", dbError);
    }
  }

  /**
   * Convenience methods for common email types
   */

  public async sendWelcomeEmail(to: string, data: { name: string; verificationUrl: string }): Promise<boolean> {
    return this.send({
      to,
      template: "welcome",
      data,
    });
  }

  public async sendVerificationEmail(
    to: string,
    data: { name: string; verificationUrl: string; expiresIn: string }
  ): Promise<boolean> {
    return this.send({
      to,
      template: "verify",
      data,
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    data: { name: string; resetUrl: string; expiresIn: string }
  ): Promise<boolean> {
    return this.send({
      to,
      template: "reset-password",
      data,
    });
  }

  public async sendTransactionNotification(
    to: string,
    data: {
      name: string;
      transactionType: string;
      amount: string;
      currency: string;
      date: string;
      status: string;
    }
  ): Promise<boolean> {
    return this.send({
      to,
      template: "transaction-notification",
      data,
    });
  }

  /**
   * Test email configuration
   */
  public async testConfiguration(): Promise<{ sendgrid: boolean; smtp: boolean }> {
    return {
      sendgrid: this.sgConfigured,
      smtp: this.smtpClient !== null,
    };
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
