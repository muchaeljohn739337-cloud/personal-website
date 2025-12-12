import axios from "axios";
import crypto from "crypto";

/**
 * Crypto.com Pay Integration Service
 * Documentation: https://pay-docs.crypto.com/
 */

interface CryptoComConfig {
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
  environment?: "sandbox" | "production";
}

interface CreatePaymentParams {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

interface PaymentResponse {
  paymentId: string;
  status: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  expiresAt: string;
}

class CryptoComService {
  private apiKey: string;
  private secretKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor(config: CryptoComConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret || "";
    this.baseUrl =
      config.environment === "production" ? "https://pay.crypto.com/api/v1" : "https://sandbox-pay.crypto.com/api/v1";
  }

  /**
   * Generate HMAC signature for API requests
   */
  private generateSignature(timestamp: number, method: string, path: string, body: string): string {
    const message = `${timestamp}${method}${path}${body}`;
    return crypto.createHmac("sha256", this.secretKey).update(message).digest("hex");
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const timestamp = Date.now();
    const path = `/api/v1${endpoint}`;
    const body = data ? JSON.stringify(data) : "";
    const signature = this.generateSignature(timestamp, method.toUpperCase(), path, body);

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
          "X-TIMESTAMP": timestamp.toString(),
          "X-SIGNATURE": signature,
        },
        data,
      });

      return response.data;
    } catch (error: any) {
      console.error("Crypto.com API Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Crypto.com API request failed");
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const payload = {
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      order_id: params.orderId,
      description: params.description || `Payment for order ${params.orderId}`,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
    };

    const response = await this.makeRequest("POST", "/payments", payload);

    return {
      paymentId: response.id,
      status: response.status,
      paymentUrl: response.payment_url,
      amount: response.amount,
      currency: response.currency,
      expiresAt: response.expires_at,
    };
  }

  /**
   * Get payment status
   */
  async getPayment(paymentId: string): Promise<any> {
    return await this.makeRequest("GET", `/payments/${paymentId}`);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto.createHmac("sha256", this.webhookSecret).update(payload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<string[]> {
    const response = await this.makeRequest("GET", "/currencies");
    return response.currencies || [];
  }

  /**
   * Get exchange rate
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const response = await this.makeRequest("GET", `/rates/${fromCurrency}/${toCurrency}`);
    return response.rate;
  }
}

// Export singleton instance
export const cryptoComService = new CryptoComService({
  apiKey: process.env.CRYPTO_COM_API_KEY || "",
  secretKey: process.env.CRYPTO_COM_SECRET_KEY || "",
  webhookSecret: process.env.CRYPTO_COM_WEBHOOK_SECRET || "",
  environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export default CryptoComService;
