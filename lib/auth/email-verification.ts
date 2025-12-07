/**
 * Email Verification System
 * Handles email verification tokens and flow
 */

import { prisma } from '@/lib/prismaClient';
import { generateSecureToken } from '@/lib/security';

const TOKEN_EXPIRY_HOURS = 24;

interface VerificationResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Generate and store email verification token
 */
export async function createEmailVerificationToken(userId: string, email: string): Promise<string> {
  // Delete any existing tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const token = generateSecureToken(64);
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Verify email with token
 */
export async function verifyEmailToken(token: string): Promise<VerificationResult> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return {
      success: false,
      message: 'Invalid verification token',
    };
  }

  if (verificationToken.expires < new Date()) {
    // Clean up expired token
    await prisma.verificationToken.delete({
      where: { token },
    });
    return {
      success: false,
      message: 'Verification token has expired. Please request a new one.',
    };
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  });

  if (!user) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  // Update user as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { token },
  });

  return {
    success: true,
    message: 'Email verified successfully',
    userId: user.id,
  };
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  return !!user?.emailVerified;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists
    return {
      success: true,
      message: 'If an account exists with this email, a verification link will be sent.',
    };
  }

  if (user.emailVerified) {
    return {
      success: false,
      message: 'Email is already verified',
    };
  }

  const token = await createEmailVerificationToken(user.id, email);

  // In production, send email here
  // await sendVerificationEmail(email, token);

  return {
    success: true,
    message: 'Verification email sent',
    token: process.env.NODE_ENV === 'development' ? token : undefined,
  };
}

/**
 * Generate verification email content
 */
export function generateVerificationEmailContent(token: string): {
  subject: string;
  html: string;
  text: string;
} {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  return {
    subject: 'Verify your email - Advancia PayLedger',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a12; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px;">🔐</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Verify Your Email</h1>
            </div>
            
            <p style="color: #9ca3af; line-height: 1.6; margin-bottom: 30px;">
              Thank you for signing up for Advancia PayLedger. Please click the button below to verify your email address and activate your account.
            </p>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you didn't create an account with Advancia PayLedger, you can safely ignore this email.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              This link will expire in ${TOKEN_EXPIRY_HOURS} hours.
            </p>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verifyUrl}" style="color: #8b5cf6; word-break: break-all;">${verifyUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Verify Your Email - Advancia PayLedger

Thank you for signing up for Advancia PayLedger. Please visit the following link to verify your email address:

${verifyUrl}

This link will expire in ${TOKEN_EXPIRY_HOURS} hours.

If you didn't create an account with Advancia PayLedger, you can safely ignore this email.
    `.trim(),
  };
}
