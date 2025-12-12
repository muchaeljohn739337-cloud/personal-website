// Crypto Recovery Agent - Stale/Failed Transaction Recovery
// Monitors and recovers stuck crypto transactions
// Runs every 15 minutes

import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class CryptoRecoveryAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "CryptoRecoveryAgent",
      enabled: true,
      schedule: "*/15 * * * *", // Every 15 minutes
      retryAttempts: 5,
      timeout: 120000,
      priority: "high",
      description: "Stuck crypto transaction recovery",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    let recovered = 0;

    try {
      // Find stuck pending transactions (> 1 hour old)
      const stuckTransactions = await this.context.prisma.transactions.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lt: new Date(Date.now() - 60 * 60 * 1000), // Older than 1 hour
          },
        },
      });

      for (const tx of stuckTransactions) {
        itemsProcessed++;

        try {
          // Attempt recovery logic
          // In production, this would check blockchain status, retry failed transactions, etc.

          // For now, mark as failed if too old (> 24 hours)
          if (tx.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            await this.context.prisma.transactions.update({
              where: { id: tx.id },
              data: {
                status: "FAILED",
              },
            });

            recovered++;

            this.context.logger.info("Marked stuck transaction as failed", {
              transaction_id: tx.id,
              age: Date.now() - tx.createdAt.getTime(),
            });
          } else {
            // Log for monitoring
            this.context.logger.warn("Stuck transaction detected", {
              transaction_id: tx.id,
              age: Date.now() - tx.createdAt.getTime(),
              amount: tx.amount.toString(),
            });
          }
        } catch (txError) {
          errors++;
          this.context.logger.error(
            `Failed to process transaction ${tx.id}`,
            txError
          );
        }
      }

      // Find failed transactions with retryable errors
      const failedRetryable = await this.context.prisma.transactions.findMany({
        where: {
          status: "FAILED",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        take: 10, // Process max 10 at a time
      });

      for (const tx of failedRetryable) {
        itemsProcessed++;

        // In production, implement retry logic here
        this.context.logger.info("Retryable transaction found", {
          transaction_id: tx.id,
        });
      }

      if (this.context.io && recovered > 0) {
        this.context.io.emit("recovery:update", {
          agent: this.config.name,
          recovered,
          timestamp: new Date(),
        });
      }

      return {
        success: true,
        message: "Crypto recovery check completed",
        data: {
          stuckTransactions: stuckTransactions.length,
          recovered,
          failedRetryable: failedRetryable.length,
        },
        metrics: {
          duration: 0,
          itemsProcessed,
          errors,
        },
      };
    } catch (error) {
      errors++;
      throw error;
    }
  }
}
