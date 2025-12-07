// Supabase Storage Integration
// Handles file uploads, downloads, and management

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Storage bucket configurations
export const STORAGE_BUCKETS = {
  BLOG_IMAGES: 'blog-images',
  USER_AVATARS: 'user-avatars',
  WORKSPACE_ASSETS: 'workspace-assets',
  AI_OUTPUTS: 'ai-outputs',
  DOCUMENTS: 'documents',
} as const;

export type BucketName = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

interface UploadOptions {
  bucket: BucketName;
  path: string;
  file: File | Blob | Buffer;
  contentType?: string;
  upsert?: boolean;
  cacheControl?: string;
}

interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

interface FileInfo {
  name: string;
  size: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  publicUrl: string;
}

class SupabaseStorage {
  private client: SupabaseClient | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.client = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
    } else {
      console.warn('[Storage] Supabase credentials not configured');
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Upload a file to storage
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    if (!this.client) {
      return { success: false, error: 'Storage not configured' };
    }

    try {
      const { bucket, path, file, contentType, upsert = false, cacheControl = '3600' } = options;

      const { data, error } = await this.client.storage.from(bucket).upload(path, file, {
        contentType,
        upsert,
        cacheControl,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.client.storage.from(bucket).getPublicUrl(data.path);

      return {
        success: true,
        path: data.path,
        publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Download a file from storage
   */
  async download(bucket: BucketName, path: string): Promise<Blob | null> {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client.storage.from(bucket).download(path);

      if (error) {
        console.error('[Storage] Download error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Storage] Download failed:', error);
      return null;
    }
  }

  /**
   * Delete a file from storage
   */
  async delete(bucket: BucketName, paths: string[]): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client.storage.from(bucket).remove(paths);

      if (error) {
        console.error('[Storage] Delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Storage] Delete failed:', error);
      return false;
    }
  }

  /**
   * List files in a bucket/folder
   */
  async list(
    bucket: BucketName,
    folder?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<FileInfo[]> {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client.storage.from(bucket).list(folder, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      });

      if (error) {
        console.error('[Storage] List error:', error.message);
        return [];
      }

      return data.map((file) => {
        const {
          data: { publicUrl },
        } = this.client!.storage.from(bucket).getPublicUrl(
          `${folder ? folder + '/' : ''}${file.name}`
        );

        return {
          name: file.name,
          size: file.metadata?.size || 0,
          contentType: file.metadata?.mimetype || 'application/octet-stream',
          createdAt: file.created_at,
          updatedAt: file.updated_at,
          publicUrl,
        };
      });
    } catch (error) {
      console.error('[Storage] List failed:', error);
      return [];
    }
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(bucket: BucketName, path: string, expiresIn = 3600): Promise<string | null> {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('[Storage] Signed URL error:', error.message);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[Storage] Signed URL failed:', error);
      return null;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: BucketName, path: string): string | null {
    if (!this.client) return null;

    const {
      data: { publicUrl },
    } = this.client.storage.from(bucket).getPublicUrl(path);

    return publicUrl;
  }

  /**
   * Move/rename a file
   */
  async move(bucket: BucketName, fromPath: string, toPath: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client.storage.from(bucket).move(fromPath, toPath);

      if (error) {
        console.error('[Storage] Move error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Storage] Move failed:', error);
      return false;
    }
  }

  /**
   * Copy a file
   */
  async copy(bucket: BucketName, fromPath: string, toPath: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client.storage.from(bucket).copy(fromPath, toPath);

      if (error) {
        console.error('[Storage] Copy error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Storage] Copy failed:', error);
      return false;
    }
  }
}

// Singleton instance
let storageInstance: SupabaseStorage | null = null;

export function getStorage(): SupabaseStorage {
  if (!storageInstance) {
    storageInstance = new SupabaseStorage();
  }
  return storageInstance;
}

// Convenience functions
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  return getStorage().upload(options);
}

export async function downloadFile(bucket: BucketName, path: string): Promise<Blob | null> {
  return getStorage().download(bucket, path);
}

export async function deleteFile(bucket: BucketName, paths: string[]): Promise<boolean> {
  return getStorage().delete(bucket, paths);
}

export async function listFiles(
  bucket: BucketName,
  folder?: string,
  options?: { limit?: number; offset?: number }
): Promise<FileInfo[]> {
  return getStorage().list(bucket, folder, options);
}

export function getPublicUrl(bucket: BucketName, path: string): string | null {
  return getStorage().getPublicUrl(bucket, path);
}
