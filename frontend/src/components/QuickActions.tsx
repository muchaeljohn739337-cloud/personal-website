"use client";

import { useSmartSuggestions } from "@/hooks/useSmartSuggestions";
import { SmartRecommendation } from "@/lib/ai-brain/ai-core.types";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * AI-Enhanced Quick Actions
 * Features:
 * - Personalized action recommendations
 * - Dynamic action ordering based on user behavior
 * - Smart suggestions for next best action
 */
export default function QuickActions() {
  const { suggestions, loading } = useSmartSuggestions("quick-actions");
  const [orderedActions, setOrderedActions] = useState<any[]>([]);

  const defaultActions = [
    {
      title: "AI Generator",
      description: "Generate text, code & images with AI",
      icon: "✨",
      href: "/ai-generator",
      color:
        "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      featured: true,
      priority: 10,
    },
    {
      title: "Buy Crypto",
      description: "Purchase cryptocurrency with USD",
      icon: "🛒",
      href: "/crypto/buy",
      color: "bg-green-500 hover:bg-green-600",
      priority: 8,
    },
    {
      title: "Withdraw Crypto",
      description: "Send crypto to external wallet",
      icon: "📤",
      href: "/crypto/withdraw",
      color: "bg-blue-500 hover:bg-blue-600",
      priority: 7,
    },
    {
      title: "Transfer Tokens",
      description: "Send tokens to another user",
      icon: "💸",
      href: "/tokens/transfer",
      color: "bg-purple-500 hover:bg-purple-600",
      priority: 6,
    },
    {
      title: "Deposit USD",
      description: "Add funds to your account",
      icon: "💳",
      href: "/payments/topup",
      color: "bg-indigo-500 hover:bg-indigo-600",
      priority: 5,
    },
    {
      title: "View Orders",
      description: "Track crypto purchase orders",
      icon: "📋",
      href: "/crypto/orders",
      color: "bg-orange-500 hover:bg-orange-600",
      priority: 4,
    },
    {
      title: "Transaction History",
      description: "View all your transactions",
      icon: "📊",
      href: "/transactions",
      color: "bg-pink-500 hover:bg-pink-600",
      priority: 3,
    },
  ];

  // Apply AI recommendations to reorder actions
  useEffect(() => {
    if (suggestions.length > 0) {
      const actionsCopy = [...defaultActions];

      // Boost priority of AI-recommended actions
      suggestions.forEach((suggestion: SmartRecommendation) => {
        const matchingAction = actionsCopy.find(
          (action) => action.href === suggestion.quickAction?.route,
        );
        if (matchingAction) {
          matchingAction.priority += suggestion.priority * 2;
          matchingAction.aiRecommended = true;
        }
      });

      // Sort by priority
      actionsCopy.sort((a, b) => b.priority - a.priority);
      setOrderedActions(actionsCopy);
    } else {
      setOrderedActions(defaultActions);
    }
  }, [suggestions]);

  const actions = orderedActions.length > 0 ? orderedActions : defaultActions;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        {!loading && suggestions.length > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            AI Personalized
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`${action.color} text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-md relative`}
          >
            {action.aiRecommended && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </span>
              </div>
            )}
            <div className="flex items-start space-x-3">
              <div className="text-3xl">{action.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                <p className="text-sm text-white/90">{action.description}</p>
              </div>
              <svg
                className="w-5 h-5 opacity-75"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
