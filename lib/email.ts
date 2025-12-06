/**
 * Resend Email Service Integration
 * Documentation: https://resend.com/docs
 */

import { Resend } from 'resend';

import { prisma } from './prismaClient';

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@example.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Personal Website';

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY);

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'Welcome to {{appName}}!',
    html: `
      <h1>Welcome, {{userName}}!</h1>
      <p>Thank you for joining {{appName}}. We're excited to have you on board.</p>
      <p>Get started by exploring your dashboard:</p>
      <a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
    `,
  },
  PASSWORD_RESET: {
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi {{userName}},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <a href="{{resetUrl}}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  },
  EMAIL_VERIFICATION: {
    subject: 'Verify Your Email Address',
    html: `
      <h1>Verify Your Email</h1>
      <p>Hi {{userName}},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="{{verifyUrl}}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
  },
  ACCOUNT_SUSPENDED: {
    subject: 'Account Suspended',
    html: `
      <h1>Account Suspended</h1>
      <p>Hi {{userName}},</p>
      <p>Your account has been suspended for the following reason:</p>
      <blockquote style="padding: 12px; background: #fef2f2; border-left: 4px solid #ef4444;">{{reason}}</blockquote>
      <p>Suspension type: {{suspensionType}}</p>
      {{#if endDate}}<p>Suspension ends: {{endDate}}</p>{{/if}}
      <p>If you believe this is a mistake, please contact support.</p>
    `,
  },
  ACCOUNT_UNSUSPENDED: {
    subject: 'Account Reinstated',
    html: `
      <h1>Your Account Has Been Reinstated</h1>
      <p>Hi {{userName}},</p>
      <p>Good news! Your account has been reinstated and you can now access all features.</p>
      <a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
    `,
  },
  PAYMENT_RECEIVED: {
    subject: 'Payment Received - {{amount}}',
    html: `
      <h1>Payment Confirmed</h1>
      <p>Hi {{userName}},</p>
      <p>We've received your payment of <strong>{{amount}}</strong>.</p>
      <p>Transaction ID: {{transactionId}}</p>
      <p>{{tokensEarned}} ADV tokens have been added to your wallet.</p>
      <a href="{{walletUrl}}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">View Wallet</a>
    `,
  },
  BOOKING_CONFIRMATION: {
    subject: 'MedBed Booking Confirmed - {{bookingNumber}}',
    html: `
      <h1>Booking Confirmed</h1>
      <p>Hi {{userName}},</p>
      <p>Your MedBed session has been confirmed:</p>
      <ul>
        <li><strong>Booking #:</strong> {{bookingNumber}}</li>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Time:</strong> {{time}}</li>
        <li><strong>Duration:</strong> {{duration}} minutes</li>
        <li><strong>Treatment:</strong> {{treatmentType}}</li>
        <li><strong>Facility:</strong> {{facilityName}}</li>
      </ul>
      <a href="{{bookingUrl}}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">View Booking</a>
    `,
  },
  ADMIN_ALERT: {
    subject: '[ADMIN] {{alertType}}',
    html: `
      <h1>Admin Alert: {{alertType}}</h1>
      <p>{{message}}</p>
      <p><strong>Details:</strong></p>
      <pre style="padding: 12px; background: #f3f4f6; border-radius: 6px;">{{details}}</pre>
      <a href="{{adminUrl}}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px;">View in Admin</a>
    `,
  },
};

// =============================================================================
// EMAIL FUNCTIONS
// =============================================================================

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  userId?: string;
  templateId?: string;
  tags?: { name: string; value: string }[];
}

// Replace template variables
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Send email via Resend
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, from, replyTo, userId, templateId, tags } = options;

  const toAddresses = Array.isArray(to) ? to : [to];
  const fromAddress = from || `${FROM_NAME} <${FROM_EMAIL}>`;

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: toAddresses,
      subject,
      html,
      text,
      replyTo: replyTo,
      tags,
    });

    // Log email
    for (const email of toAddresses) {
      await prisma.emailLog.create({
        data: {
          toEmail: email,
          toUserId: userId,
          fromEmail: FROM_EMAIL,
          subject,
          templateId,
          provider: 'RESEND',
          externalId: response.data?.id,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    // Log failed email
    for (const email of toAddresses) {
      await prisma.emailLog.create({
        data: {
          toEmail: email,
          toUserId: userId,
          fromEmail: FROM_EMAIL,
          subject,
          templateId,
          provider: 'RESEND',
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    throw error;
  }
}

// Send templated email
export async function sendTemplatedEmail(
  templateKey: keyof typeof EMAIL_TEMPLATES,
  to: string,
  variables: Record<string, string>,
  userId?: string
) {
  const template = EMAIL_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template ${templateKey} not found`);
  }

  const subject = replaceVariables(template.subject, variables);
  const html = replaceVariables(template.html, variables);

  return sendEmail({
    to,
    subject,
    html,
    userId,
    templateId: templateKey,
  });
}

// =============================================================================
// SPECIFIC EMAIL FUNCTIONS
// =============================================================================

export async function sendWelcomeEmail(user: { id: string; email: string; name?: string | null }) {
  return sendTemplatedEmail('WELCOME', user.email, {
    userName: user.name || 'there',
    appName: FROM_NAME,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  }, user.id);
}

export async function sendPasswordResetEmail(
  user: { id: string; email: string; name?: string | null },
  resetToken: string
) {
  return sendTemplatedEmail('PASSWORD_RESET', user.email, {
    userName: user.name || 'there',
    resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`,
  }, user.id);
}

export async function sendVerificationEmail(
  user: { id: string; email: string; name?: string | null },
  verifyToken: string
) {
  return sendTemplatedEmail('EMAIL_VERIFICATION', user.email, {
    userName: user.name || 'there',
    verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verifyToken}`,
  }, user.id);
}

export async function sendSuspensionEmail(
  user: { id: string; email: string; name?: string | null },
  reason: string,
  suspensionType: string,
  endDate?: Date
) {
  return sendTemplatedEmail('ACCOUNT_SUSPENDED', user.email, {
    userName: user.name || 'there',
    reason,
    suspensionType,
    endDate: endDate ? endDate.toLocaleDateString() : '',
  }, user.id);
}

export async function sendUnsuspensionEmail(user: { id: string; email: string; name?: string | null }) {
  return sendTemplatedEmail('ACCOUNT_UNSUSPENDED', user.email, {
    userName: user.name || 'there',
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  }, user.id);
}

export async function sendPaymentReceivedEmail(
  user: { id: string; email: string; name?: string | null },
  amount: string,
  transactionId: string,
  tokensEarned: number
) {
  return sendTemplatedEmail('PAYMENT_RECEIVED', user.email, {
    userName: user.name || 'there',
    amount,
    transactionId,
    tokensEarned: tokensEarned.toString(),
    walletUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens`,
  }, user.id);
}

export async function sendBookingConfirmationEmail(
  user: { id: string; email: string; name?: string | null },
  booking: {
    bookingNumber: string;
    scheduledStart: Date;
    durationMinutes: number;
    treatmentType: string;
    facilityName: string;
  }
) {
  return sendTemplatedEmail('BOOKING_CONFIRMATION', user.email, {
    userName: user.name || 'there',
    bookingNumber: booking.bookingNumber,
    date: booking.scheduledStart.toLocaleDateString(),
    time: booking.scheduledStart.toLocaleTimeString(),
    duration: booking.durationMinutes.toString(),
    treatmentType: booking.treatmentType.replace(/_/g, ' '),
    facilityName: booking.facilityName,
    bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/medbed`,
  }, user.id);
}

export async function sendAdminAlert(
  alertType: string,
  message: string,
  details: Record<string, unknown>
) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  return sendTemplatedEmail('ADMIN_ALERT', adminEmail, {
    alertType,
    message,
    details: JSON.stringify(details, null, 2),
    adminUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
  });
}

// =============================================================================
// BATCH EMAIL
// =============================================================================

export async function sendBulkEmail(
  recipients: Array<{ email: string; userId?: string; variables?: Record<string, string> }>,
  templateKey: keyof typeof EMAIL_TEMPLATES,
  baseVariables: Record<string, string> = {}
) {
  const results = [];

  for (const recipient of recipients) {
    try {
      const variables = { ...baseVariables, ...recipient.variables };
      const result = await sendTemplatedEmail(templateKey, recipient.email, variables, recipient.userId);
      results.push({ email: recipient.email, success: true, ...result });
    } catch (error) {
      results.push({
        email: recipient.email,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
