import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { logAdminAction } from '@/lib/admin';

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

  return { userId: session.user.id, role: user.role };
}

// POST /api/admin/users/account-control - Admin controls for user accounts
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { action, userId, amount, currency = 'USD', description } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: 'Action and user ID are required' }, { status: 400 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        tokenWallet: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from controlling other admins (unless SUPER_ADMIN)
    if (
      (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN') &&
      auth.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json({ error: 'Cannot control admin accounts' }, { status: 403 });
    }

    let result;

    switch (action) {
      case 'SEND': {
        // Admin sends funds to user
        if (!amount || amount <= 0) {
          return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        // Get or create primary wallet
        let wallet = targetUser.wallets.find((w) => w.type === 'PERSONAL');
        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: {
              name: 'Primary Wallet',
              userId: targetUser.id,
              type: 'PERSONAL',
              currency,
            },
          });
        }

        // Add funds
        const newBalance = Number(wallet.balance) + Number(amount);
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            amount: amount,
            currency,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            description: description || `Admin deposit by ${auth.userId}`,
            toWalletId: wallet.id,
            receiverId: targetUser.id,
            metadata: {
              adminAction: true,
              adminId: auth.userId,
              source: 'admin_control',
            },
          },
        });

        result = {
          success: true,
          message: `Sent ${amount} ${currency} to user`,
          newBalance,
        };
        break;
      }

      case 'WITHDRAW': {
        // Admin withdraws funds from user
        if (!amount || amount <= 0) {
          return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        // Get primary wallet
        const wallet = targetUser.wallets.find((w) => w.type === 'PERSONAL');
        if (!wallet) {
          return NextResponse.json({ error: 'User has no wallet' }, { status: 400 });
        }

        const currentBalance = Number(wallet.balance);
        if (currentBalance < amount) {
          return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        // Deduct funds
        const newBalance = currentBalance - Number(amount);
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            amount: amount,
            currency,
            type: 'WITHDRAWAL',
            status: 'COMPLETED',
            description: description || `Admin withdrawal by ${auth.userId}`,
            fromWalletId: wallet.id,
            senderId: targetUser.id,
            metadata: {
              adminAction: true,
              adminId: auth.userId,
              source: 'admin_control',
            },
          },
        });

        result = {
          success: true,
          message: `Withdrew ${amount} ${currency} from user`,
          newBalance,
        };
        break;
      }

      case 'CHECK': {
        // Admin checks user account balance
        const wallet = targetUser.wallets.find((w) => w.type === 'PERSONAL');
        const tokenWallet = targetUser.tokenWallet;

        result = {
          success: true,
          account: {
            userId: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
            wallet: wallet
              ? {
                  id: wallet.id,
                  balance: wallet.balance,
                  currency: wallet.currency,
                  type: wallet.type,
                }
              : null,
            tokenWallet: tokenWallet
              ? {
                  balance: tokenWallet.balance,
                  lockedBalance: tokenWallet.lockedBalance,
                  lifetimeEarned: tokenWallet.lifetimeEarned,
                  lifetimeSpent: tokenWallet.lifetimeSpent,
                }
              : null,
            isSuspended: targetUser.isSuspended,
            isApproved: targetUser.isApproved,
            isVerified: targetUser.isVerified,
            role: targetUser.role,
            createdAt: targetUser.createdAt,
            lastLoginAt: targetUser.lastLoginAt,
          },
        };
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log admin action (to both Prisma and Supabase)
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await logAdminAction(auth.userId, {
      action: 'WALLET_ADJUST',
      targetUserId: userId,
      description: `Admin ${action.toLowerCase()}: ${description || 'N/A'}`,
      metadata: {
        action,
        amount,
        currency,
        description,
        result,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin account control error:', error);
    return NextResponse.json(
      { error: 'Failed to process account control action' },
      { status: 500 }
    );
  }
}
