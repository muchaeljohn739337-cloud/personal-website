import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { transferTokens } from '@/lib/tokens';

const transferSchema = z.object({
  toEmail: z.string().email(),
  amount: z.number().positive().min(1),
  description: z.string().optional(),
});

// POST /api/tokens/transfer - Transfer tokens to another user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { toEmail, amount, description } = transferSchema.parse(body);

    // Find recipient
    const recipient = await prisma.user.findUnique({
      where: { email: toEmail },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    if (recipient.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 });
    }

    const result = await transferTokens(session.user.id, recipient.id, amount, description);

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${amount} ADV to ${recipient.name || recipient.email}`,
      transaction: result.fromTransaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Transfer error:', error);
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
  }
}
