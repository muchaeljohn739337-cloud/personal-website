import { NextRequest, NextResponse } from "next/server";

interface RefundEligibility {
  eligible: boolean;
  reason: string;
  daysRemaining: number;
  purchaseDate: string;
  amount: number;
  transactionId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, transactionId } = await request.json();

    if (!userId || !transactionId) {
      return NextResponse.json(
        { error: "userId and transactionId are required" },
        { status: 400 },
      );
    }

    // Mock transaction lookup - replace with actual database query
    const mockTransaction = {
      id: transactionId,
      userId,
      purchaseDate: new Date(
        Date.now() - 15 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 15 days ago
      amount: 99.99,
      type: "subscription",
      status: "completed",
      refundRequested: false,
      refundProcessed: false,
    };

    const purchaseDate = new Date(mockTransaction.purchaseDate);
    const now = new Date();
    const daysSincePurchase = Math.floor(
      (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const REFUND_WINDOW_DAYS = 30;
    const daysRemaining = Math.max(0, REFUND_WINDOW_DAYS - daysSincePurchase);

    let eligible = true;
    let reason = "Eligible for full refund under 30-day money-back guarantee";

    // Check eligibility conditions
    if (daysSincePurchase > REFUND_WINDOW_DAYS) {
      eligible = false;
      reason = `Refund window expired. Purchase was ${daysSincePurchase} days ago (30-day limit exceeded)`;
    } else if (mockTransaction.refundRequested) {
      eligible = false;
      reason = "A refund request is already pending for this transaction";
    } else if (mockTransaction.refundProcessed) {
      eligible = false;
      reason = "This transaction has already been refunded";
    } else if (mockTransaction.type === "crypto") {
      eligible = false;
      reason = "Cryptocurrency purchases are non-refundable";
    }

    const eligibility: RefundEligibility = {
      eligible,
      reason,
      daysRemaining,
      purchaseDate: mockTransaction.purchaseDate,
      amount: mockTransaction.amount,
      transactionId: mockTransaction.id,
    };

    return NextResponse.json(eligibility);
  } catch (error) {
    console.error("Refund eligibility check error:", error);
    return NextResponse.json(
      { error: "Failed to check refund eligibility" },
      { status: 500 },
    );
  }
}
