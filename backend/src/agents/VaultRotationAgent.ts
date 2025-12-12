import { createNotification } from "../services/notificationService";
import { vaultService } from "../services/VaultService";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class VaultRotationAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "VaultRotationAgent",
      enabled: true,
      schedule: "0 2 * * *", // Daily at 2 AM UTC
      retryAttempts: 3,
      timeout: 300000, // 5 minutes
      priority: "high",
      description: "Rotates vault secrets automatically",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let errors = 0;

    this.context.logger.info("Starting secret rotation check");

    try {
      // Get secrets that need rotation
      const secretsDue = await vaultService.getSecretsForRotation();
      itemsProcessed++;

      if (secretsDue.length === 0) {
        this.context.logger.info("No secrets due for rotation");
        return {
          success: true,
          message: "No secrets due for rotation",
          metrics: {
            duration: Date.now() - startTime,
            itemsProcessed: 1,
            errors: 0,
          },
        };
      }

      this.context.logger.info(`Found ${secretsDue.length} secret(s) due for rotation`);

      // Find all admin users
      const admins = await this.context.prisma.users.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true },
      });
      itemsProcessed++;

      if (admins.length === 0) {
        this.context.logger.warn("No admin users found to notify");
        return {
          success: false,
          message: "No admin users found to notify",
          data: { secretsCount: secretsDue.length },
          metrics: {
            duration: Date.now() - startTime,
            itemsProcessed: 2,
            errors: 1,
          },
        };
      }

      this.context.logger.info(`Notifying ${admins.length} admin(s)`);

      // Notify each admin
      for (const admin of admins) {
        try {
          // Emit real-time Socket.IO alert
          if (this.context.io) {
            this.context.io.to(`user-${admin.id}`).emit("vault:rotation-alert", {
              count: secretsDue.length,
              secrets: secretsDue.map((s: any) => ({
                key: s.key,
                lastRotated: s.last_rotated,
                rotationPolicy: s.rotationPolicy,
              })),
              timestamp: new Date(),
            });
          }

          // Create notification in database
          await createNotification({
            userId: admin.id,
            type: "in-app",
            message: `🔄 Secret Rotation Alert: ${secretsDue.length} secret(s) require rotation`,
          });
          itemsProcessed++;

          this.context.logger.info(`Notified admin: ${admin.email}`);
        } catch (notifyError) {
          this.context.logger.error(`Failed to notify admin ${admin.email}`, notifyError);
          errors++;
        }
      }

      // Create audit logs for each secret
      for (const secret of secretsDue) {
        try {
          await this.context.prisma.vault_audit_logs.create({
            data: {
              id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              user_id: admins[0].id,
              action: "ROTATION_CHECK_DUE",
              secret_key: secret.key,
              ip_address: "system",
              user_agent: "VaultRotationAgent",
              success: true,
              mfa_verified: false,
            },
          });
          itemsProcessed++;
        } catch (auditError) {
          this.context.logger.error(`Failed to create audit log for ${secret.key}`, auditError);
          errors++;
        }
      }

      this.context.logger.info(`Rotation check completed. ${secretsDue.length} alert(s) sent`);

      return {
        success: errors === 0,
        message: `Rotation check completed. ${secretsDue.length} alert(s) sent`,
        data: {
          secretsCount: secretsDue.length,
          adminsNotified: admins.length,
        },
        metrics: {
          duration: Date.now() - startTime,
          itemsProcessed,
          errors,
        },
      };
    } catch (error) {
      this.context.logger.error("Execution failed", error);
      return {
        success: false,
        message: "Execution failed",
        data: { error: error instanceof Error ? error.message : String(error) },
        metrics: {
          duration: Date.now() - startTime,
          itemsProcessed,
          errors: errors + 1,
        },
      };
    }
  }
}

export default VaultRotationAgent;
