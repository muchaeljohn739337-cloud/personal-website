import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getOrCreateTokenWallet, getTransactionHistory, TOKEN_CONFIG } from '@/lib/tokens';

// GET /api/tokens - Get user's token wallet
export async function GET(req: NextRequest) {
  try {
    // Apply API protection
    const protection = await protectAPI(req, {
      requireAuth: true,
      requireRole: 'USER',
      rateLimit: 'sensitive',
    });

    if (!protection.allowed) {
      return protection.response || NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await getOrCreateTokenWallet(session.user.id);
    const { transactions, total } = await getTransactionHistory(session.user.id, { limit: 10 });

    return NextResponse.json({
      wallet: {
        balance: Number(wallet.balance),
        lockedBalance: Number(wallet.lockedBalance),
        availableBalance: Number(wallet.balance) - Number(wallet.lockedBalance),
        lifetimeEarned: Number(wallet.lifetimeEarned),
        lifetimeSpent: Number(wallet.lifetimeSpent),
        tokenSymbol: wallet.tokenSymbol,
        exchangeRate: Number(wallet.exchangeRate),
        usdValue: Number(wallet.balance) * TOKEN_CONFIG.exchangeRate,
      },
      transactions,
      totalTransactions: total,
      config: TOKEN_CONFIG,
    });
  } catch (error) {
    console.error('Token wallet error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
