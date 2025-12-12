/**
 * SafePrisma Usage Examples
 *
 * These are real-world examples showing how to use SafePrisma
 * in different scenarios across your application.
 */

import { SafePrisma } from "../src/ai-expansion/validators/SafePrisma";

// ============================================================================
// EXAMPLE 1: User Login - Create Audit Log
// ============================================================================

export async function logUserLogin(
  userId: string,
  ipAddress: string,
  userAgent: string
) {
  /**
   * ✅ CORRECT WAY: Use SafePrisma
   * - Automatically adds id (crypto.randomUUID())
   * - Automatically adds updatedAt (new Date())
   * - Better error messages if something goes wrong
   */

  try {
    await SafePrisma.create("audit_logs", {
      userId,
      action: "USER_LOGIN",
      resourceType: "user",
      resourceId: userId,
      ipAddress,
      userAgent,
      metadata: {
        timestamp: new Date(),
        loginMethod: "password",
        deviceType: "web",
      },
    });

    console.log("✅ Login audit log created successfully");
  } catch (error: any) {
    console.error("❌ Failed to create audit log:", error.message);
    // Error message includes model name, full data, and original error
  }
}

// ============================================================================
// EXAMPLE 2: Transaction Failed - Send Notification
// ============================================================================

export async function notifyTransactionFailed(
  userId: string,
  transactionId: string,
  errorReason: string
) {
  /**
   * ✅ SafePrisma for notifications
   * - No need to manually add id
   * - No need to manually add updatedAt
   * - Just provide the business data
   */

  try {
    await SafePrisma.create("notifications", {
      userId,
      type: "TRANSACTION_FAILED",
      category: "transaction",
      title: "Transaction Failed",
      message: `Your transaction ${transactionId} failed: ${errorReason}`,
      // id and updatedAt added automatically!
    });

    console.log(`✅ Notification sent to user ${userId}`);
  } catch (error: any) {
    console.error("❌ Failed to send notification:", error.message);
  }
}

// ============================================================================
// EXAMPLE 3: Daily Login Rewards - Create Many
// ============================================================================

export async function distributeDailyRewards(userIds: string[]) {
  /**
   * ✅ SafePrisma.createMany for batch operations
   * - Automatically adds id to each record
   * - Automatically adds updatedAt to each record
   * - skipDuplicates: true prevents errors if run twice
   */

  const rewardData = userIds.map((userId) => ({
    userId,
    amount: 100,
    title: "Daily Login Bonus",
    description: "Thank you for logging in today!",
    type: "DAILY_LOGIN",
    status: "PENDING",
  }));

  try {
    const result = await SafePrisma.createMany("rewards", rewardData);
    console.log(`✅ Created ${result.count} daily rewards`);
    return result.count;
  } catch (error: any) {
    console.error("❌ Failed to create rewards:", error.message);
    return 0;
  }
}

// ============================================================================
// EXAMPLE 4: Update Wallet Balance - Upsert
// ============================================================================

export async function addTokensToWallet(userId: string, amount: number) {
  /**
   * ✅ SafePrisma.upsert
   * - If wallet exists: increment balance
   * - If wallet doesn't exist: create with initial balance
   * - Automatically adds id and updatedAt when creating
   */

  try {
    const wallet = await SafePrisma.upsert(
      "token_wallets",
      { userId }, // Find by this
      { userId, balance: amount }, // Create if not found (id added auto)
      { balance: { increment: amount } } // Update if found (updatedAt added auto)
    );

    console.log(`✅ Wallet updated: ${wallet.balance} tokens`);
    return wallet;
  } catch (error: any) {
    console.error("❌ Failed to update wallet:", error.message);
    return null;
  }
}

// ============================================================================
// EXAMPLE 5: Security Alert - Log Suspicious Activity
// ============================================================================

export async function logSuspiciousActivity(
  userId: string | null,
  activityType: string,
  details: Record<string, any>
) {
  /**
   * ✅ SafePrisma for security audit logs
   * - userId can be null for anonymous suspicious activity
   * - metadata can store any structured data
   * - Automatically tracked with timestamp
   */

  try {
    await SafePrisma.create("audit_logs", {
      userId,
      action: "SUSPICIOUS_ACTIVITY_DETECTED",
      resourceType: "Security",
      resourceId: userId || "anonymous",
      ipAddress: details.ipAddress || "0.0.0.0",
      userAgent: details.userAgent || "Unknown",
      metadata: {
        activityType,
        severity: "HIGH",
        details,
        flaggedAt: new Date(),
        requiresReview: true,
      },
    });

    console.log("✅ Suspicious activity logged");
  } catch (error: any) {
    console.error("❌ Failed to log suspicious activity:", error.message);
  }
}

// ============================================================================
// EXAMPLE 6: Agent Execution - Log Agent Activity
// ============================================================================

export async function logAgentExecution(
  agentName: string,
  action: string,
  results: {
    itemsProcessed: number;
    errors: number;
    duration: number;
  }
) {
  /**
   * ✅ SafePrisma for agent audit logs
   * - userId is null (system agent)
   * - resourceType: 'agent'
   * - resourceId: agent name
   * - Store execution metrics in metadata
   */

  try {
    await SafePrisma.create("audit_logs", {
      userId: null, // System agent, no user
      action,
      resourceType: "agent",
      resourceId: agentName,
      ipAddress: "127.0.0.1",
      userAgent: agentName,
      metadata: {
        agent: agentName,
        itemsProcessed: results.itemsProcessed,
        errors: results.errors,
        duration: results.duration,
        executedAt: new Date(),
      },
    });

    console.log(`✅ Agent ${agentName} execution logged`);
  } catch (error: any) {
    console.error("❌ Failed to log agent execution:", error.message);
  }
}

// ============================================================================
// EXAMPLE 7: KYC Verification - Create Verification Record
// ============================================================================

export async function createKYCVerification(
  userId: string,
  documentType: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
) {
  /**
   * ✅ SafePrisma for KYC records
   * - Automatically generates unique verification ID
   * - Tracks creation and update timestamps
   * - Stores verification details in metadata
   */

  try {
    await SafePrisma.create("user_kyc", {
      userId,
      status,
      tier: 1,
      verifiedAt: status === "APPROVED" ? new Date() : null,
      metadata: {
        documentType,
        submittedAt: new Date(),
        reviewStatus: status,
      },
    });

    console.log(`✅ KYC verification created for user ${userId}`);
  } catch (error: any) {
    console.error("❌ Failed to create KYC verification:", error.message);
  }
}

// ============================================================================
// EXAMPLE 8: Blockchain Transaction - Create Transaction Record
// ============================================================================

export async function recordBlockchainTransaction(
  userId: string,
  txHash: string,
  blockchain: string,
  amount: number
) {
  /**
   * ✅ SafePrisma for blockchain transactions
   * - Stores transaction hash for verification
   * - Links to user account
   * - Tracks status and metadata
   */

  try {
    await SafePrisma.create("transactions", {
      userId,
      amount,
      type: "DEPOSIT",
      status: "PENDING",
      blockchain,
      txHash,
      metadata: {
        recordedAt: new Date(),
        requiresVerification: true,
        confirmations: 0,
      },
    });

    console.log(`✅ Blockchain transaction recorded: ${txHash}`);
  } catch (error: any) {
    console.error("❌ Failed to record transaction:", error.message);
  }
}

// ============================================================================
// EXAMPLE 9: Support Ticket - Create Ticket
// ============================================================================

export async function createSupportTicket(
  userId: string,
  subject: string,
  description: string,
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
) {
  /**
   * ✅ SafePrisma for support tickets
   * - Auto-generates ticket ID
   * - Sets initial status
   * - Tracks creation time
   */

  try {
    const ticket = await SafePrisma.create("support_tickets", {
      userId,
      subject,
      description,
      priority,
      status: "OPEN",
      category: "GENERAL",
      // id added automatically - becomes the ticket number!
    });

    console.log(`✅ Support ticket created: ${ticket.id}`);
    return ticket;
  } catch (error: any) {
    console.error("❌ Failed to create support ticket:", error.message);
    return null;
  }
}

// ============================================================================
// EXAMPLE 10: Validate Model Before Using
// ============================================================================

export function validateModelExists(modelName: string): boolean {
  /**
   * ✅ Check if a model exists before using it
   * - Prevents runtime errors
   * - Useful for dynamic model operations
   */

  if (SafePrisma.isValidModel(modelName)) {
    console.log(`✅ Model '${modelName}' exists`);
    return true;
  } else {
    console.log(`❌ Model '${modelName}' does not exist`);
    console.log("Valid models:", SafePrisma.getValidModels());
    return false;
  }
}

// ============================================================================
// COMPARISON: OLD WAY vs NEW WAY
// ============================================================================

/**
 * ❌ OLD WAY (Don't do this anymore!)
 */
export async function createAuditLogOldWay(
  prisma: any,
  userId: string,
  action: string
) {
  // You had to manually add id, updatedAt, handle errors yourself
  const crypto = await import("crypto");

  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(), // ❌ Manual
        userId,
        action,
        resourceType: "user", // ❌ Easy to forget required fields
        resourceId: userId,
        ipAddress: "127.0.0.1",
        userAgent: "Unknown",
        updatedAt: new Date(), // ❌ Manual
      },
    });
  } catch (error: any) {
    // ❌ Generic error message, hard to debug
    console.error("Create failed:", error.message);
  }
}

/**
 * ✅ NEW WAY (Always use this!)
 */
export async function createAuditLogNewWay(userId: string, action: string) {
  // SafePrisma handles id, updatedAt, and gives better errors
  try {
    await SafePrisma.create("audit_logs", {
      userId,
      action,
      resourceType: "user",
      resourceId: userId,
      ipAddress: "127.0.0.1",
      userAgent: "Unknown",
      // ✅ id and updatedAt added automatically!
    });
  } catch (error: any) {
    // ✅ Error includes model name, full data, and original error
    console.error("SafePrisma error:", error.message);
  }
}

// ============================================================================
// USAGE IN EXPRESS ROUTES
// ============================================================================

/**
 * Example: Using SafePrisma in an Express route handler
 */
export const exampleRouteHandler = async (req: any, res: any) => {
  const { userId } = req.user;
  const { amount } = req.body;

  try {
    // Log the API request
    await SafePrisma.create("audit_logs", {
      userId,
      action: "API_TOKEN_PURCHASE",
      resourceType: "transaction",
      resourceId: `request-${Date.now()}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: {
        amount,
        endpoint: req.path,
        method: req.method,
      },
    });

    // Process the transaction
    const wallet = await SafePrisma.upsert(
      "token_wallets",
      { userId },
      { userId, balance: amount },
      { balance: { increment: amount } }
    );

    // Send success notification
    await SafePrisma.create("notifications", {
      userId,
      type: "TOKENS_PURCHASED",
      category: "transaction",
      title: "Tokens Added",
      message: `${amount} tokens added to your wallet`,
    });

    res.json({ success: true, balance: wallet.balance });
  } catch (error: any) {
    console.error("Route error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * KEY TAKEAWAYS:
 *
 * 1. ✅ ALWAYS import SafePrisma in new code
 * 2. ✅ Use SafePrisma.create() instead of prisma.MODEL.create()
 * 3. ✅ SafePrisma auto-adds id and updatedAt - don't pass them manually
 * 4. ✅ Better error messages help with debugging
 * 5. ✅ Use createMany for batch operations
 * 6. ✅ Use upsert for create-or-update logic
 * 7. ✅ Store extra context in metadata field
 * 8. ✅ Always include resourceType and resourceId for audit logs
 *
 * MODELS THAT REQUIRE ID (auto-added by SafePrisma):
 * - audit_logs
 * - rewards
 * - user_tiers
 * - support_tickets
 * - health_readings
 * - medbeds_bookings
 *
 * MODELS WITHOUT updatedAt (SafePrisma skips it):
 * - token_transactions
 *
 * For all other models, SafePrisma adds both id and updatedAt automatically!
 */
