/**
 * NOWPayments Invoice Management
 * Handles invoice-based payments and payment retrieval by invoice ID
 * Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38
 */

import { prisma } from '../prismaClient';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;

/**
 * Get payment by invoice ID
 * Invoice ID format: iid=6349805040 (from URL: https://nowpayments.io/payment?iid=6349805040)
 */
export async function getPaymentByInvoiceId(invoiceId: string) {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPAYMENTS_API_KEY not configured');
  }

  try {
    // Try to get payment by invoice ID (if NOWPayments supports it)
    // Otherwise, search in our database by metadata
    const payment = await prisma.cryptoPayment.findFirst({
      where: {
        provider: 'NOWPAYMENTS',
        metadata: {
          path: ['invoiceId'],
          equals: invoiceId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (payment) {
      return payment;
    }

    // If not found in database, try to get from NOWPayments API
    // Note: NOWPayments API might not have direct invoice ID lookup
    // This would require listing payments and filtering
    return null;
  } catch (error) {
    console.error('[NOWPayments Invoice] Error getting payment:', error);
    throw error;
  }
}

/**
 * Create payment from invoice URL
 * Extracts invoice ID from NOWPayments payment URL
 */
export function extractInvoiceIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const invoiceId = urlObj.searchParams.get('iid');
    return invoiceId;
  } catch (error) {
    console.error('[NOWPayments Invoice] Error parsing URL:', error);
    return null;
  }
}

/**
 * Get payment status by invoice ID
 */
export async function getPaymentStatusByInvoiceId(invoiceId: string) {
  const payment = await getPaymentByInvoiceId(invoiceId);

  if (!payment) {
    return null;
  }

  // Get latest status from NOWPayments API
  if (payment.externalId) {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${payment.externalId}`, {
      headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        payment,
        status: data.payment_status,
        details: data,
      };
    }
  }

  return {
    payment,
    status: payment.status,
  };
}

/**
 * Link invoice ID to existing payment
 */
export async function linkInvoiceIdToPayment(paymentId: string, invoiceId: string) {
  const payment = await prisma.cryptoPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  const updatedPayment = await prisma.cryptoPayment.update({
    where: { id: paymentId },
    data: {
      metadata: {
        ...((payment.metadata as Record<string, unknown>) || {}),
        invoiceId,
      },
    },
  });

  return updatedPayment;
}
