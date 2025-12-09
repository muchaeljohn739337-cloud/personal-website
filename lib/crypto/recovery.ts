/**
 * Crypto Recovery System
 * Handles crypto payment recovery and legitimacy verification
 */

import { prisma } from '../prismaClient';

export interface CryptoRecovery {
  id: string;
  paymentId: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  recoveryType: 'EXPIRED' | 'STUCK' | 'FAILED' | 'REFUND';
  amount: number;
  currency: string;
  reason: string;
  createdAt: Date;
  completedAt?: Date;
}

class CryptoRecoverySystem {
  /**
   * Recover expired or stuck crypto payments
   */
  async recoverPayment(paymentId: string, reason: string): Promise<CryptoRecovery> {
    const payment = await prisma.cryptoPayment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const recovery: CryptoRecovery = {
      id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentId,
      userId: payment.userId,
      status: 'PENDING',
      recoveryType: this.determineRecoveryType(payment.status),
      amount: Number(payment.amountUsd),
      currency: payment.currency,
      reason,
      createdAt: new Date(),
    };

    // Process recovery
    try {
      recovery.status = 'PROCESSING';

      // Update payment status
      await prisma.cryptoPayment.update({
        where: { id: paymentId },
        data: {
          status: recovery.recoveryType === 'REFUND' ? 'REFUNDED' : 'EXPIRED',
        },
      });

      // If refund is needed, process it
      if (recovery.recoveryType === 'REFUND') {
        // Add refund logic here
        // This would integrate with payment provider APIs
      }

      recovery.status = 'COMPLETED';
      recovery.completedAt = new Date();

      // Log recovery (if AdminAction model exists)
      try {
        const { logAdminAction } = await import('../admin');
        await logAdminAction('system', {
          action: 'USER_UPDATE',
          description: `Recovered payment ${paymentId}: ${reason}`,
          metadata: {
            recoveryId: recovery.id,
            paymentId,
            amount: recovery.amount,
            currency: recovery.currency,
            type: 'CRYPTO_RECOVERY',
          },
        });
      } catch (error) {
        // Log to console if logging fails
        console.log(`[CryptoRecovery] Recovered payment ${paymentId}: ${reason}`);
      }
    } catch (error) {
      recovery.status = 'FAILED';
      throw error;
    }

    return recovery;
  }

  /**
   * Determine recovery type from payment status
   */
  private determineRecoveryType(status: string): CryptoRecovery['recoveryType'] {
    if (status === 'EXPIRED') return 'EXPIRED';
    if (status === 'WAITING' || status === 'CONFIRMING') return 'STUCK';
    if (status === 'FAILED') return 'FAILED';
    return 'REFUND';
  }

  /**
   * Auto-recover expired payments
   */
  async autoRecoverExpiredPayments(): Promise<number> {
    const expiredPayments = await prisma.cryptoPayment.findMany({
      where: {
        status: 'WAITING',
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    let recovered = 0;

    for (const payment of expiredPayments) {
      try {
        await this.recoverPayment(payment.id, 'Auto-recovery: Payment expired without completion');
        recovered++;
      } catch (error) {
        console.error(`[CryptoRecovery] Failed to recover payment ${payment.id}:`, error);
      }
    }

    return recovered;
  }

  /**
   * Verify crypto payment legitimacy
   */
  async verifyPaymentLegitimacy(paymentId: string): Promise<{
    legitimate: boolean;
    score: number;
    flags: string[];
  }> {
    const payment = await prisma.cryptoPayment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      return { legitimate: false, score: 0, flags: ['Payment not found'] };
    }

    let score = 100;
    const flags: string[] = [];

    // Check payment age
    const ageInHours = (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageInHours > 24) {
      score -= 10;
      flags.push('Payment is older than 24 hours');
    }

    // Check user verification
    if (!payment.user.isVerified) {
      score -= 20;
      flags.push('User is not verified');
    }

    // Check payment amount
    if (Number(payment.amountUsd) > 10000) {
      score -= 15;
      flags.push('Large payment amount - requires additional verification');
    }

    // Check payment status
    if (payment.status === 'FAILED' || payment.status === 'EXPIRED') {
      score -= 30;
      flags.push(`Payment status: ${payment.status}`);
    }

    return {
      legitimate: score >= 70,
      score,
      flags,
    };
  }
}

// Singleton instance
let recoveryInstance: CryptoRecoverySystem | null = null;

export function getCryptoRecoverySystem(): CryptoRecoverySystem {
  if (!recoveryInstance) {
    recoveryInstance = new CryptoRecoverySystem();
  }
  return recoveryInstance;
}
