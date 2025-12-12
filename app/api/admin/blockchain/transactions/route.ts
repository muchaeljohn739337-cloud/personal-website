import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/blockchain/transactions - Get recent transactions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    // TODO: Implement proper role check

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // TODO: Fetch from database
    // For now, return mock data
    const transactions = [
      {
        id: '1',
        userId: 'usr_12345678',
        userEmail: 'user@example.com',
        type: 'SEND',
        network: 'ethereum',
        amount: '0.5 ETH',
        amountUsd: 1923.45,
        txHash: '0xabc...def',
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'usr_87654321',
        userEmail: 'alice@example.com',
        type: 'RECEIVE',
        network: 'polygon',
        amount: '100 MATIC',
        amountUsd: 85.3,
        txHash: '0x123...456',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        userId: 'usr_11223344',
        userEmail: 'bob@example.com',
        type: 'SEND',
        network: 'arbitrum',
        amount: '1000 USDC',
        amountUsd: 1000.0,
        txHash: '0x789...abc',
        status: 'pending',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ].slice(0, limit);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
