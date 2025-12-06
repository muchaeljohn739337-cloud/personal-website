import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

interface AuthResult {
  success: boolean;
  user: AuthUser;
}

interface AdminCheckResult {
  success: boolean;
}

export async function authenticateToken(
  req: NextRequest
): Promise<(AuthResult & { success: true }) | { success: false; user: null }> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { success: false, user: null };
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = verify(token, secret) as AuthUser;
    return { success: true, user: decoded };
  } catch {
    return { success: false, user: null };
  }
}

export async function requireAdmin(user: AuthUser): Promise<AdminCheckResult> {
  if (!user || user.role !== 'ADMIN') {
    return { success: false };
  }
  return { success: true };
}
