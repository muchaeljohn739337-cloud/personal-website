import { Decimal } from '@prisma/client/runtime/library';
import { Job } from 'bullmq';
import prisma from '../prismaClient';
import { logger } from '../utils/logger';

/**
 * Transaction Worker - Processes transaction-related jobs
 */
export async function processTransactionJob(job: Job) {
  const { transactionId, amount, type, userId } = job.data;
  
  logger.info(`Processing transaction job for transaction ${transactionId}`);

  try {
    // Update job progress
    await job.updateProgress(10);

    // Fetch transaction details
    const transaction = await prisma.transactions.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    await job.updateProgress(30);

    // Process based on type
    switch (type) {
      case 'DEPOSIT':
        await processDeposit(transactionId, userId, amount);
        break;
      case 'WITHDRAWAL':
        await processWithdrawal(transactionId, userId, amount);
        break;
      case 'TRANSFER':
        await processTransfer(transactionId, userId, amount, job.data.toUserId);
        break;
      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }

    await job.updateProgress(80);

    // Update transaction status
    await prisma.transactions.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    await job.updateProgress(100);

    logger.info(`Transaction ${transactionId} completed successfully`);
  } catch (error) {
    logger.error(`Transaction processing failed for ${transactionId}:`, error);
    
    // Update transaction to failed
    await prisma.transactions.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        updatedAt: new Date(),
      },
    }).catch(() => {});

    throw error;
  }
}

async function processDeposit(transactionId: string, userId: string, amount: number) {
  // Update user balance
  await prisma.users.update({
    where: { id: userId },
    data: {
      usdBalance: {
        increment: new Decimal(amount),
      },
    },
  });

  logger.info(`Deposited ${amount} to user ${userId}`);
}

async function processWithdrawal(transactionId: string, userId: string, amount: number) {
  // Verify sufficient balance
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { usdBalance: true },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  if (user.usdBalance.toNumber() < amount) {
    throw new Error(`Insufficient balance for withdrawal`);
  }

  // Deduct from user balance
  await prisma.users.update({
    where: { id: userId },
    data: {
      usdBalance: {
        decrement: new Decimal(amount),
      },
    },
  });

  logger.info(`Withdrew ${amount} from user ${userId}`);
}

async function processTransfer(transactionId: string, fromUserId: string, amount: number, toUserId: string) {
  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Verify sender has sufficient balance
    const sender = await tx.users.findUnique({
      where: { id: fromUserId },
      select: { usdBalance: true },
    });

    if (!sender) {
      throw new Error(`Sender ${fromUserId} not found`);
    }

    if (sender.usdBalance.toNumber() < amount) {
      throw new Error(`Insufficient balance for transfer`);
    }

    // Deduct from sender
    await tx.users.update({
      where: { id: fromUserId },
      data: {
        usdBalance: {
          decrement: new Decimal(amount),
        },
      },
    });

    // Add to recipient
    await tx.users.update({
      where: { id: toUserId },
      data: {
        usdBalance: {
          increment: new Decimal(amount),
        },
      },
    });
  });

  logger.info(`Transferred ${amount} from ${fromUserId} to ${toUserId}`);
}
