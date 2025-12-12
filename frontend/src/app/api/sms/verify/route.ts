import { archiveOrder, checkSMS, orderNumber } from "@/lib/smspool";
import { NextResponse } from "next/server";

/**
 * POST /api/sms/verify
 * Send SMS verification code using SMS Pool
 */
export async function POST(request: Request) {
  try {
    const { phoneNumber, countryId, serviceId } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Order a number from SMS Pool
    const order = await orderNumber(
      countryId || "US", // Default to US
      serviceId || "any", // Default to any service
      1, // Pool 1 (can be configured)
    );

    // Store order details in session/database for verification later
    // For now, return the order details
    return NextResponse.json({
      success: true,
      orderId: order.order_id,
      phoneNumber: order.phonenumber,
      expires: order.expires,
      message: "Verification number ordered. Check for SMS in 30-60 seconds.",
    });
  } catch (error) {
    console.error("SMS verification error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send SMS verification",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/sms/verify?orderId=xxx
 * Check for received SMS verification code
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Check for SMS
    const sms = await checkSMS(orderId);

    if (!sms) {
      return NextResponse.json({
        success: false,
        message: "No SMS received yet. Please wait...",
      });
    }

    return NextResponse.json({
      success: true,
      code: sms.sms,
      fullMessage: sms.full_sms,
      timestamp: sms.timestamp,
    });
  } catch (error) {
    console.error("SMS check error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check SMS",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/sms/verify?orderId=xxx
 * Cancel/archive SMS order
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const cancelled = await archiveOrder(orderId);

    return NextResponse.json({
      success: cancelled,
      message: cancelled
        ? "Order cancelled successfully"
        : "Failed to cancel order",
    });
  } catch (error) {
    console.error("SMS cancel error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel order",
      },
      { status: 500 },
    );
  }
}
