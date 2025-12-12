import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/blockchain/stats - Get blockchain statistics
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    // TODO: Implement proper role check
    // For now, return mock data

    const stats = {
      totalWallets: 1247,
      activeWallets: 589,
      totalTransactions: 8432,
      totalVolumeUsd: 2847392,
      pendingTransactions: 23,
      failedTransactions: 12,
      networks: [
        {
          name: 'Ethereum',
          wallets: 847,
          transactions: 5234,
          volume: 1847392,
        },
        {
          name: 'Polygon',
          wallets: 234,
          transactions: 1847,
          volume: 584732,
        },
        {
          name: 'Arbitrum',
          wallets: 123,
          transactions: 892,
          volume: 284739,
        },
        {
          name: 'Base',
          wallets: 43,
          transactions: 459,
          volume: 130529,
        },
      ],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch blockchain stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
