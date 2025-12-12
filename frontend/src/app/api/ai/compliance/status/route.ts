import { NextRequest, NextResponse } from "next/server";

/**
 * AI Compliance: Compliance Status
 * GET /api/ai/compliance/status
 *
 * Returns overall compliance status and pending items
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    // TODO: Fetch from compliance database
    // Aggregate compliance status across all categories

    return NextResponse.json({
      overall: "compliant",
      categories: {
        KYC: {
          status: "compliant",
          lastCheck: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          nextReview: new Date(
            Date.now() + 23 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        AML: {
          status: "compliant",
          lastCheck: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          nextReview: new Date(
            Date.now() + 27 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        REGULATORY: {
          status: "pending",
          lastCheck: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          pendingActions: 1,
          description: "Annual compliance filing due",
        },
      },
      pendingAlerts: Math.floor(Math.random() * 3),
      lastFullAudit: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      nextScheduledAudit: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Compliance status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance status" },
      { status: 500 },
    );
  }
}
