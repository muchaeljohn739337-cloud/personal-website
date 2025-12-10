/**
 * Two-Factor Authentication (2FA) using TOTP
 * Implements Time-based One-Time Password authentication
 */

import { prisma } from '@/lib/prismaClient';
import crypto from 'crypto';

// TOTP Configuration
const TOTP_CONFIG = {
  issuer: 'Advancia PayLedger',
  algorithm: 'SHA1',
  digits: 6,
  period: 30, // seconds
  window: 1, // Allow 1 period before/after for clock drift
};

// Backup codes configuration
const BACKUP_CODES_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

/**
 * Generate a random base32 secret for TOTP
 */
export function generateTOTPSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Base32 encoding for TOTP secrets
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Base32 decoding
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Generate TOTP code for a given secret and time
 */
function generateTOTP(secret: string, time?: number): string {
  const now = time || Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / TOTP_CONFIG.period);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const secretBuffer = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_CONFIG.digits);
  return otp.toString().padStart(TOTP_CONFIG.digits, '0');
}

/**
 * Verify a TOTP code
 */
export function verifyTOTP(secret: string, code: string): boolean {
  const now = Math.floor(Date.now() / 1000);

  // Check current period and window periods before/after
  for (let i = -TOTP_CONFIG.window; i <= TOTP_CONFIG.window; i++) {
    const time = now + i * TOTP_CONFIG.period;
    const expectedCode = generateTOTP(secret, time);

    if (timingSafeEqual(code, expectedCode)) {
      return true;
    }
  }

  return false;
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate otpauth:// URL for QR code
 */
export function generateTOTPUri(secret: string, email: string): string {
  const params = new URLSearchParams({
    secret,
    issuer: TOTP_CONFIG.issuer,
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits.toString(),
    period: TOTP_CONFIG.period.toString(),
  });

  return `otpauth://totp/${encodeURIComponent(TOTP_CONFIG.issuer)}:${encodeURIComponent(email)}?${params.toString()}`;
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars

  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    let code = '';
    for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
      code += chars[crypto.randomInt(chars.length)];
    }
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Hash backup codes for storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return codes.map((code) => {
    const normalized = code.replace(/-/g, '').toUpperCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  });
}

/**
 * Enable 2FA for a user
 */
export async function enable2FA(
  userId: string,
  email: string
): Promise<{
  secret: string;
  uri: string;
  backupCodes: string[];
}> {
  const secret = generateTOTPSecret();
  const uri = generateTOTPUri(secret, email);
  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = await hashBackupCodes(backupCodes);

  // Store encrypted secret (in production, encrypt before storing)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false, // Not enabled until verified
      backupCodes: hashedBackupCodes,
    },
  });

  return {
    secret,
    uri,
    backupCodes,
  };
}

/**
 * Verify and activate 2FA
 */
export async function verify2FASetup(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return false;
  }

  const isValid = verifyTOTP(user.twoFactorSecret, code);

  if (isValid) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  return isValid;
}

/**
 * Verify 2FA code during login
 */
export async function verify2FALogin(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorSecret: true,
      twoFactorEnabled: true,
      backupCodes: true,
    },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return false;
  }

  // First, try TOTP code
  if (verifyTOTP(user.twoFactorSecret, code)) {
    return true;
  }

  // Then, try backup code
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  const hashedCode = crypto.createHash('sha256').update(normalizedCode).digest('hex');

  const backupCodes = user.backupCodes as string[];
  const codeIndex = backupCodes.indexOf(hashedCode);

  if (codeIndex !== -1) {
    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes },
    });
    return true;
  }

  return false;
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      backupCodes: [],
    },
  });
}

/**
 * Check if user has 2FA enabled
 */
export async function has2FAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  return !!user?.twoFactorEnabled;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = await hashBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: hashedBackupCodes },
  });

  return backupCodes;
}
