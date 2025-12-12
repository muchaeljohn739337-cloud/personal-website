import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Cron job executed at:", new Date().toISOString());

    // Example cron job tasks:
    // 1. Health check
    // 2. Database cleanup
    // 3. Send scheduled notifications
    // 4. Update cached data
    // 5. Process queued tasks

    // Example: Call backend health check
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const healthResponse = await fetch(`${backendUrl}/api/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!healthResponse.ok) {
          console.warn("⚠️ Backend health check failed during cron job");
        } else {
          console.log("✅ Backend health check passed");
        }
      } catch (error) {
        console.warn(
          "⚠️ Could not reach backend during cron job:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    // Add your custom cron logic here
    // Examples:
    // - Clean up old sessions
    // - Send daily reports
    // - Process pending transactions
    // - Update analytics data

    return NextResponse.json({
      message: "Hello Cron!",
      timestamp: new Date().toISOString(),
      status: "success",
      executed: true,
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    message: "Cron endpoint available. Use POST with Bearer token.",
    status: "ready",
  });
}
