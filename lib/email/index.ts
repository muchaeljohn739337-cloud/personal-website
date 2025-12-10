/**
 * Email Module Index
 * Centralized exports for email functionality
 */

export * from './routing';
export * from './security';

// Re-export from main email file
export {
  sendEmail,
  sendTemplatedEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendSuspensionEmail,
  sendUnsuspensionEmail,
  sendPaymentReceivedEmail,
  sendBookingConfirmationEmail,
  sendAdminAlert,
  sendBulkEmail,
  EMAIL_TEMPLATES,
} from '../email';
