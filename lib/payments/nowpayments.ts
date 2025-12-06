/**
 * NOWPayments.io Integration
 * Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38
 */

import { prisma } from '../prismaClient';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// Supported cryptocurrencies
export const SUPPORTED_CRYPTOS = [
  { code: 'BTC', name: 'Bitcoin', network: 'BTC' },
  { code: 'ETH', name: 'Ethereum', network: 'ETH' },
  { code: 'USDT', name: 'Tether', network: 'TRC20' },
  { code: 'USDC', name: 'USD Coin', network: 'ETH' },
  { code: 'BNB', name: 'BNB', network: 'BSC' },
  { code: 'SOL', name: 'Solana', network: 'SOL' },
  { code: 'XRP', name: 'Ripple', network: 'XRP' },
  { code: 'DOGE', name: 'Dogecoin', network: 'DOGE' },
  { code: 'LTC', name: 'Litecoin', network: 'LTC' },
  { code: 'MATIC', name: 'Polygon', network: 'MATIC' },
];

interface NOWPaymentsResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  expiration_estimate_date: string;
}

// Get API status
export async function getStatus() {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/status`, {
    headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
  });
  return response.json();
}

// Get available currencies
export async function getAvailableCurrencies() {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
    headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
  });
  return response.json();
}

// Get minimum payment amount for a currency
export async function getMinimumAmount(currencyFrom: string, currencyTo: string = 'usd') {
  const response = await fetch(
    `${NOWPAYMENTS_API_URL}/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`,
    { headers: { 'x-api-key': NOWPAYMENTS_API_KEY } }
  );
  return response.json();
}

// Get estimated price
export async function getEstimatedPrice(amount: number, currencyFrom: string, currencyTo: string) {
  const response = await fetch(
    `${NOWPAYMENTS_API_URL}/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`,
    { headers: { 'x-api-key': NOWPAYMENTS_API_KEY } }
  );
  return response.json();
}

// Create a payment
export async function createPayment(params: {
  userId: string;
  priceAmount: number;
  priceCurrency: string;
  payCurrency: string;
  orderId?: string;
  orderDescription?: string;
  ipnCallbackUrl?: string;
}) {
  const {
    userId,
    priceAmount,
    priceCurrency,
    payCurrency,
    orderId,
    orderDescription,
    ipnCallbackUrl,
  } = params;

  const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: priceAmount,
      price_currency: priceCurrency,
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: orderDescription,
      ipn_callback_url:
        ipnCallbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/nowpayments/webhook`,
    }),
  });

  const data: NOWPaymentsResponse = await response.json();

  if (!response.ok) {
    throw new Error((data as unknown as { message: string }).message || 'Failed to create payment');
  }

  // Save payment to database
  const payment = await prisma.cryptoPayment.create({
    data: {
      userId,
      provider: 'NOWPAYMENTS',
      externalId: data.payment_id,
      amount: data.pay_amount,
      amountUsd: priceAmount,
      currency: payCurrency.toUpperCase(),
      payAddress: data.pay_address,
      status: 'WAITING',
      description: orderDescription,
      ipnCallbackUrl: data.ipn_callback_url,
      expiresAt: new Date(data.expiration_estimate_date),
      metadata: {
        orderId: data.order_id,
        purchaseId: data.purchase_id,
      },
    },
  });

  return {
    payment,
    paymentDetails: data,
  };
}

// Get payment status
export async function getPaymentStatus(paymentId: string) {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
    headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
  });
  return response.json();
}

// Verify IPN signature
export function verifyIPNSignature(payload: string, signature: string): boolean {
  if (!NOWPAYMENTS_IPN_SECRET) return false;

  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET);
  hmac.update(JSON.stringify(JSON.parse(payload)));
  const calculatedSignature = hmac.digest('hex');

  return calculatedSignature === signature;
}

// Handle IPN webhook
export async function handleIPNWebhook(data: {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  outcome_amount: number;
  outcome_currency: string;
}) {
  const payment = await prisma.cryptoPayment.findUnique({
    where: { externalId: data.payment_id },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Map NOWPayments status to our status
  const statusMap: Record<string, string> = {
    waiting: 'WAITING',
    confirming: 'CONFIRMING',
    confirmed: 'CONFIRMED',
    sending: 'SENDING',
    partially_paid: 'PARTIALLY_PAID',
    finished: 'FINISHED',
    failed: 'FAILED',
    refunded: 'REFUNDED',
    expired: 'EXPIRED',
  };

  const newStatus = statusMap[data.payment_status] || 'WAITING';

  // Update payment
  const updatedPayment = await prisma.cryptoPayment.update({
    where: { id: payment.id },
    data: {
      status: newStatus as never,
      amount: data.actually_paid || data.pay_amount,
      confirmedAt: newStatus === 'FINISHED' ? new Date() : undefined,
      metadata: {
        ...((payment.metadata as object) || {}),
        outcomeAmount: data.outcome_amount,
        outcomeCurrency: data.outcome_currency,
        actuallyPaid: data.actually_paid,
      },
    },
  });

  // If payment is finished, credit user's token wallet
  if (newStatus === 'FINISHED') {
    const tokenAmount = data.price_amount * 10; // $1 = 10 ADV tokens

    // Add tokens to user's wallet
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId: payment.userId },
    });

    if (wallet) {
      await prisma.tokenWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: tokenAmount },
          lifetimeEarned: { increment: tokenAmount },
        },
      });

      // Create token transaction
      await prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'EARN',
          amount: tokenAmount,
          balanceAfter: Number(wallet.balance) + tokenAmount,
          description: `Crypto deposit via NOWPayments (${data.pay_currency})`,
          metadata: { paymentId: payment.id },
        },
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        type: 'TRANSACTION',
        title: 'Payment Received',
        message: `Your crypto payment of ${data.actually_paid} ${data.pay_currency} has been confirmed. ${tokenAmount} ADV tokens have been added to your wallet.`,
        data: { paymentId: payment.id },
      },
    });
  }

  return updatedPayment;
}

// Create payout (withdrawal)
export async function createPayout(params: {
  userId: string;
  address: string;
  amount: number;
  currency: string;
}) {
  const { userId, address, amount, currency } = params;

  // Check user's token balance
  const wallet = await prisma.tokenWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const availableBalance = Number(wallet.balance) - Number(wallet.lockedBalance);
  const tokenAmount = amount * 10; // Convert USD to tokens

  if (availableBalance < tokenAmount) {
    throw new Error('Insufficient balance');
  }

  // Get estimated crypto amount
  const estimate = await getEstimatedPrice(amount, 'usd', currency.toLowerCase());

  // Create withdrawal record
  const withdrawal = await prisma.cryptoWithdrawal.create({
    data: {
      userId,
      provider: 'NOWPAYMENTS',
      amount: estimate.estimated_amount,
      amountUsd: amount,
      currency: currency.toUpperCase(),
      address,
      status: 'PENDING',
    },
  });

  // Lock tokens
  await prisma.tokenWallet.update({
    where: { id: wallet.id },
    data: {
      lockedBalance: { increment: tokenAmount },
    },
  });

  // In production, you would call NOWPayments payout API here
  // For now, we just create the withdrawal record

  return withdrawal;
}
