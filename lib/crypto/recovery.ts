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
   * Redirects user to specified position after recovery
   */
  async recoverPayment(
    paymentId: string,
    reason: string,
    redirectTo?: string
  ): Promise<CryptoRecovery & { redirectUrl?: string }> {
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
          metadata: {
            ...((payment.metadata as Record<string, unknown>) || {}),
            recoveryId: recovery.id,
            recoveredAt: new Date().toISOString(),
            redirectTo: redirectTo || '/dashboard/payments',
          },
        },
      });

      // If refund is needed, process it
      if (recovery.recoveryType === 'REFUND') {
        // Add refund logic here
        // This would integrate with payment provider APIs
        // Refund would be processed and user redirected to specified position
      }

      recovery.status = 'COMPLETED';
      recovery.completedAt = new Date();

      // Determine redirect URL
      const redirectUrl =
        redirectTo ||
        (payment.metadata &&
        typeof payment.metadata === 'object' &&
        !Array.isArray(payment.metadata) &&
        'redirectTo' in payment.metadata
          ? String((payment.metadata as Record<string, unknown>).redirectTo)
          : null) ||
        (process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments`
          : '/dashboard/payments');

      // Log recovery (if AdminAction model exists)
      // Note: Using userId as adminId for system-initiated recoveries
      try {
        const { logAdminAction } = await import('../admin');
        await logAdminAction(payment.userId, {
          action: 'CRYPTO_RECOVERY',
          targetUserId: payment.userId,
          description: `Recovered payment ${paymentId}: ${reason}`,
          metadata: {
            recoveryId: recovery.id,
            paymentId,
            amount: recovery.amount,
            currency: recovery.currency,
            type: 'CRYPTO_RECOVERY',
            redirectUrl,
          },
        });
      } catch (error) {
        // Log to console if logging fails
        console.log(`[CryptoRecovery] Recovered payment ${paymentId}: ${reason}`);
      }

      return { ...recovery, redirectUrl };
    } catch (error) {
      recovery.status = 'FAILED';
      throw error;
    }
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
