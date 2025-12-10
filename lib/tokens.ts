import { prisma } from './prismaClient';

// Token configuration
export const TOKEN_CONFIG = {
  symbol: 'ADV',
  name: 'Advancia Token',
  exchangeRate: 0.1, // 1 ADV = $0.10 USD
  bonusRate: 0.15, // 15% bonus on credits
  fees: {
    withdraw: 0.01, // 1% withdraw fee
    cashOut: 0.02, // 2% cash out fee
    transfer: 0, // Free transfers
  },
  minWithdraw: 100,
  minCashOut: 50,
};

// Tier configuration
export const TIER_CONFIG = {
  BRONZE: { points: 0, multiplier: 1.0, name: 'Bronze' },
  SILVER: { points: 1000, multiplier: 1.2, name: 'Silver' },
  GOLD: { points: 5000, multiplier: 1.5, name: 'Gold' },
  PLATINUM: { points: 15000, multiplier: 2.0, name: 'Platinum' },
  DIAMOND: { points: 50000, multiplier: 3.0, name: 'Diamond' },
};

export type TierName = keyof typeof TIER_CONFIG;

// Get or create token wallet for user
export async function getOrCreateTokenWallet(userId: string) {
  let wallet = await prisma.tokenWallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!wallet) {
    wallet = await prisma.tokenWallet.create({
      data: {
        userId,
        tokenSymbol: TOKEN_CONFIG.symbol,
        exchangeRate: TOKEN_CONFIG.exchangeRate,
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  return wallet;
}

// Add tokens to wallet
export async function addTokens(
  userId: string,
  amount: number,
  type:
    | 'EARN'
    | 'BONUS'
    | 'REWARD_CLAIM'
    | 'ACHIEVEMENT'
    | 'TIER_BONUS'
    | 'STREAK_BONUS'
    | 'REFERRAL'
    | 'TRANSFER_IN',
  description?: string,
  metadata?: Record<string, unknown>
) {
  const wallet = await getOrCreateTokenWallet(userId);
  const newBalance = Number(wallet.balance) + amount;

  const [updatedWallet, transaction] = await prisma.$transaction([
    prisma.tokenWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        lifetimeEarned: { increment: amount },
      },
    }),
    prisma.tokenTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        balanceAfter: newBalance,
        description,
        metadata: metadata as never,
        status: 'COMPLETED',
      },
    }),
  ]);

  return { wallet: updatedWallet, transaction };
}

// Deduct tokens from wallet
export async function deductTokens(
  userId: string,
  amount: number,
  type: 'WITHDRAW' | 'CASH_OUT' | 'TRANSFER_OUT' | 'PURCHASE' | 'FEE',
  description?: string,
  metadata?: Record<string, unknown>
) {
  const wallet = await getOrCreateTokenWallet(userId);
  const availableBalance = Number(wallet.balance) - Number(wallet.lockedBalance);

  if (availableBalance < amount) {
    throw new Error('Insufficient balance');
  }

  const fee =
    type === 'WITHDRAW'
      ? amount * TOKEN_CONFIG.fees.withdraw
      : type === 'CASH_OUT'
        ? amount * TOKEN_CONFIG.fees.cashOut
        : 0;
  const totalDeduction = amount + fee;
  const newBalance = Number(wallet.balance) - totalDeduction;

  const [updatedWallet, transaction] = await prisma.$transaction([
    prisma.tokenWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        lifetimeSpent: { increment: totalDeduction },
      },
    }),
    prisma.tokenTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount: -amount,
        fee,
        balanceAfter: newBalance,
        description,
        metadata: metadata as never,
        status: 'COMPLETED',
      },
    }),
  ]);

  return { wallet: updatedWallet, transaction, fee };
}

// Transfer tokens between users
export async function transferTokens(
  fromUserId: string,
  toUserId: string,
  amount: number,
  description?: string
) {
  if (fromUserId === toUserId) {
    throw new Error('Cannot transfer to yourself');
  }

  const fromWallet = await getOrCreateTokenWallet(fromUserId);
  const toWallet = await getOrCreateTokenWallet(toUserId);

  const availableBalance = Number(fromWallet.balance) - Number(fromWallet.lockedBalance);
  if (availableBalance < amount) {
    throw new Error('Insufficient balance');
  }

  const fromNewBalance = Number(fromWallet.balance) - amount;
  const toNewBalance = Number(toWallet.balance) + amount;

  const [updatedFromWallet, updatedToWallet, fromTx, toTx] = await prisma.$transaction([
    prisma.tokenWallet.update({
      where: { id: fromWallet.id },
      data: {
        balance: fromNewBalance,
        lifetimeSpent: { increment: amount },
      },
    }),
    prisma.tokenWallet.update({
      where: { id: toWallet.id },
      data: {
        balance: toNewBalance,
        lifetimeEarned: { increment: amount },
      },
    }),
    prisma.tokenTransaction.create({
      data: {
        walletId: fromWallet.id,
        type: 'TRANSFER_OUT',
        amount: -amount,
        balanceAfter: fromNewBalance,
        toUserId,
        description: description || `Transfer to user`,
        status: 'COMPLETED',
      },
    }),
    prisma.tokenTransaction.create({
      data: {
        walletId: toWallet.id,
        type: 'TRANSFER_IN',
        amount,
        balanceAfter: toNewBalance,
        fromUserId,
        description: description || `Transfer from user`,
        status: 'COMPLETED',
      },
    }),
  ]);

  return {
    fromWallet: updatedFromWallet,
    toWallet: updatedToWallet,
    fromTransaction: fromTx,
    toTransaction: toTx,
  };
}

// Calculate bonus tokens for a transaction
export function calculateBonus(amount: number, tierMultiplier: number = 1): number {
  return amount * TOKEN_CONFIG.bonusRate * tierMultiplier;
}

// Convert tokens to USD
export function tokensToUSD(tokens: number): number {
  return tokens * TOKEN_CONFIG.exchangeRate;
}

// Convert USD to tokens
export function usdToTokens(usd: number): number {
  return usd / TOKEN_CONFIG.exchangeRate;
}

// Get transaction history
export async function getTransactionHistory(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    type?: string;
  } = {}
) {
  const wallet = await prisma.tokenWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    return { transactions: [], total: 0 };
  }

  const where = {
    walletId: wallet.id,
    ...(options.type && { type: options.type as never }),
  };

  const [transactions, total] = await Promise.all([
    prisma.tokenTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 20,
      skip: options.offset || 0,
    }),
    prisma.tokenTransaction.count({ where }),
  ]);

  return { transactions, total };
}
