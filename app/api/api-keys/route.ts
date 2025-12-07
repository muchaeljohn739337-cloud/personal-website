import { randomBytes, createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'apl';
  const key = randomBytes(24).toString('base64url');
  return `${prefix}_${key}`;
}

// Hash the API key for storage
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// GET - List user's API keys
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get keys from database
    const keys = await prisma.$queryRaw`
      SELECT id, name, key, scopes, last_used_at, expires_at, active, created_at
      FROM api_keys
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = ${session.user.id}
      )
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST - Create a new API key
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes = [], expiresInDays } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate the key
    const apiKey = generateApiKey();
    const hashedKey = hashApiKey(apiKey);

    // Calculate expiry
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Store in database (we need an organization, so create a personal one if needed)
    const id = `key_${randomBytes(12).toString('hex')}`;

    await prisma.$executeRaw`
      INSERT INTO api_keys (id, name, key, hashed_key, organization_id, scopes, expires_at, active, created_at, updated_at)
      SELECT 
        ${id},
        ${name},
        ${apiKey.substring(0, 12) + '...'}, -- Only store prefix for display
        ${hashedKey},
        COALESCE(
          (SELECT organization_id FROM organization_members WHERE user_id = ${session.user.id} LIMIT 1),
          'personal_' || ${session.user.id}
        ),
        ${scopes}::text[],
        ${expiresAt},
        true,
        NOW(),
        NOW()
    `;

    return NextResponse.json({
      success: true,
      key: {
        id,
        name,
        apiKey, // Return full key only once!
        scopes,
        expiresAt,
        createdAt: new Date(),
      },
      message: 'Save this API key - it will not be shown again!',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

// DELETE - Revoke an API key
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // Deactivate the key
    await prisma.$executeRaw`
      UPDATE api_keys 
      SET active = false, updated_at = NOW()
      WHERE id = ${keyId}
      AND organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = ${session.user.id}
      )
    `;

    return NextResponse.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
