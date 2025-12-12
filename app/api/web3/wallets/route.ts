import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { protectAPI } from '@/lib/security/api-protection';

const connectWalletSchema = z.object({
  address: z.string().min(26).max(66),
  network: z.string(),
  chainId: z.string(),
  provider: z.enum(['metamask', 'web3auth']).optional().default('metamask'),
});

// GET /api/web3/wallets - Get user's connected wallets
export async function GET(req: NextRequest) {
  try {
    // Apply API protection
    const protection = await protectAPI(req, {
      requireAuth: true,
      requireRole: 'USER',
      rateLimit: 'sensitive',
    });

    if (!protection.allowed) {
      return protection.response || NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch wallets from database
    // For now, return mock data
    const wallets = [
      {
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        network: 'ethereum',
        balance: '2.4 ETH',
        balanceUsd: 9234.56,
        tokens: [
          {
            symbol: 'USDT',
            name: 'Tether USD',
            balance: '1,450.00',
            balanceUsd: 1450.0,
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '890.25',
            balanceUsd: 890.25,
          },
        ],
      },
    ];

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/web3/wallets - Connect a new wallet
export async function POST(req: NextRequest) {
  try {
    // Apply API protection
    const protection = await protectAPI(req, {
      requireAuth: true,
      requireRole: 'USER',
      rateLimit: 'sensitive',
    });

    if (!protection.allowed) {
      return protection.response || NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { address, network, chainId, provider } = connectWalletSchema.parse(body);

    // TODO: Save wallet to database
    // For now, return success
    console.log(
      `Wallet connected: ${address} on ${network} (chainId: ${chainId}, provider: ${provider})`
    );

    return NextResponse.json({
      success: true,
      wallet: {
        address,
        network,
        chainId,
        provider,
      },
    });
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
