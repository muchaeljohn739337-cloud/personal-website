import axios from "axios";
import crypto from "crypto";

/**
 * Alchemy Pay Integration Service
 * Documentation: https://docs.alchemypay.org/
 */

interface AlchemyPayConfig {
  apiKey: string;
  secretKey: string;
  merchantId: string;
  webhookSecret?: string;
  environment?: "sandbox" | "production";
}

interface CreateOrderParams {
  merchantOrderNo: string;
  orderAmount: number;
  orderCurrency: string;
  cryptoCurrency?: string;
  network?: string;
  returnUrl?: string;
  notifyUrl?: string;
  email?: string;
}

interface OrderResponse {
  orderId: string;
  merchantOrderNo: string;
  status: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  expiresAt: string;
}

class AlchemyPayService {
  private apiKey: string;
  private secretKey: string;
  private merchantId: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor(config: AlchemyPayConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.merchantId = config.merchantId;
    this.webhookSecret = config.webhookSecret || "";
    this.baseUrl =
      config.environment === "production" ? "https://api.alchemypay.org" : "https://sandbox-api.alchemypay.org";
  }

  /**
   * Generate signature for API requests
   */
  private generateSignature(params: Record<string, any>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");
    const signWithSecret = `${signString}&key=${this.secretKey}`;

    return crypto.createHash("md5").update(signWithSecret).digest("hex").toUpperCase();
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const timestamp = Date.now().toString();

    const requestData = {
      ...data,
      appId: this.apiKey,
      merchantNo: this.merchantId,
      timestamp,
    };

    // Generate signature
    const sign = this.generateSignature(requestData);
    requestData.sign = sign;

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
        },
        data: requestData,
      });

      if (response.data.returnCode !== "0000") {
        throw new Error(response.data.returnMsg || "Alchemy Pay API error");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Alchemy Pay API Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.returnMsg || "Alchemy Pay API request failed");
    }
  }

  /**
   * Create a new crypto purchase order
   */
  async createOrder(params: CreateOrderParams): Promise<OrderResponse> {
    const payload = {
      merchantOrderNo: params.merchantOrderNo,
      orderAmount: params.orderAmount.toString(),
      orderCurrency: params.orderCurrency.toUpperCase(),
      cryptoCurrency: params.cryptoCurrency?.toUpperCase() || "USDT",
      network: params.network || "TRC20",
      returnUrl: params.returnUrl,
      notifyUrl: params.notifyUrl,
      email: params.email,
    };

    const response = await this.makeRequest("POST", "/api/merchant/order/create", payload);

    return {
      orderId: response.orderId,
      merchantOrderNo: response.merchantOrderNo,
      status: response.status,
      paymentUrl: response.paymentUrl,
      amount: parseFloat(response.orderAmount),
      currency: response.orderCurrency,
      cryptoAmount: response.cryptoAmount ? parseFloat(response.cryptoAmount) : undefined,
      cryptoCurrency: response.cryptoCurrency,
      expiresAt: response.expireTime,
    };
  }

  /**
   * Query order status
   */
  async queryOrder(merchantOrderNo: string): Promise<any> {
    return await this.makeRequest("POST", "/api/merchant/order/query", {
      merchantOrderNo,
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(params: Record<string, any>, receivedSign: string): boolean {
    const { sign, ...dataToSign } = params;
    const expectedSign = this.generateSignature(dataToSign);
    return expectedSign === receivedSign;
  }

  /**
   * Get supported fiat currencies
   */
  async getSupportedFiatCurrencies(): Promise<string[]> {
    const response = await this.makeRequest("POST", "/api/merchant/query/fiat-list", {});
    return response.fiatList || [];
  }

  /**
   * Get supported crypto currencies
   */
  async getSupportedCryptoCurrencies(): Promise<any[]> {
    const response = await this.makeRequest("POST", "/api/merchant/query/crypto-list", {});
    return response.cryptoList || [];
  }

  /**
   * Get exchange rate
   */
  async getExchangeRate(fiatCurrency: string, cryptoCurrency: string, network?: string): Promise<number> {
    const response = await this.makeRequest("POST", "/api/merchant/query/rate", {
      fiatCurrency: fiatCurrency.toUpperCase(),
      cryptoCurrency: cryptoCurrency.toUpperCase(),
      network: network || "TRC20",
    });

    return parseFloat(response.rate);
  }

  /**
   * Create on-ramp order (Buy crypto with fiat)
   */
  async createOnRampOrder(params: CreateOrderParams): Promise<OrderResponse> {
    return await this.createOrder(params);
  }

  /**
   * Create off-ramp order (Sell crypto for fiat)
   */
  async createOffRampOrder(
    params: Omit<CreateOrderParams, "cryptoCurrency"> & { cryptoCurrency: string }
  ): Promise<OrderResponse> {
    const payload = {
      ...params,
      orderType: "SELL", // Off-ramp = selling crypto
    };

    return await this.createOrder(payload as CreateOrderParams);
  }
}

// Export singleton instance
export const alchemyPayService = new AlchemyPayService({
  apiKey: process.env.ALCHEMY_PAY_API_KEY || "",
  secretKey: process.env.ALCHEMY_PAY_SECRET_KEY || "",
  merchantId: process.env.ALCHEMY_PAY_MERCHANT_ID || "",
  webhookSecret: process.env.ALCHEMY_PAY_WEBHOOK_SECRET || "",
  environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export default AlchemyPayService;
