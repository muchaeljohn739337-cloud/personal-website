// User Support Agent - Automated Customer Support
// Monitors support tickets, auto-responds to common issues
// Runs every 10 minutes

import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class UserSupportAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "UserSupportAgent",
      enabled: true,
      schedule: "*/10 * * * *", // Every 10 minutes
      retryAttempts: 3,
      timeout: 90000,
      priority: "medium",
      description: "Customer support automation",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    let autoResponses = 0;

    try {
      // Check for new/unread notifications that might need follow-up
      const pendingNotifications =
        await this.context.prisma.notifications.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
            },
          },
          take: 50,
        });

      // Check for users with failed transactions
      const failedTransactions =
        await this.context.prisma.transactions.findMany({
          where: {
            status: "FAILED",
            createdAt: {
              gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
            },
          },
        });

      // Send support notifications for failed transactions
      for (const tx of failedTransactions) {
        itemsProcessed++;

        try {
          // Check if user already has a notification about this
          const existingNotif =
            await this.context.prisma.notifications.findFirst({
              where: {
                userId: tx.userId,
                message: {
                  contains: `transaction ${tx.id}`,
                },
              },
            });

          if (!existingNotif) {
            await SafePrisma.create("notifications", {
              userId: tx.userId,
              type: "TRANSACTION_FAILED",
              category: "transaction",
              title: "Transaction Failed",
              message: `Your transaction ${tx.id} failed. Our support team is investigating. You can retry or contact support for assistance.`,
            });

            autoResponses++;

            if (this.context.io) {
              this.context.io.to(tx.userId).emit("notification", {
                type: "TRANSACTION_FAILED",
                message: `Transaction failed - ID: ${tx.id}`,
                timestamp: new Date(),
              });
            }
          }
        } catch (notifError) {
          errors++;
          this.context.logger.error(
            `Failed to create support notification for tx ${tx.id}`,
            notifError
          );
        }
      }

      // Check for users with pending KYC
      const pendingKyc = await this.context.prisma.users.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (pendingKyc > 10) {
        this.context.logger.warn("High KYC backlog", {
          count: pendingKyc,
        });

        if (this.context.io) {
          this.context.io.emit("support:alert", {
            agent: this.config.name,
            type: "kyc_backlog",
            count: pendingKyc,
            timestamp: new Date(),
          });
        }
      }

      itemsProcessed += pendingNotifications.length;

      return {
        success: true,
        message: "User support check completed",
        data: {
          pendingNotifications: pendingNotifications.length,
          failedTransactions: failedTransactions.length,
          autoResponses,
          pendingKyc,
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
