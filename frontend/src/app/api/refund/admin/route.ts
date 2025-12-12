import { NextRequest, NextResponse } from "next/server";

interface RefundRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

// GET - List all refund requests for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // TODO: Verify admin authentication
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Mock refund requests - replace with actual database query
    const mockRefundRequests: RefundRequest[] = [
      {
        id: "REF-1701432000000-abc123",
        userId: "user-001",
        userEmail: "john@example.com",
        userName: "John Doe",
        transactionId: "TXN-001",
        amount: 99.99,
        reason:
          "Service did not meet expectations. Features were not as advertised.",
        status: "pending",
        requestedAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: "REF-1701345600000-def456",
        userId: "user-002",
        userEmail: "jane@example.com",
        userName: "Jane Smith",
        transactionId: "TXN-002",
        amount: 199.99,
        reason: "Found a better alternative. Need to cancel subscription.",
        status: "pending",
        requestedAt: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: "REF-1701259200000-ghi789",
        userId: "user-003",
        userEmail: "bob@example.com",
        userName: "Bob Wilson",
        transactionId: "TXN-003",
        amount: 49.99,
        reason: "Billing issue - charged twice for the same period.",
        status: "approved",
        requestedAt: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        processedAt: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        processedBy: "admin@example.com",
        adminNotes: "Duplicate charge confirmed. Full refund issued.",
      },
    ];

    let filteredRequests = mockRefundRequests;
    if (status !== "all") {
      filteredRequests = mockRefundRequests.filter((r) => r.status === status);
    }

    const startIndex = (page - 1) * limit;
    const paginatedRequests = filteredRequests.slice(
      startIndex,
      startIndex + limit,
    );

    return NextResponse.json({
      refundRequests: paginatedRequests,
      pagination: {
        page,
        limit,
        total: filteredRequests.length,
        totalPages: Math.ceil(filteredRequests.length / limit),
      },
      summary: {
        pending: mockRefundRequests.filter((r) => r.status === "pending")
          .length,
        approved: mockRefundRequests.filter((r) => r.status === "approved")
          .length,
        rejected: mockRefundRequests.filter((r) => r.status === "rejected")
          .length,
        totalAmount: mockRefundRequests
          .filter((r) => r.status === "approved")
          .reduce((sum, r) => sum + r.amount, 0),
      },
    });
  } catch (error) {
    console.error("Admin refund list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch refund requests" },
      { status: 500 },
    );
  }
}

// POST - Process a refund request (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const { refundId, action, adminNotes, adminEmail } = await request.json();

    if (!refundId || !action) {
      return NextResponse.json(
        { error: "refundId and action are required" },
        { status: 400 },
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 },
      );
    }

    // TODO: Verify admin authentication
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // TODO: Update database
    // await db.refundRequests.update({
    //   where: { id: refundId },
    //   data: {
    //     status: newStatus,
    //     processedAt: new Date().toISOString(),
    //     processedBy: adminEmail,
    //     adminNotes,
    //   },
    // });

    if (action === "approve") {
      // TODO: Process actual refund via payment provider
      // await paymentProvider.refund(transactionId, amount);
      // TODO: Update user balance if applicable
      // await db.users.update({ balance: { decrement: amount } });
    }

    // TODO: Send notification to user
    // await sendEmail(userId, `refund_${newStatus}`, { refundId, adminNotes });

    return NextResponse.json({
      success: true,
      message: `Refund request ${newStatus} successfully`,
      refund: {
        id: refundId,
        status: newStatus,
        processedAt: new Date().toISOString(),
        processedBy: adminEmail || "admin",
      },
    });
  } catch (error) {
    console.error("Process refund error:", error);
    return NextResponse.json(
      { error: "Failed to process refund request" },
      { status: 500 },
    );
  }
}
