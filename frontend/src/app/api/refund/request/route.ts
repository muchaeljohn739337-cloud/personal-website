import { NextRequest, NextResponse } from "next/server";

interface RefundRequest {
  id: string;
  userId: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, transactionId, reason } = await request.json();

    if (!userId || !transactionId) {
      return NextResponse.json(
        { error: "userId and transactionId are required" },
        { status: 400 },
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            "Please provide a reason for the refund (minimum 10 characters)",
        },
        { status: 400 },
      );
    }

    // Check eligibility first
    const eligibilityCheck = await checkEligibility(userId, transactionId);
    if (!eligibilityCheck.eligible) {
      return NextResponse.json(
        { error: eligibilityCheck.reason },
        { status: 400 },
      );
    }

    // Create refund request
    const refundRequest: RefundRequest = {
      id: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      transactionId,
      amount: eligibilityCheck.amount,
      reason: reason.trim(),
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    // TODO: Save to database
    // await db.refundRequests.create(refundRequest);

    // TODO: Send notification to admin
    // await notifyAdmin('new_refund_request', refundRequest);

    // TODO: Send confirmation email to user
    // await sendEmail(userId, 'refund_request_received', refundRequest);

    return NextResponse.json({
      success: true,
      message:
        "Refund request submitted successfully. You will receive an email confirmation shortly.",
      refundRequest: {
        id: refundRequest.id,
        status: refundRequest.status,
        amount: refundRequest.amount,
        estimatedProcessingTime: "3-5 business days",
      },
    });
  } catch (error) {
    console.error("Refund request error:", error);
    return NextResponse.json(
      { error: "Failed to submit refund request" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Mock refund requests - replace with actual database query
    const mockRefundRequests: RefundRequest[] = [
      {
        id: "REF-1234567890-abc123",
        userId,
        transactionId: "TXN-001",
        amount: 99.99,
        reason: "Service did not meet expectations",
        status: "pending",
        requestedAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ];

    return NextResponse.json({
      refundRequests: mockRefundRequests,
      total: mockRefundRequests.length,
    });
  } catch (error) {
    console.error("Get refund requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch refund requests" },
      { status: 500 },
    );
  }
}

async function checkEligibility(userId: string, transactionId: string) {
  // Mock eligibility check - in production, call the actual endpoint or shared logic
  const purchaseDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysSincePurchase = Math.floor(
    (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    eligible: daysSincePurchase <= 30,
    reason:
      daysSincePurchase <= 30 ? "Eligible for refund" : "Refund window expired",
    amount: 99.99,
  };
}
