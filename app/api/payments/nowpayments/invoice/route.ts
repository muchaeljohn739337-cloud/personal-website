/**
 * NOWPayments Invoice Route
 * Handles invoice-based payment lookups and status checks
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import {
  extractInvoiceIdFromUrl,
  getPaymentStatusByInvoiceId,
} from '@/lib/payments/nowpayments-invoice';

/**
 * GET /api/payments/nowpayments/invoice
 * Get payment information by invoice ID or URL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoiceId');
    const url = searchParams.get('url');

    if (!invoiceId && !url) {
      return NextResponse.json({ error: 'invoiceId or url parameter required' }, { status: 400 });
    }

    let actualInvoiceId: string | null = null;

    if (url) {
      actualInvoiceId = extractInvoiceIdFromUrl(url);
      if (!actualInvoiceId) {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    } else {
      actualInvoiceId = invoiceId;
    }

    if (!actualInvoiceId) {
      return NextResponse.json({ error: 'Invoice ID not found' }, { status: 400 });
    }

    // Get payment status
    const result = await getPaymentStatusByInvoiceId(actualInvoiceId);

    if (!result) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify user owns this payment
    if (result.payment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      payment: {
        id: result.payment.id,
        status: result.payment.status,
        amount: Number(result.payment.amount),
        amountUsd: Number(result.payment.amountUsd),
        currency: result.payment.currency,
        payAddress: result.payment.payAddress,
        expiresAt: result.payment.expiresAt,
        confirmedAt: result.payment.confirmedAt,
        createdAt: result.payment.createdAt,
      },
      invoiceId: actualInvoiceId,
      currentStatus: result.status,
      details: result.details,
    });
  } catch (error) {
    console.error('[NOWPayments Invoice] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
