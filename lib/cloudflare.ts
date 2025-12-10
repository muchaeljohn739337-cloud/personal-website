/**
 * Cloudflare Integration
 * - R2 Storage for file uploads
 * - Turnstile for bot protection
 * - Workers KV for caching (optional)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { prisma } from './prismaClient';

// Cloudflare R2 Configuration (S3-compatible)
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'uploads';
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

// Turnstile Configuration
const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!;

// Initialize R2 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// =============================================================================
// R2 STORAGE FUNCTIONS
// =============================================================================

export interface UploadOptions {
  userId?: string;
  folder?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop();
  return `${timestamp}-${random}.${ext}`;
}

// Upload file to R2
export async function uploadFile(
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string,
  options: UploadOptions = {}
) {
  const { userId, folder = 'uploads', isPublic = false, metadata = {} } = options;

  const filename = generateFilename(originalName);
  const key = `${folder}/${filename}`;

  // Upload to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        ...metadata,
        originalName,
        uploadedBy: userId || 'anonymous',
      },
    })
  );

  // Generate public URL if applicable
  const url = isPublic && R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null;

  // Save to database
  const fileRecord = await prisma.fileUpload.create({
    data: {
      userId,
      filename,
      originalName,
      mimeType,
      size: file.length,
      provider: 'CLOUDFLARE_R2',
      bucket: R2_BUCKET_NAME,
      key,
      url,
      isPublic,
      metadata,
    },
  });

  return {
    id: fileRecord.id,
    filename,
    key,
    url,
    size: file.length,
  };
}

// Get signed URL for private file access
export async function getSignedFileUrl(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

// Get signed URL for upload (client-side upload)
export async function getUploadUrl(
  filename: string,
  mimeType: string,
  folder: string = 'uploads',
  expiresIn: number = 3600
) {
  const key = `${folder}/${generateFilename(filename)}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });

  return { signedUrl, key };
}

// Delete file from R2
export async function deleteFile(fileId: string) {
  const file = await prisma.fileUpload.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new Error('File not found');
  }

  // Delete from R2
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: file.key,
    })
  );

  // Soft delete in database
  await prisma.fileUpload.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });

  return { success: true };
}

// List files in a folder
export async function listFiles(folder: string, maxKeys: number = 100) {
  const response = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: folder,
      MaxKeys: maxKeys,
    })
  );

  return response.Contents || [];
}

// Get file by ID
export async function getFile(fileId: string) {
  const file = await prisma.fileUpload.findUnique({
    where: { id: fileId },
  });

  if (!file || file.deletedAt) {
    throw new Error('File not found');
  }

  // If private, generate signed URL
  if (!file.isPublic) {
    const signedUrl = await getSignedFileUrl(file.key);
    return { ...file, url: signedUrl };
  }

  return file;
}

// =============================================================================
// TURNSTILE VERIFICATION
// =============================================================================

export interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

// Verify Turnstile token
export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<TurnstileVerifyResponse> {
  const formData = new URLSearchParams();
  formData.append('secret', TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  if (ip) {
    formData.append('remoteip', ip);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

// Get Turnstile site key for client
export function getTurnstileSiteKey(): string {
  return TURNSTILE_SITE_KEY;
}

// =============================================================================
// HELPER EXPORTS
// =============================================================================

export { R2_BUCKET_NAME, R2_PUBLIC_URL };
