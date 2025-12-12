/**
 * Email Module Index
 * Centralized exports for email functionality
 */

export * from './routing';
export * from './security';
export * from './smtp';
export * from './templates';

// Re-export from main email file
export {
  EMAIL_TEMPLATES,
  sendAdminAlert,
  sendBookingConfirmationEmail,
  sendBulkEmail,
  sendEmail,
  sendPasswordResetEmail,
  sendPaymentReceivedEmail,
  sendSuspensionEmail,
  sendTemplatedEmail,
  sendUnsuspensionEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../email';
