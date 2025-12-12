import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

// Check admin access
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { userId: session.user.id };
}

// GET /api/admin/settings - Get all settings
export async function GET() {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Return default settings (in production, fetch from database)
    const settings = {
      maintenance_mode: false,
      security_shield: true,
      rate_limiting: true,
      max_login_attempts: 5,
      lockout_duration: 15,
      email_notifications: true,
      admin_email: 'admin@advanciapayledger.com',
      email_from: 'noreply@advanciapayledger.com',
      site_name: 'Advancia PayLedger',
      registration_enabled: true,
      require_email_verification: false,
      auto_backup: true,
      backup_frequency: 'daily',
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/admin/settings - Update settings
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const settings = await req.json();

    // Log the settings change
    console.log('Settings updated by admin:', auth.userId, settings);

    // In production, save to database
    // await prisma.systemSettings.upsert({ ... })

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
