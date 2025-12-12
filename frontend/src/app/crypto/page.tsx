"use client";

import CryptoTrading from "@/components/CryptoTrading";
import RealTimeNotifications from "@/components/RealTimeNotifications";
import SidebarLayout from "@/components/SidebarLayout";

export default function CryptoPage() {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-8 h-8 text-blue-600"
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
                Cryptocurrency Trading
              </h1>
              <p className="text-gray-600 mt-2">
                Buy and sell cryptocurrencies at competitive rates
              </p>
            </div>
            <RealTimeNotifications />
          </div>

          {/* Trading Component */}
          <CryptoTrading />

          {/* Market Information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Why Trade with Us */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Why Trade with Us
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">
                      Competitive Rates
                    </p>
                    <p className="text-sm text-gray-600">
                      Real-time market prices with transparent fees
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Instant Trading</p>
                    <p className="text-sm text-gray-600">
                      Execute trades immediately at current market prices
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Secure Storage</p>
                    <p className="text-sm text-gray-600">
                      Your crypto assets are protected with industry-leading
                      security
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">24/7 Support</p>
                    <p className="text-sm text-gray-600">
                      Get help whenever you need it from our support team
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Trading Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Trading Tips
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">💡</span>
                  <span>
                    <strong>Start small:</strong> Begin with small amounts to
                    understand the market
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">📊</span>
                  <span>
                    <strong>Watch trends:</strong> Monitor 24-hour price changes
                    before trading
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">⚖️</span>
                  <span>
                    <strong>Diversify:</strong> Don&apos;t put all funds into a
                    single cryptocurrency
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">🎯</span>
                  <span>
                    <strong>Set limits:</strong> Know your budget and stick to
                    your investment plan
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">📚</span>
                  <span>
                    <strong>Stay informed:</strong> Keep up with crypto news and
                    market updates
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  ⚠️ Risk Warning
                </h3>
                <p className="text-sm text-red-800">
                  Cryptocurrency trading carries a high level of risk and may
                  not be suitable for all investors. The value of
                  cryptocurrencies can be extremely volatile, and you may lose
                  some or all of your investment. Before trading, please ensure
                  you understand the risks involved and consider seeking
                  independent financial advice if needed. Never invest more than
                  you can afford to lose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
