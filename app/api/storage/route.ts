import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  deleteFile,
  getStorage,
  listFiles,
  STORAGE_BUCKETS,
  uploadFile,
} from '@/lib/storage/supabase';
import type { BucketName } from '@/lib/storage/supabase';

// GET - List files or get storage info
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const bucket = searchParams.get('bucket') as BucketName | null;
    const folder = searchParams.get('folder') || undefined;

    // Check if storage is available
    if (action === 'status') {
      const storage = getStorage();
      return NextResponse.json({
        available: storage.isAvailable(),
        buckets: Object.values(STORAGE_BUCKETS),
      });
    }

    // List files
    if (action === 'list' && bucket) {
      const files = await listFiles(bucket, folder);
      return NextResponse.json({ files });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Storage GET error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// POST - Upload file
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as BucketName | null;
    const path = formData.get('path') as string | null;

    if (!file || !bucket) {
      return NextResponse.json({ error: 'File and bucket are required' }, { status: 400 });
    }

    // Generate path if not provided
    const filePath =
      path || `${session.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const result = await uploadFile({
      bucket,
      path: filePath,
      file,
      contentType: file.type,
      upsert: true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: result.path,
      publicUrl: result.publicUrl,
    });
  } catch (error) {
    console.error('Storage POST error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// DELETE - Delete file(s)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') as BucketName | null;
    const paths = searchParams.get('paths');

    if (!bucket || !paths) {
      return NextResponse.json({ error: 'Bucket and paths are required' }, { status: 400 });
    }

    const pathArray = paths.split(',');
    const success = await deleteFile(bucket, pathArray);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Storage DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
