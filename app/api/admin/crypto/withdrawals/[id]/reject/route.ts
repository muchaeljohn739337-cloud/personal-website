import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { serializeDecimal } from "@/lib/utils/decimal";
import { emitToUser } from "@/lib/socket";

// POST /api/admin/crypto/withdrawals/[id]/reject
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
  const body = await req.json().catch(() => ({}));
  const { reason } = body;

  if (!reason) {
    return NextResponse.json(
      { error: "Rejection reason required" },
      { status: 400 }
    );
  }

  try {
    const withdrawal = await prisma.crypto_withdrawals.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid withdrawal" }, { status: 400 });
    }

    // Update withdrawal status
    await prisma.crypto_withdrawals.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Refund to user balance
    await prisma.user_crypto_balances.update({
      where: {
        userId_currency: {
          userId: withdrawal.userId,
          currency: withdrawal.currency,
        },
      },
      data: {
        balance: {
          increment: withdrawal.totalAmount,
        },
      },
    });

    // Create audit log
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    await prisma.audit_logs.create({
      data: {
        userId: adminId,
        action: "CRYPTO_WITHDRAWAL_REJECTED",
        resourceType: "CryptoWithdrawal",
        resourceId: id,
        details: {
          withdrawalId: id,
          amount: serializeDecimal(withdrawal.amount),
          currency: withdrawal.currency,
          userId: withdrawal.userId,
          reason,
        },
        ipAddress,
      },
    });

    // Notify user via socket
    emitToUser(withdrawal.userId, "crypto-withdrawal-rejected", {
      withdrawalId: id,
      amount: serializeDecimal(withdrawal.amount),
      currency: withdrawal.currency,
      reason,
      message: "Your withdrawal was rejected ⚠️ Try again later",
    });

    return NextResponse.json({ message: "Withdrawal rejected" });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    return NextResponse.json(
      { error: "Failed to reject withdrawal" },
      { status: 500 }
    );
  }
}
