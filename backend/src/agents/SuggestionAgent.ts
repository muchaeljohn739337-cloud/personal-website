// Suggestion Agent - Personalized AI Recommendations
// Analyzes user patterns and suggests features/optimizations
// Runs every 4 hours

import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class SuggestionAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "SuggestionAgent",
      enabled: true,
      schedule: "0 */4 * * *",
      retryAttempts: 3,
      timeout: 120000,
      priority: "medium",
      description: "Generates personalized AI suggestions for users",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    const startTime = Date.now();

    try {
      // Step 1: Get active users (logged in last 7 days)
      const activeUsers = await this.context.prisma.users.findMany({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
        take: 100,
      });
      itemsProcessed++;

      let suggestionsCreated = 0;

      // Step 2: Analyze each user and generate suggestions
      for (const user of activeUsers) {
        // Get user preferences
        const preferences = await this.context.prisma.user_preferences.findMany({
          where: { user_id: user.id },
        });

        // Get user's recent transactions
        const recentTransactions = await this.context.prisma.transactions.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        });

        itemsProcessed++;

        // Generate suggestions based on activity
        const suggestions = this.generateSuggestions(user, preferences, recentTransactions);

        // Create AISuggestion entries
        for (const suggestion of suggestions) {
          await this.context.prisma.ai_suggestions.create({
            data: {
              id: `sugg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              user_id: user.id,
              type: suggestion.type,
              content: suggestion.content,
              accepted: false,
            },
          });
          suggestionsCreated++;
          itemsProcessed++;
        }

        // Send suggestions via Socket.IO if user is online
        if (suggestions.length > 0 && this.context.io) {
          this.context.io.to(`user-${user.id}`).emit("ai:suggestions", {
            type: "info",
            title: "New AI Recommendations",
            message: `${suggestions.length} personalized suggestions ready`,
            suggestions: suggestions.map((s) => ({
              type: s.type,
              content: s.content,
              priority: s.priority,
            })),
            timestamp: new Date(),
          });
        }
      }

      // Step 3: Create audit log
      await SafePrisma.create("audit_logs", {
        userId: null,
        action: "AI_SUGGESTIONS_GENERATED",
        resourceType: "agent",
        resourceId: this.config.name,
        ipAddress: "127.0.0.1",
        userAgent: "SuggestionAgent",
        metadata: {
          agent: this.config.name,
          usersAnalyzed: activeUsers.length,
          suggestionsCreated,
        },
      });
      itemsProcessed++;

      return {
        success: true,
        message: `Generated ${suggestionsCreated} suggestions for ${activeUsers.length} users`,
        data: {
          usersAnalyzed: activeUsers.length,
          suggestionsCreated,
        },
        metrics: { itemsProcessed, errors, duration: Date.now() - startTime },
      };
    } catch (error: any) {
      this.context.logger.error("SuggestionAgent failed", error);
      return {
        success: false,
        message: error.message || "Suggestion generation failed",
        data: { error: error.message },
        metrics: {
          itemsProcessed,
          errors: errors + 1,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  private generateSuggestions(user: any, preferences: any[], recentTransactions: number): any[] {
    const suggestions: any[] = [];

    // Suggestion 1: Enable 2FA if not active
    const has2FA = preferences.find((p) => p.preferenceKey === "twoFactorEnabled");
    if (!has2FA || has2FA.preferenceValue === "false") {
      suggestions.push({
        type: "SECURITY",
        content: "Enable Two-Factor Authentication (2FA) to secure your account with an extra layer of protection.",
        priority: "HIGH",
        metadata: {
          action: "enable-2fa",
          reason: "security-enhancement",
        },
      });
    }

    // Suggestion 2: Set up notifications
    const hasNotifications = preferences.find((p) => p.preferenceKey === "notificationsEnabled");
    if (!hasNotifications) {
      suggestions.push({
        type: "FEATURE",
        content: "Stay updated with real-time notifications for transactions, rewards, and important updates.",
        priority: "MEDIUM",
        metadata: {
          action: "enable-notifications",
          reason: "engagement",
        },
      });
    }

    // Suggestion 3: Explore rewards if active user
    if (recentTransactions >= 5) {
      suggestions.push({
        type: "FEATURE",
        content:
          "You have ${recentTransactions} recent transactions! Check your Rewards dashboard to see available bonuses.",
        priority: "MEDIUM",
        metadata: {
          action: "view-rewards",
          reason: "engagement",
          transactions: recentTransactions,
        },
      });
    }

    // Suggestion 4: Complete profile if incomplete
    if (user.role === "USER" && preferences.length < 3) {
      suggestions.push({
        type: "OPTIMIZATION",
        content: "Complete your profile preferences to get personalized recommendations and better support.",
        priority: "LOW",
        metadata: {
          action: "complete-profile",
          reason: "personalization",
        },
      });
    }

    // Suggestion 5: Verify email if not verified
    const emailVerified = preferences.find((p) => p.preferenceKey === "emailVerified");
    if (!emailVerified || emailVerified.preferenceValue === "false") {
      suggestions.push({
        type: "SECURITY",
        content: "Verify your email address to enable account recovery and important security notifications.",
        priority: "HIGH",
        metadata: {
          action: "verify-email",
          reason: "security",
        },
      });
    }

    // Suggestion 6: Explore crypto features
    if (recentTransactions === 0 && user.role === "USER") {
      suggestions.push({
        type: "FEATURE",
        content:
          "Explore our cryptocurrency features: buy, sell, and track your crypto assets with real-time market data.",
        priority: "LOW",
        metadata: {
          action: "explore-crypto",
          reason: "feature-discovery",
        },
      });
    }

    return suggestions;
  }
}
