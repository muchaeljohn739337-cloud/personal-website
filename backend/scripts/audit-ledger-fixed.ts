import prisma from "../src/prismaClient";
import { Decimal } from "@prisma/client/runtime/library";

interface AuditResult {
  userId: string;
  walletId: string;
  calculatedBalance: string;
  recordedBalance: string;
  discrepancy: string;
  transactionCount: number;
}

async function auditWalletConsistency(): Promise<AuditResult[]> {
  const issues: AuditResult[] = [];

  console.log("🔍 Starting wallet consistency audit...\n");

  // Get all wallets
  const wallets = await prisma.tokenWallet.findMany();

  console.log(`📊 Auditing ${wallets.length} wallets...\n`);

  for (const wallet of wallets) {
    // Get transactions for this wallet separately (no relation needed)
    const transactions = await prisma.tokenTransaction.findMany({
      where: {
        walletId: wallet.id,
        status: "completed",
      },
    });

    // Calculate balance from transactions
    let calculatedBalance = new Decimal(0);

    for (const txn of transactions) {
      const amount = new Decimal(txn.amount);

      // Credit transactions (add to balance)
      if (["bonus", "earn", "credit", "deposit", "reward"].includes(txn.type)) {
        calculatedBalance = calculatedBalance.plus(amount);
      }
      // Debit transactions (subtract from balance)
      else if (
        ["withdraw", "cashout", "debit", "transfer", "payment"].includes(
          txn.type
        )
      ) {
        calculatedBalance = calculatedBalance.minus(amount);
      }
      // Unknown transaction types - log warning
      else {
        console.warn(
          `⚠️  Unknown transaction type: ${txn.type} for wallet ${wallet.id}`
        );
      }
    }

    // Compare with recorded balance
    const recordedBalance = new Decimal(wallet.balance);
    const discrepancy = recordedBalance.minus(calculatedBalance);

    if (!discrepancy.equals(0)) {
      issues.push({
        userId: wallet.userId,
        walletId: wallet.id,
        calculatedBalance: calculatedBalance.toString(),
        recordedBalance: recordedBalance.toString(),
        discrepancy: discrepancy.toString(),
        transactionCount: transactions.length,
      });

      console.warn(`⚠️  Discrepancy found for wallet ${wallet.id}:`);
      console.warn(`   User ID: ${wallet.userId}`);
      console.warn(`   Recorded: ${recordedBalance.toString()}`);
      console.warn(`   Calculated: ${calculatedBalance.toString()}`);
      console.warn(`   Difference: ${discrepancy.toString()}`);
      console.warn(`   Transactions: ${transactions.length}\n`);
    }
  }

  return issues;
}

// Run audit and generate report
auditWalletConsistency()
  .then((issues) => {
    console.log("\n" + "=".repeat(60));

    if (issues.length === 0) {
      console.log("✅ AUDIT COMPLETE: All wallets are consistent!");
      console.log("No discrepancies found.");
    } else {
      console.error(
        `❌ AUDIT COMPLETE: Found ${issues.length} inconsistent wallet(s)\n`
      );

      console.log("Summary of Issues:");
      console.table(
        issues.map((i) => ({
          WalletID: i.walletId.substring(0, 8) + "...",
          UserID: i.userId.substring(0, 8) + "...",
          Recorded: i.recordedBalance,
          Calculated: i.calculatedBalance,
          Discrepancy: i.discrepancy,
          TxnCount: i.transactionCount,
        }))
      );

      console.log("\n💡 Recommendations:");
      console.log("1. Review transaction history for affected wallets");
      console.log("2. Check for missing or duplicate transactions");
      console.log("3. Verify transaction types are correctly categorized");
      console.log("4. Consider manual balance correction if needed");

      console.log("\n📄 Full details exported above");
    }

    console.log("=".repeat(60) + "\n");
    process.exit(issues.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("❌ Audit failed with error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
