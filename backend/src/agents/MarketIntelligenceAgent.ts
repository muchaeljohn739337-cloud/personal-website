// Market Intelligence Agent - Crypto Market Monitoring
// Monitors crypto prices, news sentiment, and detects market crises
// Runs every 15 minutes

import axios from "axios";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class MarketIntelligenceAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "MarketIntelligenceAgent",
      enabled: true,
      schedule: "*/15 * * * *",
      retryAttempts: 3,
      timeout: 90000,
      priority: "medium",
      description: "Monitors cryptocurrency markets and detects crises",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    const startTime = Date.now();

    try {
      // Step 1: Fetch crypto prices from CoinGecko
      const prices = await this.fetchCryptoPrices();
      itemsProcessed++;

      // Step 2: Detect price anomalies
      const anomalies = await this.detectPriceAnomalies(prices);
      if (anomalies.length > 0) {
        itemsProcessed++;
      }

      // Step 3: Fetch crypto news sentiment
      const newsSentiment = await this.fetchNewsSentiment();
      itemsProcessed++;

      // Step 4: Store market intelligence data
      await this.context.prisma.market_intelligence.create({
        data: {
          id: `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: "CoinGecko+NewsAPI",
          category: "price-sentiment",
          data: {
            prices,
            anomalies,
            sentiment: newsSentiment,
            timestamp: new Date(),
          },
          sentiment: newsSentiment.overall || null,
          importance: 8,
        },
      });
      itemsProcessed++;

      // Step 5: Detect crisis conditions
      const crisisDetected = this.evaluateCrisisConditions(prices, anomalies, newsSentiment);

      if (crisisDetected) {
        await this.context.prisma.crisis_events.create({
          data: {
            id: `crisis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: "MARKET_CRISIS",
            severity: Number(this.calculateSeverity(anomalies)),
            description: `Market crisis detected: ${anomalies.length} price anomalies, sentiment: ${newsSentiment.overall}`,
            indicators: {
              anomalies,
              sentiment: newsSentiment,
              prices,
            },
          },
        });
        itemsProcessed++;

        // Alert admins
        if (this.context.io) {
          const admins = await this.context.prisma.users.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
          });

          admins.forEach((admin) => {
            this.context.io?.to(`user-${admin.id}`).emit("market:crisis", {
              type: "warning",
              title: "Market Crisis Detected",
              message: `${anomalies.length} crypto price anomalies detected`,
              severity: this.calculateSeverity(anomalies),
              timestamp: new Date(),
            });
          });
        }
      }

      // Step 6: Emit market update to all users
      if (this.context.io) {
        this.context.io.emit("market:update", {
          prices,
          anomalies: anomalies.map((a) => ({ symbol: a.symbol, change: a.changePercent })),
          sentiment: newsSentiment.overall,
          timestamp: new Date(),
        });
      }

      return {
        success: true,
        message: `Market analysis complete: ${anomalies.length} anomalies detected`,
        data: {
          prices: prices.length,
          anomalies: anomalies.length,
          sentiment: newsSentiment.overall,
          crisisDetected,
        },
        metrics: { itemsProcessed, errors, duration: Date.now() - startTime },
      };
    } catch (error: any) {
      this.context.logger.error("MarketIntelligenceAgent failed", error);
      return {
        success: false,
        message: error.message || "Market analysis failed",
        data: { error: error.message },
        metrics: { itemsProcessed, errors: errors + 1, duration: Date.now() - startTime },
      };
    }
  }

  private async fetchCryptoPrices(): Promise<any[]> {
    try {
      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: {
          ids: "bitcoin,ethereum,tether,binancecoin,cardano,ripple",
          vs_currencies: "usd",
          include_24hr_change: true,
          include_market_cap: true,
        },
        timeout: 10000,
      });

      return Object.entries(response.data).map(([id, data]: [string, any]) => ({
        symbol: id.toUpperCase(),
        price: data.usd,
        change24h: data.usd_24h_change || 0,
        marketCap: data.usd_market_cap || 0,
      }));
    } catch (error) {
      this.context.logger.error("Failed to fetch crypto prices", error);
      return [];
    }
  }

  private async detectPriceAnomalies(prices: any[]): Promise<any[]> {
    const anomalies = [];

    for (const price of prices) {
      if (Math.abs(price.change24h) > 10) {
        anomalies.push({
          symbol: price.symbol,
          changePercent: price.change24h,
          currentPrice: price.price,
          severity: Math.abs(price.change24h) > 20 ? "HIGH" : "MEDIUM",
        });
      }
    }

    return anomalies;
  }

  private async fetchNewsSentiment(): Promise<{
    overall: string;
    positive: number;
    negative: number;
    neutral: number;
  }> {
    try {
      if (!process.env.NEWS_API_KEY) {
        return { overall: "unknown", positive: 0, negative: 0, neutral: 0 };
      }

      const response = await axios.get("https://newsapi.org/v2/everything", {
        params: {
          q: "cryptocurrency OR bitcoin OR ethereum",
          sortBy: "publishedAt",
          pageSize: 20,
          apiKey: process.env.NEWS_API_KEY,
        },
        timeout: 10000,
      });

      const articles = response.data.articles || [];
      let positive = 0;
      let negative = 0;
      let neutral = 0;

      articles.forEach((article: any) => {
        const text = `${article.title} ${article.description}`.toLowerCase();

        if (text.match(/crash|drop|fall|bear|panic|crisis/)) {
          negative++;
        } else if (text.match(/bull|rise|surge|gain|rally|high/)) {
          positive++;
        } else {
          neutral++;
        }
      });

      const total = positive + negative + neutral;
      const overall = negative > positive * 1.5 ? "negative" : positive > negative * 1.5 ? "positive" : "neutral";

      return { overall, positive, negative, neutral };
    } catch (error) {
      this.context.logger.warn("Failed to fetch news sentiment", error);
      return { overall: "unknown", positive: 0, negative: 0, neutral: 0 };
    }
  }

  private evaluateCrisisConditions(prices: any[], anomalies: any[], sentiment: any): boolean {
    const highSeverityAnomalies = anomalies.filter((a) => a.severity === "HIGH").length;
    const negativeSentiment = sentiment.overall === "negative";

    return (anomalies.length >= 3 && negativeSentiment) || highSeverityAnomalies >= 2;
  }

  private calculateSeverity(anomalies: any[]): string {
    const highSeverity = anomalies.filter((a) => a.severity === "HIGH").length;

    if (highSeverity >= 3) return "CRITICAL";
    if (highSeverity >= 1 || anomalies.length >= 4) return "HIGH";
    if (anomalies.length >= 2) return "MEDIUM";
    return "LOW";
  }
}
