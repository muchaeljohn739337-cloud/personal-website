import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { serializeDecimal } from "@/lib/utils/decimal";
import { emitToUser } from "@/lib/socket";
import { executeBlockchainTransaction } from "@/lib/blockchain";

// POST /api/admin/crypto/withdrawals/[id]/approve
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminCheck = await requireAdmin(authResult.user);
  if (!adminCheck.success) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = params;
  const adminId = authResult.user.userId;

  try {
    const withdrawal = await prisma.crypto_withdrawals.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid withdrawal" }, { status: 400 });
    }

    // Execute blockchain transaction
    const txHash = await executeBlockchainTransaction(
      withdrawal.currency,
      withdrawal.sourceWallet,
      withdrawal.destinationWallet,
      withdrawal.amount.toString()
    );

    // Update withdrawal
    await prisma.crypto_withdrawals.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        txHash,
      },
    });

    // Create ledger entry
    await prisma.crypto_ledger.create({
      data: {
        userId: withdrawal.userId,
        type: "WITHDRAWAL",
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        txHash,
        actorId: adminId,
        status: "APPROVED",
      },
    });

    // Create audit log
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    await prisma.audit_logs.create({
      data: {
        userId: adminId,
        action: "CRYPTO_WITHDRAWAL_APPROVED",
        resourceType: "CryptoWithdrawal",
        resourceId: id,
        details: {
          withdrawalId: id,
          amount: serializeDecimal(withdrawal.amount),
          currency: withdrawal.currency,
          userId: withdrawal.userId,
          txHash,
        },
        ipAddress,
      },
    });

    // Notify user via socket
    emitToUser(withdrawal.userId, "crypto-withdrawal-approved", {
      withdrawalId: id,
      amount: serializeDecimal(withdrawal.amount),
      currency: withdrawal.currency,
      txHash,
      message: "Withdrawal successful ✅ Funds have been sent",
    });

    return NextResponse.json({ message: "Withdrawal approved", txHash });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    return NextResponse.json(
      { error: "Failed to approve withdrawal" },
      { status: 500 }
    );
  }
}
