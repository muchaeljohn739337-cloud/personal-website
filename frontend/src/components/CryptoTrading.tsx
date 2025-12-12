"use client";

import { useEffect, useState } from "react";

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

export default function CryptoTrading() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoPrice | null>(
    null,
  );
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/crypto/prices`);
      if (!response.ok) throw new Error("Failed to fetch prices");

      const data = await response.json();
      setPrices(data);

      // Set default selection
      if (!selectedCrypto && data.length > 0) {
        setSelectedCrypto(data[0]);
      }
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (selectedCrypto && value) {
      const cryptoAmount = parseFloat(value);
      if (!isNaN(cryptoAmount)) {
        setUsdAmount((cryptoAmount * selectedCrypto.price).toFixed(2));
      }
    } else {
      setUsdAmount("");
    }
  };

  const handleUsdAmountChange = (value: string) => {
    setUsdAmount(value);
    if (selectedCrypto && value) {
      const usd = parseFloat(value);
      if (!isNaN(usd)) {
        setAmount((usd / selectedCrypto.price).toFixed(8));
      }
    } else {
      setAmount("");
    }
  };

  const handleTrade = async () => {
    if (!selectedCrypto || !amount) {
      setMessage("⚠️ Please enter an amount");
      return;
    }

    const cryptoAmount = parseFloat(amount);
    if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
      setMessage("⚠️ Please enter a valid amount");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`${API_URL}/api/crypto/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          currency: selectedCrypto.symbol,
          amount: cryptoAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Transaction failed");
      }

      const data = await response.json();
      setMessage(
        `✅ Successfully ${action === "buy" ? "bought" : "sold"} ${cryptoAmount} ${
          selectedCrypto.symbol
        }`,
      );
      setAmount("");
      setUsdAmount("");

      // Refresh balances
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        Crypto Trading
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crypto Selection */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-gray-700 mb-3">
            Select Cryptocurrency
          </h3>
          {prices.map((crypto) => (
            <button
              key={crypto.symbol}
              onClick={() => setSelectedCrypto(crypto)}
              className={`w-full p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedCrypto?.symbol === crypto.symbol
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{crypto.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900">{crypto.symbol}</p>
                  <p className="text-sm text-gray-500">{crypto.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ${crypto.price.toLocaleString()}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      crypto.change24h >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {crypto.change24h >= 0 ? "+" : ""}
                    {crypto.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Trading Form */}
        <div className="lg:col-span-2">
          {selectedCrypto ? (
            <div className="space-y-6">
              {/* Buy/Sell Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("buy")}
                  className={`flex-1 py-3 px-6 rounded-lg font-bold transition-colors ${
                    action === "buy"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setAction("sell")}
                  className={`flex-1 py-3 px-6 rounded-lg font-bold transition-colors ${
                    action === "sell"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Selected Crypto Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{selectedCrypto.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedCrypto.name}
                    </h3>
                    <p className="text-gray-600">{selectedCrypto.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${selectedCrypto.price.toLocaleString()}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        selectedCrypto.change24h >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedCrypto.change24h >= 0 ? "↗" : "↘"}{" "}
                      {selectedCrypto.change24h.toFixed(2)}% (24h)
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({selectedCrypto.symbol})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00000000"
                    step="0.00000001"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>

                <div className="text-center">
                  <svg
                    className="w-6 h-6 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={(e) => handleUsdAmountChange(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.startsWith("✅")
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Trade Button */}
              <button
                onClick={handleTrade}
                disabled={loading || !amount}
                className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-colors ${
                  action === "buy"
                    ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                    : "bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  `${action === "buy" ? "Buy" : "Sell"} ${selectedCrypto.symbol}`
                )}
              </button>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Note:</strong> Trades are executed at current
                  market prices. Fees may apply based on your tier level.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Loading crypto prices...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
