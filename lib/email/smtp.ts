/**
 * SMTP Email Service
 * Sends emails using SMTP (e.g., Resend SMTP)
 * Documentation: https://resend.com/docs/send-with-smtp
 */

import nodemailer from 'nodemailer';
import { prisma } from '../prismaClient';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || process.env.RESEND_API_KEY; // Use Resend API key if SMTP_PASSWORD not set
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@example.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Personal Website';

// Initialize SMTP transporter
let smtpTransporter: nodemailer.Transporter | null = null;

/**
 * Initialize SMTP transporter
 */
function initializeSMTP(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  if (smtpTransporter) {
    return smtpTransporter;
  }

  try {
    smtpTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports (587, 2525, etc.)
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
      tls: {
        // Do not fail on invalid certs (useful for development)
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });

    return smtpTransporter;
  } catch (error) {
    console.error('[SMTP] Failed to initialize transporter:', error);
    return null;
  }
}

/**
 * Verify SMTP connection
 */
export async function verifySMTPConnection(): Promise<boolean> {
  const transporter = initializeSMTP();
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('[SMTP] Connection verification failed:', error);
    return false;
  }
}

export interface SMTPEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  userId?: string;
  templateId?: string;
}

/**
 * Send email via SMTP
 */
export async function sendEmailViaSMTP(
  options: SMTPEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = initializeSMTP();

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD',
    };
  }

  const { to, subject, html, text, from, replyTo, userId, templateId } = options;
  const toAddresses = Array.isArray(to) ? to : [to];
  const fromAddress = from || `${FROM_NAME} <${FROM_EMAIL}>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toAddresses.join(', '),
      subject,
      html,
      text,
      replyTo,
    });

    // Log successful email
    for (const email of toAddresses) {
      await prisma.emailLog.create({
        data: {
          toEmail: email,
          toUserId: userId,
          fromEmail: FROM_EMAIL,
          subject,
          templateId,
          provider: 'SMTP',
          externalId: info.messageId,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failed email
    for (const email of toAddresses) {
      await prisma.emailLog.create({
        data: {
          toEmail: email,
          toUserId: userId,
          fromEmail: FROM_EMAIL,
          subject,
          templateId,
          provider: 'SMTP',
          status: 'FAILED',
          errorMessage,
        },
      });
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if SMTP is configured
 */
export function isSMTPConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);
}
