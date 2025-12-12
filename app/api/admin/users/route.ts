import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { getUsers } from '@/lib/admin';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

// Middleware to check admin access
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

// GET /api/admin/users - List all users
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const isSuspended =
      searchParams.get('suspended') === 'true'
        ? true
        : searchParams.get('suspended') === 'false'
          ? false
          : undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await getUsers({
      page,
      limit,
      search,
      role,
      isSuspended,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
