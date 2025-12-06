import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { serializeDecimal } from "@/lib/utils/decimal";
import { emitToUser } from "@/lib/socket";

// POST /api/admin/crypto/deposits/[id]/approve
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
  const { notes } = body;

  try {
    const deposit = await prisma.crypto_deposits.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!deposit || deposit.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid deposit" }, { status: 400 });
    }

    // Update deposit status
    await prisma.crypto_deposits.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Credit user crypto balance
    await prisma.user_crypto_balances.upsert({
      where: {
        userId_currency: {
          userId: deposit.userId,
          currency: deposit.currency,
        },
      },
      update: {
        balance: { increment: deposit.amount },
      },
      create: {
        userId: deposit.userId,
        currency: deposit.currency,
        balance: deposit.amount,
      },
    });

    // Create ledger entry
    await prisma.crypto_ledger.create({
      data: {
        userId: deposit.userId,
        type: "DEPOSIT",
        amount: deposit.amount,
        currency: deposit.currency,
        txHash: deposit.txHash,
        actorId: adminId,
        status: "APPROVED",
      },
    });

    // Create audit log
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    await prisma.audit_logs.create({
      data: {
        userId: adminId,
        action: "CRYPTO_DEPOSIT_APPROVED",
        resourceType: "CryptoDeposit",
        resourceId: id,
        details: {
          depositId: id,
          amount: serializeDecimal(deposit.amount),
          currency: deposit.currency,
          userId: deposit.userId,
          notes,
        },
        ipAddress,
      },
    });

    // Notify user via socket
    emitToUser(deposit.userId, "crypto-deposit-approved", {
      depositId: id,
      amount: serializeDecimal(deposit.amount),
      currency: deposit.currency,
      message: "Deposit successful ✅ Funds are available",
    });

    return NextResponse.json({ message: "Deposit approved" });
  } catch (error) {
    console.error("Approve deposit error:", error);
    return NextResponse.json(
      { error: "Failed to approve deposit" },
      { status: 500 }
    );
  }
}
