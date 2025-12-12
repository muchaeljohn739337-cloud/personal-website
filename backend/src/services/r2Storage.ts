/**
 * Cloudflare R2 Object Storage Service
 * High-performance storage for user documents, receipts, and transaction attachments
 * Zero egress charges - perfect for payment platform file storage
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "advancia-documents";

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

export interface UploadOptions {
  userId: string;
  category: "receipts" | "invoices" | "documents" | "avatars" | "attachments";
  filename: string;
  contentType: string;
  buffer: Buffer;
  metadata?: Record<string, string>;
}

export interface FileMetadata {
  key: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  userId: string;
  category: string;
}

/**
 * Upload file to R2 storage
 */
export async function uploadToR2(
  options: UploadOptions
): Promise<FileMetadata> {
  const { userId, category, filename, contentType, buffer, metadata } = options;

  // Generate unique key: category/userId/timestamp-filename
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${category}/${userId}/${timestamp}-${sanitizedFilename}`;

  // Upload to R2
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      userId,
      category,
      originalFilename: filename,
      uploadedAt: new Date().toISOString(),
      ...metadata,
    },
  });

  await r2Client.send(command);

  // Generate public URL (if bucket is public) or use signed URL
  const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;

  return {
    key,
    url: publicUrl,
    size: buffer.length,
    contentType,
    uploadedAt: new Date(),
    userId,
    category,
  };
}

/**
 * Generate a presigned URL for secure temporary access
 * @param key - File key in R2
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Download file from R2
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error("File not found in R2");
  }

  // Convert stream to buffer
  const stream = response.Body as Readable;
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    // Ensure each chunk is a Buffer
    const buf = Buffer.isBuffer(chunk)
      ? new Uint8Array(chunk)
      : new Uint8Array(Buffer.from(chunk as any));
    chunks.push(buf);
  }

  // Cast to any to satisfy TS typing differences between Buffer and Uint8Array
  return Buffer.concat(chunks as any);
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Check if file exists in R2
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file metadata from R2
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  metadata: Record<string, string>;
}> {
  const command = new HeadObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);

  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType || "application/octet-stream",
    lastModified: response.LastModified || new Date(),
    metadata: response.Metadata || {},
  };
}
