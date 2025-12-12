# ✅ Resend Email Configuration

**Date:** 2025-01-27  
**Status:** ✅ **CONFIGURED**

---

## 🔐 Configuration Summary

### API Key

- ✅ **RESEND_API_KEY:** `re_ZfLyazGP_8weozr9JWHqSN7HoM4JA74oC`
- ✅ **Location:** `.env.local`
- ✅ **Status:** Configured and ready

### Email Settings

- **FROM_EMAIL:** `noreply@advanciapayledger.com`
- **FROM_NAME:** `Advancia PayLedger`

---

## 📧 Current Implementation

### Email Provider Options

The project supports **both Resend REST API and SMTP**:

1. **Resend REST API** (default) - Fast, feature-rich
2. **SMTP** - Standard SMTP protocol (supports Resend SMTP and others)

Configure via `EMAIL_PROVIDER` environment variable:

- `api` - Always use Resend REST API
- `smtp` - Always use SMTP
- `auto` - Auto-detect (default: uses SMTP if configured, otherwise API)

### Standard Email Sending

The project uses Resend for sending emails (via API or SMTP):

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to Advancia PayLedger</h1>',
});
```

### Template-Based Emails

Built-in templates available:

- `WELCOME` - Welcome email for new users
- `PASSWORD_RESET` - Password reset links
- `EMAIL_VERIFICATION` - Email verification
- `PAYMENT_RECEIVED` - Payment confirmations
- `BOOKING_CONFIRMATION` - MedBed booking confirmations
- `ACCOUNT_SUSPENDED` - Account suspension notices
- `ACCOUNT_UNSUSPENDED` - Account reinstatement
- `ADMIN_ALERT` - Admin notifications

Usage:

```typescript
import { sendTemplatedEmail } from '@/lib/email';

await sendTemplatedEmail('WELCOME', 'user@example.com', {
  userName: 'John Doe',
  appName: 'Advancia PayLedger',
  dashboardUrl: 'https://advanciapayledger.com/dashboard',
});
```

---

## 🎨 Resend Template API Support

### New Feature: Resend Templates

The project now supports Resend's template API for reusable email templates:

#### Create a Template

```typescript
import { createResendTemplate } from '@/lib/email/templates';

const template = await createResendTemplate({
  name: 'order-confirmation',
  html: '<p>Product: {{{PRODUCT}}}</p><p>Total: ${{{PRICE}}}</p>',
  subject: 'Order Confirmation - {{{PRODUCT}}}',
  variables: [
    {
      key: 'PRODUCT',
      type: 'string',
      fallbackValue: 'item',
    },
    {
      key: 'PRICE',
      type: 'number',
      fallbackValue: 20,
    },
  ],
  publish: true, // Publish immediately
});
```

#### Send Email Using Template

```typescript
import { sendEmailWithResendTemplate } from '@/lib/email/templates';

await sendEmailWithResendTemplate('template-id-from-resend', 'customer@example.com', {
  PRODUCT: 'Advanced Plan',
  PRICE: 99,
});
```

#### Or Use in sendEmail

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'customer@example.com',
  resendTemplateId: 'template-id',
  resendTemplateData: {
    PRODUCT: 'Advanced Plan',
    PRICE: 99,
  },
});
```

---

## 🔧 Setup Order Confirmation Template

A helper function is available to set up the order confirmation template:

```typescript
import { setupOrderConfirmationTemplate } from '@/lib/email/templates';

// Creates and publishes the template
const templateId = await setupOrderConfirmationTemplate();
console.log('Template ID:', templateId);
```

---

## 📋 Available Functions

### Core Email Functions

- `sendEmail(options)` - Send standard email
- `sendTemplatedEmail(templateKey, to, variables)` - Send using built-in templates
- `sendWelcomeEmail(user)` - Send welcome email
- `sendPasswordResetEmail(user, token)` - Send password reset
- `sendVerificationEmail(user, token)` - Send email verification
- `sendPaymentReceivedEmail(user, amount, transactionId, tokens)` - Payment confirmation
- `sendBookingConfirmationEmail(user, booking)` - MedBed booking confirmation

### Resend Template Functions

- `createResendTemplate(options)` - Create a new template
- `publishResendTemplate(templateId)` - Publish a template
- `sendEmailWithResendTemplate(templateId, to, variables)` - Send using template
- `setupOrderConfirmationTemplate()` - Setup order confirmation template

---

## ✅ Verification

To test the email configuration:

```bash
npx tsx scripts/test-email.ts
```

Or test in code:

```typescript
import { sendVerificationEmail } from '@/lib/email';

await sendVerificationEmail(
  {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  'verification-token-123'
);
```

---

## 🔍 Troubleshooting

### Common Issues

1. **"Resend not configured"**
   - Check `RESEND_API_KEY` in `.env.local`
   - Restart development server after updating

2. **"Invalid API key"**
   - Verify API key format: `re_xxxxxxxxx`
   - Check key is active in Resend dashboard

3. **Template not found**
   - Ensure template is published before using
   - Verify template ID is correct

4. **Email not sending**
   - Check domain is verified in Resend
   - Verify `FROM_EMAIL` matches verified domain

---

## 📚 Documentation

- **Resend API:** https://resend.com/docs
- **Resend Templates:** https://resend.com/docs/api-reference/templates
- **Resend Dashboard:** https://resend.com/emails

---

## 🔌 SMTP Configuration

### Resend SMTP Setup

Resend also supports SMTP for sending emails:

**Configuration:**

- **Host:** `smtp.resend.com`
- **Port:** `465` (TLS/SSL) or `587` (STARTTLS)
- **User:** `resend`
- **Password:** Your Resend API key (`RESEND_API_KEY`)

**Environment Variables:**

```bash
EMAIL_PROVIDER=auto  # or 'smtp' to force SMTP
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASSWORD=re_ZfLyazGP_8weozr9JWHqSN7HoM4JA74oC  # Your Resend API key
```

**Usage:**
SMTP is automatically used if:

- `EMAIL_PROVIDER=smtp`, or
- `EMAIL_PROVIDER=auto` and SMTP is configured, or
- Resend API is not configured but SMTP is

```typescript
import { sendEmail } from '@/lib/email';

// Uses SMTP if configured (via EMAIL_PROVIDER or auto-detection)
await sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>This email will be sent via SMTP</p>',
});
```

### SMTP Functions

```typescript
import { sendEmailViaSMTP, verifySMTPConnection, isSMTPConfigured } from '@/lib/email/smtp';

// Check if SMTP is configured
if (isSMTPConfigured()) {
  // Verify connection
  const isConnected = await verifySMTPConnection();

  // Send email via SMTP
  await sendEmailViaSMTP({
    to: 'user@example.com',
    subject: 'Test Email',
    html: '<p>Hello from SMTP!</p>',
  });
}
```

---

**Resend email configuration is complete and ready to use!** 🎉

**Both REST API and SMTP are configured and ready.**
