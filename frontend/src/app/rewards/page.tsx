"use client";

import RealTimeNotifications from "@/components/RealTimeNotifications";
import RewardsDashboard from "@/components/RewardsDashboard";
import SidebarLayout from "@/components/SidebarLayout";
import { useEffect, useState } from "react";

export default function RewardsPage() {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
  }, []);

  if (!userId) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Rewards & Loyalty
              </h1>
              <p className="text-gray-600 mt-2">
                Track your rewards, achievements, and loyalty benefits
              </p>
            </div>
            <RealTimeNotifications />
          </div>

          {/* Rewards Dashboard Component */}
          <RewardsDashboard userId={userId} />

          {/* Refer & Earn Section */}
          <div className="mt-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="text-5xl mb-4">🎁</div>
                <h2 className="text-2xl font-bold mb-2">
                  Refer Friends, Earn Rewards!
                </h2>
                <p className="text-white/90 mb-4">
                  Invite your friends to join Advancia Pay and earn bonus
                  rewards for each successful referral. Both you and your friend
                  get rewarded!
                </p>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    You get $10 bonus when your friend signs up
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Your friend gets $5 welcome bonus
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Unlimited referrals - the more you refer, the more you earn!
                  </li>
                </ul>
              </div>
              <div className="flex-shrink-0">
                <button className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                  Get Your Referral Link
                </button>
              </div>
            </div>
          </div>

          {/* Achievements Gallery */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
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
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              Achievements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* First Transaction */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">🎯</div>
                <p className="font-semibold text-gray-900 text-sm">
                  First Transaction
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Complete your first transaction
                </p>
              </div>

              {/* Early Adopter */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">🌟</div>
                <p className="font-semibold text-gray-900 text-sm">
                  Early Adopter
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Join within first month
                </p>
              </div>

              {/* Big Spender */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 text-center opacity-50">
                <div className="text-4xl mb-2">💎</div>
                <p className="font-semibold text-gray-900 text-sm">
                  Big Spender
                </p>
                <p className="text-xs text-gray-600 mt-1">Spend over $1,000</p>
              </div>

              {/* Crypto Trader */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center opacity-50">
                <div className="text-4xl mb-2">₿</div>
                <p className="font-semibold text-gray-900 text-sm">
                  Crypto Trader
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Make 10 crypto trades
                </p>
              </div>

              {/* Social Butterfly */}
              <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-lg p-4 text-center opacity-50">
                <div className="text-4xl mb-2">🦋</div>
                <p className="font-semibold text-gray-900 text-sm">
                  Social Butterfly
                </p>
                <p className="text-xs text-gray-600 mt-1">Refer 5 friends</p>
              </div>

              {/* Perfect Score */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-4 text-center opacity-50">
                <div className="text-4xl mb-2">💯</div>
                <p className="font-semibold text-gray-900 text-sm">
                  Perfect Score
                </p>
                <p className="text-xs text-gray-600 mt-1">100% success rate</p>
              </div>

              {/* Loyalty Master */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 text-center opacity-50">
                <div className="text-4xl mb-2">👑</div>
                <p className="font-semibold text-gray-900 text-sm">
                  Loyalty Master
                </p>
                <p className="text-xs text-gray-600 mt-1">Active for 1 year</p>
              </div>

              {/* Platinum Member */}
              <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg p-4 text-center opacity-50">
                <div className="text-4xl mb-2">🏆</div>
                <p className="font-semibold text-gray-900 text-sm">
                  Platinum Member
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Reach Platinum tier
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-6">
              Locked achievements appear faded. Complete the requirements to
              unlock them!
            </p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
