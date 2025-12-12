// Transaction Audit Agent - Transaction Verification & Reconciliation
// Audits transactions for anomalies, verifies blockchain confirmations
// Runs every 2 hours

import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class TransactionAuditAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "TransactionAuditAgent",
      enabled: true,
      schedule: "0 */2 * * *", // Every 2 hours
      retryAttempts: 3,
      timeout: 300000,
      priority: "high",
      description: "Transaction anomaly detection",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;

    try {
      // Get transactions from last 2 hours
      const transactions = await this.context.prisma.transactions.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        },
      });

      const anomalies: any[] = [];

      for (const tx of transactions) {
        itemsProcessed++;

        // Check for stuck pending transactions (> 30 minutes)
        if (
          tx.status === "PENDING" &&
          tx.createdAt < new Date(Date.now() - 30 * 60 * 1000)
        ) {
          anomalies.push({
            transaction_id: tx.id,
            type: "stuck_pending",
            message: "Transaction stuck in pending state",
          });
        }

        // Check for large amounts
        if (tx.amount.toNumber() > 10000) {
          anomalies.push({
            transaction_id: tx.id,
            type: "large_amount",
            message: `Large transaction: ${tx.amount}`,
            userId: tx.userId,
          });
        }

        // Check for rapid sequential transactions
        const recentUserTxs = await this.context.prisma.transactions.count({
          where: {
            userId: tx.userId,
            createdAt: {
              gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
            },
          },
        });

        if (recentUserTxs > 5) {
          anomalies.push({
            transaction_id: tx.id,
            type: "rapid_transactions",
            message: `${recentUserTxs} transactions in 10 minutes`,
            userId: tx.userId,
          });
        }
      }

      // Log anomalies
      if (anomalies.length > 0) {
        this.context.logger.warn("Transaction anomalies detected", {
          count: anomalies.length,
          anomalies,
        });

        // Create audit logs
        for (const anomaly of anomalies) {
          await SafePrisma.create("audit_logs", {
            userId: anomaly.userId || null,
            action: `ANOMALY_DETECTED_${anomaly.type.toUpperCase()}`,
            resourceType: "Transaction",
            resourceId: anomaly.transactionId || "unknown",
          });
        }

        if (this.context.io) {
          this.context.io.emit("audit:alert", {
            agent: this.config.name,
            anomalies,
            timestamp: new Date(),
          });
        }
      }

      return {
        success: true,
        message: "Transaction audit completed",
        data: {
          transactionsAudited: transactions.length,
          anomaliesFound: anomalies.length,
          anomalies,
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
