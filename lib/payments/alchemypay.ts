/**
 * Alchemy Pay Integration
 * Documentation: https://alchemypay.readme.io/
 * Fiat-to-Crypto on-ramp and off-ramp solution
 */

import crypto from 'crypto';

import { prisma } from '../prismaClient';

const ALCHEMY_API_URL = process.env.ALCHEMY_PAY_API_URL || 'https://openapi.alchemypay.org';
const ALCHEMY_APP_ID = process.env.ALCHEMY_PAY_APP_ID!;
const ALCHEMY_APP_SECRET = process.env.ALCHEMY_PAY_APP_SECRET!;

// Supported fiat currencies
export const SUPPORTED_FIAT = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'KRW', 'SGD', 'HKD'];

// Supported crypto for on-ramp
export const SUPPORTED_CRYPTO_ONRAMP = [
  { code: 'BTC', name: 'Bitcoin', networks: ['BTC'] },
  { code: 'ETH', name: 'Ethereum', networks: ['ETH', 'ARB', 'OP'] },
  { code: 'USDT', name: 'Tether', networks: ['ETH', 'TRC20', 'BSC', 'POLYGON'] },
  { code: 'USDC', name: 'USD Coin', networks: ['ETH', 'BSC', 'POLYGON', 'ARB'] },
  { code: 'BNB', name: 'BNB', networks: ['BSC'] },
  { code: 'MATIC', name: 'Polygon', networks: ['POLYGON'] },
  { code: 'SOL', name: 'Solana', networks: ['SOL'] },
];

// Generate signature for API requests
function generateSignature(params: Record<string, string | number>, timestamp: string): string {
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
  const signString = `${ALCHEMY_APP_ID}${queryString}${timestamp}${ALCHEMY_APP_SECRET}`;
  return crypto.createHash('md5').update(signString).digest('hex');
}

// Make authenticated API request
async function makeRequest(endpoint: string, params: Record<string, string | number> = {}) {
  const timestamp = Date.now().toString();
  const signature = generateSignature(params, timestamp);

  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const url = `${ALCHEMY_API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      appid: ALCHEMY_APP_ID,
      timestamp,
      sign: signature,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}

// Get supported crypto currencies
export async function getCryptoCurrencies() {
  return makeRequest('/open/api/v4/merchant/crypto/list');
}

// Get supported fiat currencies
export async function getFiatCurrencies() {
  return makeRequest('/open/api/v4/merchant/fiat/list');
}

// Get price quote for buying crypto
export async function getBuyQuote(params: {
  crypto: string;
  network: string;
  fiat: string;
  amount: number;
  side: 'BUY' | 'SELL';
}) {
  return makeRequest('/open/api/v4/merchant/order/quote', {
    crypto: params.crypto,
    network: params.network,
    fiat: params.fiat,
    amount: params.amount,
    side: params.side,
  });
}

// Create on-ramp order (buy crypto with fiat)
export async function createBuyOrder(params: {
  userId: string;
  crypto: string;
  network: string;
  fiat: string;
  fiatAmount: number;
  walletAddress: string;
  email?: string;
  redirectUrl?: string;
}) {
  const {
    userId,
    crypto: cryptoCurrency,
    network,
    fiat,
    fiatAmount,
    walletAddress,
    email,
    redirectUrl,
  } = params;

  // Get quote first
  const quote = await getBuyQuote({
    crypto: cryptoCurrency,
    network,
    fiat,
    amount: fiatAmount,
    side: 'BUY',
  });

  if (!quote.success) {
    throw new Error(quote.message || 'Failed to get quote');
  }

  const orderId = `ACH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create order via Alchemy Pay API
  const orderResponse = await makeRequest('/open/api/v4/merchant/order/create', {
    merchantOrderNo: orderId,
    crypto: cryptoCurrency,
    network,
    fiat,
    fiatAmount,
    address: walletAddress,
    email: email || '',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/alchemypay/webhook`,
    redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens`,
  });

  if (!orderResponse.success) {
    throw new Error(orderResponse.message || 'Failed to create order');
  }

  // Save payment to database
  const payment = await prisma.cryptoPayment.create({
    data: {
      userId,
      provider: 'ALCHEMY_PAY',
      externalId: orderResponse.data?.orderNo || orderId,
      amount: quote.data?.cryptoAmount || 0,
      amountUsd: fiatAmount,
      currency: cryptoCurrency.toUpperCase(),
      fiatAmount,
      fiatCurrency: fiat.toUpperCase(),
      exchangeRate: quote.data?.price || 0,
      status: 'WAITING',
      description: `Buy ${cryptoCurrency} with ${fiat}`,
      metadata: {
        network,
        walletAddress,
        quote: quote.data,
        orderResponse: orderResponse.data,
      },
    },
  });

  return {
    payment,
    orderDetails: orderResponse.data,
    paymentUrl: orderResponse.data?.payUrl,
  };
}

// Create off-ramp order (sell crypto for fiat)
export async function createSellOrder(params: {
  userId: string;
  crypto: string;
  network: string;
  fiat: string;
  cryptoAmount: number;
  bankAccount?: {
    accountNumber: string;
    routingNumber: string;
    accountName: string;
  };
}) {
  const { userId, crypto: cryptoCurrency, network, fiat, cryptoAmount, bankAccount } = params;

  // Get quote
  const quote = await getBuyQuote({
    crypto: cryptoCurrency,
    network,
    fiat,
    amount: cryptoAmount,
    side: 'SELL',
  });

  if (!quote.success) {
    throw new Error(quote.message || 'Failed to get quote');
  }

  const orderId = `ACH_SELL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create withdrawal record
  const withdrawal = await prisma.cryptoWithdrawal.create({
    data: {
      userId,
      provider: 'ALCHEMY_PAY',
      externalId: orderId,
      amount: cryptoAmount,
      amountUsd: quote.data?.fiatAmount || 0,
      currency: cryptoCurrency.toUpperCase(),
      address: 'FIAT_OFFRAMP',
      network,
      status: 'PENDING',
      metadata: {
        fiat,
        fiatAmount: quote.data?.fiatAmount,
        bankAccount: bankAccount
          ? {
              last4: bankAccount.accountNumber.slice(-4),
              accountName: bankAccount.accountName,
            }
          : null,
        quote: quote.data,
      },
    },
  });

  return {
    withdrawal,
    quote: quote.data,
  };
}

// Handle webhook callback
export async function handleWebhook(data: {
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  crypto: string;
  cryptoAmount: number;
  fiat: string;
  fiatAmount: number;
  txHash?: string;
}) {
  const payment = await prisma.cryptoPayment.findUnique({
    where: { externalId: data.orderNo },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Map Alchemy Pay status to our status
  const statusMap: Record<string, string> = {
    PENDING: 'WAITING',
    PROCESSING: 'CONFIRMING',
    COMPLETED: 'FINISHED',
    FAILED: 'FAILED',
    CANCELLED: 'EXPIRED',
  };

  const newStatus = statusMap[data.status] || 'WAITING';

  // Update payment
  const updatedPayment = await prisma.cryptoPayment.update({
    where: { id: payment.id },
    data: {
      status: newStatus as never,
      amount: data.cryptoAmount,
      confirmedAt: newStatus === 'FINISHED' ? new Date() : undefined,
      metadata: {
        ...((payment.metadata as object) || {}),
        txHash: data.txHash,
        finalCryptoAmount: data.cryptoAmount,
        finalFiatAmount: data.fiatAmount,
      },
    },
  });

  // If payment is finished, credit user's token wallet
  if (newStatus === 'FINISHED') {
    const tokenAmount = data.fiatAmount * 10; // $1 = 10 ADV tokens

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

      await prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'EARN',
          amount: tokenAmount,
          balanceAfter: Number(wallet.balance) + tokenAmount,
          description: `Crypto purchase via Alchemy Pay (${data.crypto})`,
          metadata: { paymentId: payment.id },
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: payment.userId,
        type: 'TRANSACTION',
        title: 'Payment Completed',
        message: `Your purchase of ${data.cryptoAmount} ${data.crypto} for ${data.fiatAmount} ${data.fiat} is complete. ${tokenAmount} ADV tokens added.`,
        data: { paymentId: payment.id },
      },
    });
  }

  return updatedPayment;
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const expectedSignature = crypto
    .createHash('md5')
    .update(`${ALCHEMY_APP_ID}${payload}${timestamp}${ALCHEMY_APP_SECRET}`)
    .digest('hex');

  return expectedSignature === signature;
}
