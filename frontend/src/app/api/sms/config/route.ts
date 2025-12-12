import { getBalance, getCountries, getServices } from "@/lib/smspool";
import { NextResponse } from "next/server";

/**
 * GET /api/sms/config?type=countries|services&countryId=xxx
 * Get SMS Pool configuration (countries, services, balance)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const countryId = searchParams.get("countryId");

    switch (type) {
      case "countries":
        const countries = await getCountries();
        return NextResponse.json({ countries });

      case "services":
        if (!countryId) {
          return NextResponse.json(
            { error: "Country ID is required for services" },
            { status: 400 },
          );
        }
        const services = await getServices(countryId);
        return NextResponse.json({ services });

      case "balance":
        const balance = await getBalance();
        return NextResponse.json({ balance });

      default:
        // Return all config
        const [allCountries, balanceAmount] = await Promise.all([
          getCountries(),
          getBalance(),
        ]);
        return NextResponse.json({
          countries: allCountries,
          balance: balanceAmount,
        });
    }
  } catch (error) {
    console.error("SMS config error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch SMS configuration",
      },
      { status: 500 },
    );
  }
}
