/**
 * Crypto Price Service - CoinGecko API Integration
 * Fetches real-time cryptocurrency prices with caching
 */

import axios from "axios";

interface CryptoPrice {
  symbol: string;
  name: string;
  usd: number;
  usd_24h_change: number;
  last_updated: string;
}

interface PriceCache {
  [key: string]: {
    price: CryptoPrice;
    timestamp: number;
  };
}

class CryptoPriceService {
  private cache: PriceCache = {};
  private cacheExpiry = 60000; // 1 minute cache
  private apiUrl = "https://api.coingecko.com/api/v3";
  private rateLimit = {
    lastRequest: 0,
    minInterval: 1000, // 1 second between requests (free tier limit)
  };

  // CoinGecko ID mapping
  private coinMapping: { [key: string]: string } = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tether",
    TRUMP: "maga", // Example - replace with actual coin ID
    LTC: "litecoin",
    BNB: "binancecoin",
    SOL: "solana",
    ADA: "cardano",
    XRP: "ripple",
    DOT: "polkadot",
  };

  /**
   * Get current price for a single cryptocurrency
   */
  async getPrice(symbol: string): Promise<CryptoPrice | null> {
    const cached = this.cache[symbol];
    const now = Date.now();

    // Return cached price if still valid
    if (cached && now - cached.timestamp < this.cacheExpiry) {
      return cached.price;
    }

    try {
      // Rate limiting
      await this.enforceRateLimit();

      const coinId = this.coinMapping[symbol.toUpperCase()];
      if (!coinId) {
        console.warn(`No CoinGecko mapping for ${symbol}`);
        return null;
      }

      const response = await axios.get(`${this.apiUrl}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: "usd",
          include_24hr_change: true,
          include_last_updated_at: true,
        },
        timeout: 5000,
      });

      const data = response.data[coinId];
      if (!data) {
        return null;
      }

      const price: CryptoPrice = {
        symbol: symbol.toUpperCase(),
        name: coinId,
        usd: data.usd,
        usd_24h_change: data.usd_24h_change || 0,
        last_updated: new Date(data.last_updated_at * 1000).toISOString(),
      };

      // Cache the result
      this.cache[symbol] = {
        price,
        timestamp: now,
      };

      return price;
    } catch (error: any) {
      console.error(`Error fetching price for ${symbol}:`, error.message);

      // Return cached price even if expired on error
      if (cached) {
        console.log(`Using stale cache for ${symbol}`);
        return cached.price;
      }

      return null;
    }
  }

  /**
   * Get prices for multiple cryptocurrencies in one request
   */
  async getPrices(symbols: string[]): Promise<{ [key: string]: CryptoPrice }> {
    const results: { [key: string]: CryptoPrice } = {};
    const now = Date.now();
    const uncachedSymbols: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const cached = this.cache[symbol];
      if (cached && now - cached.timestamp < this.cacheExpiry) {
        results[symbol] = cached.price;
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // Fetch uncached prices
    if (uncachedSymbols.length > 0) {
      try {
        await this.enforceRateLimit();

        const coinIds = uncachedSymbols
          .map((s) => this.coinMapping[s.toUpperCase()])
          .filter(Boolean)
          .join(",");

        if (!coinIds) {
          return results;
        }

        const response = await axios.get(`${this.apiUrl}/simple/price`, {
          params: {
            ids: coinIds,
            vs_currencies: "usd",
            include_24hr_change: true,
            include_last_updated_at: true,
          },
          timeout: 5000,
        });

        for (const symbol of uncachedSymbols) {
          const coinId = this.coinMapping[symbol.toUpperCase()];
          const data = response.data[coinId];

          if (data) {
            const price: CryptoPrice = {
              symbol: symbol.toUpperCase(),
              name: coinId,
              usd: data.usd,
              usd_24h_change: data.usd_24h_change || 0,
              last_updated: new Date(data.last_updated_at * 1000).toISOString(),
            };

            results[symbol] = price;
            this.cache[symbol] = { price, timestamp: now };
          }
        }
      } catch (error: any) {
        console.error("Error fetching multiple prices:", error.message);

        // Use stale cache for failed requests
        for (const symbol of uncachedSymbols) {
          const cached = this.cache[symbol];
          if (cached) {
            results[symbol] = cached.price;
          }
        }
      }
    }

    return results;
  }

  /**
   * Get market data with volume, market cap, etc.
   */
  async getMarketData(symbol: string) {
    try {
      await this.enforceRateLimit();

      const coinId = this.coinMapping[symbol.toUpperCase()];
      if (!coinId) {
        return null;
      }

      const response = await axios.get(`${this.apiUrl}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false,
        },
        timeout: 5000,
      });

      return {
        id: response.data.id,
        symbol: response.data.symbol.toUpperCase(),
        name: response.data.name,
        image: response.data.image?.small,
        current_price: response.data.market_data?.current_price?.usd,
        market_cap: response.data.market_data?.market_cap?.usd,
        total_volume: response.data.market_data?.total_volume?.usd,
        price_change_24h:
          response.data.market_data?.price_change_percentage_24h,
        price_change_7d: response.data.market_data?.price_change_percentage_7d,
        price_change_30d:
          response.data.market_data?.price_change_percentage_30d,
        circulating_supply: response.data.market_data?.circulating_supply,
        total_supply: response.data.market_data?.total_supply,
        ath: response.data.market_data?.ath?.usd,
        atl: response.data.market_data?.atl?.usd,
      };
    } catch (error: any) {
      console.error(`Error fetching market data for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Enforce rate limiting to comply with CoinGecko free tier
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimit.lastRequest;

    if (timeSinceLastRequest < this.rateLimit.minInterval) {
      const waitTime = this.rateLimit.minInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.rateLimit.lastRequest = Date.now();
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Object.entries(this.cache);

    return {
      totalEntries: entries.length,
      validEntries: entries.filter(
        ([, v]) => now - v.timestamp < this.cacheExpiry
      ).length,
      staleEntries: entries.filter(
        ([, v]) => now - v.timestamp >= this.cacheExpiry
      ).length,
    };
  }
}

// Export singleton instance
export const cryptoPriceService = new CryptoPriceService();
