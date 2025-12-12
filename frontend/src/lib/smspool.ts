/**
 * SMS Pool API Integration
 * Documentation: https://www.smspool.net/api
 */

const SMSPOOL_API_KEY = process.env.SMSPOOL_API_KEY || "";
const SMSPOOL_BASE_URL = "https://api.smspool.net";

export interface SMSPoolCountry {
  ID: number;
  name: string;
  region: string;
}

export interface SMSPoolService {
  ID: number;
  name: string;
}

export interface SMSPoolOrder {
  success: number;
  number: string;
  cc: string;
  phonenumber: string;
  order_id: string;
  country: string;
  service: string;
  pool: number;
  expires: string;
  message?: string;
}

export interface SMSPoolMessage {
  success: number;
  sms: string;
  full_sms: string;
  timestamp: number;
}

/**
 * Get available countries
 */
export async function getCountries(): Promise<SMSPoolCountry[]> {
  try {
    const response = await fetch(
      `${SMSPOOL_BASE_URL}/country/retrieve_all?key=${SMSPOOL_API_KEY}`,
    );
    const data = await response.json();
    return data.countries || [];
  } catch (error) {
    console.error("SMS Pool - Failed to fetch countries:", error);
    throw new Error("Failed to fetch available countries");
  }
}

/**
 * Get available services for a country
 */
export async function getServices(
  countryId: string,
): Promise<SMSPoolService[]> {
  try {
    const response = await fetch(
      `${SMSPOOL_BASE_URL}/service/retrieve_all?key=${SMSPOOL_API_KEY}&country=${countryId}`,
    );
    const data = await response.json();
    return data.services || [];
  } catch (error) {
    console.error("SMS Pool - Failed to fetch services:", error);
    throw new Error("Failed to fetch available services");
  }
}

/**
 * Order a phone number for SMS verification
 */
export async function orderNumber(
  countryId: string,
  serviceId: string,
  pool?: number,
): Promise<SMSPoolOrder> {
  try {
    const url = new URL(`${SMSPOOL_BASE_URL}/purchase/sms`);
    url.searchParams.append("key", SMSPOOL_API_KEY);
    url.searchParams.append("country", countryId);
    url.searchParams.append("service", serviceId);
    if (pool) {
      url.searchParams.append("pool", pool.toString());
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.success !== 1) {
      throw new Error(data.message || "Failed to order number");
    }

    return data;
  } catch (error) {
    console.error("SMS Pool - Failed to order number:", error);
    throw error;
  }
}

/**
 * Check for received SMS messages
 */
export async function checkSMS(
  orderId: string,
): Promise<SMSPoolMessage | null> {
  try {
    const response = await fetch(
      `${SMSPOOL_BASE_URL}/sms/check?key=${SMSPOOL_API_KEY}&orderid=${orderId}`,
    );
    const data = await response.json();

    if (data.success === 1) {
      return {
        success: 1,
        sms: data.sms,
        full_sms: data.full_sms,
        timestamp: data.timestamp,
      };
    }

    // No SMS received yet
    return null;
  } catch (error) {
    console.error("SMS Pool - Failed to check SMS:", error);
    throw new Error("Failed to check for SMS");
  }
}

/**
 * Archive/cancel an order
 */
export async function archiveOrder(orderId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SMSPOOL_BASE_URL}/sms/cancel?key=${SMSPOOL_API_KEY}&orderid=${orderId}`,
    );
    const data = await response.json();
    return data.success === 1;
  } catch (error) {
    console.error("SMS Pool - Failed to archive order:", error);
    return false;
  }
}

/**
 * Get account balance
 */
export async function getBalance(): Promise<number> {
  try {
    const response = await fetch(
      `${SMSPOOL_BASE_URL}/request/balance?key=${SMSPOOL_API_KEY}`,
    );
    const data = await response.json();
    return parseFloat(data.balance) || 0;
  } catch (error) {
    console.error("SMS Pool - Failed to fetch balance:", error);
    return 0;
  }
}

/**
 * Helper: Extract OTP code from SMS message
 */
export function extractOTP(message: string): string | null {
  // Common OTP patterns
  const patterns = [
    /\b(\d{6})\b/, // 6-digit code
    /\b(\d{4})\b/, // 4-digit code
    /code[:\s]+(\d+)/i, // "code: 123456"
    /verification[:\s]+(\d+)/i, // "verification: 123456"
    /otp[:\s]+(\d+)/i, // "OTP: 123456"
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
