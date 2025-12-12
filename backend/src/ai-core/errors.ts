/**
 * AI Error Types and Handlers
 */

export enum AIErrorType {
  // Provider Errors
  PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE",
  PROVIDER_RATE_LIMITED = "PROVIDER_RATE_LIMITED",
  PROVIDER_AUTH_ERROR = "PROVIDER_AUTH_ERROR",

  // Request Errors
  INVALID_INPUT = "INVALID_INPUT",
  CONTENT_FILTERED = "CONTENT_FILTERED",
  CONTEXT_TOO_LARGE = "CONTEXT_TOO_LARGE",

  // System Errors
  TIMEOUT = "TIMEOUT",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public originalError?: Error,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = "AIError";

    // Maintain proper stack trace
    if (originalError?.stack) {
      this.stack = `${this.stack}\n--- Original Error ---\n${originalError.stack}`;
    }
  }

  // Factory methods for common error types
  static providerUnavailable(provider: string, error?: Error) {
    return new AIError(AIErrorType.PROVIDER_UNAVAILABLE, `AI provider '${provider}' is currently unavailable`, error, {
      provider,
    });
  }

  static rateLimited(provider: string, retryAfter?: number) {
    return new AIError(AIErrorType.PROVIDER_RATE_LIMITED, `Rate limit exceeded for provider '${provider}'`, undefined, {
      provider,
      retryAfter,
    });
  }

  static invalidInput(message: string, field?: string) {
    return new AIError(AIErrorType.INVALID_INPUT, message, undefined, { field });
  }

  static contentFiltered(reason: string) {
    return new AIError(AIErrorType.CONTENT_FILTERED, "Content filtered by safety systems", undefined, { reason });
  }

  static contextTooLarge(maxTokens: number, requested: number) {
    return new AIError(
      AIErrorType.CONTEXT_TOO_LARGE,
      `Context window exceeded. Max: ${maxTokens}, Requested: ${requested}`,
      undefined,
      { maxTokens, requested }
    );
  }

  static fromError(error: Error): AIError {
    if (error instanceof AIError) return error;

    // Map common provider errors
    if ("status" in error) {
      const status = (error as any).status;
      if (status === 401 || status === 403) {
        return new AIError(AIErrorType.PROVIDER_AUTH_ERROR, "Authentication failed with AI provider", error);
      }
      if (status === 429) {
        return new AIError(AIErrorType.PROVIDER_RATE_LIMITED, "Rate limit exceeded", error);
      }
    }

    // Default to unknown error
    return new AIError(AIErrorType.UNKNOWN_ERROR, error.message || "Unknown AI error occurred", error);
  }
}

/**
 * Error handler middleware for AI operations
 */
export function withAIErrorHandling<T extends any[], R>(fn: (...args: T) => Promise<R>): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw AIError.fromError(error as Error);
    }
  };
}

/**
 * Retry policy for AI operations
 */
export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;

  // Whether to retry on specific error types
  retryOnError?: (error: AIError) => boolean;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  factor: 2,
  retryOnError: (error) => {
    // Retry on rate limits and transient errors
    return [AIErrorType.PROVIDER_RATE_LIMITED, AIErrorType.PROVIDER_UNAVAILABLE, AIErrorType.TIMEOUT].includes(
      error.type
    );
  },
};

export async function withRetry<T>(fn: () => Promise<T>, policy: Partial<RetryPolicy> = {}): Promise<T> {
  const fullPolicy: RetryPolicy = { ...DEFAULT_RETRY_POLICY, ...policy };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= fullPolicy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const aiError = error instanceof AIError ? error : AIError.fromError(error as Error);
      lastError = aiError;

      // Check if we should retry
      const shouldRetry =
        attempt < fullPolicy.maxRetries && (!fullPolicy.retryOnError || fullPolicy.retryOnError(aiError));

      if (!shouldRetry) break;

      // Calculate delay with exponential backoff and jitter
      const delay =
        Math.min(fullPolicy.initialDelay * Math.pow(fullPolicy.factor, attempt - 1), fullPolicy.maxDelay) *
        (0.5 + Math.random() * 0.5); // Add jitter

      console.warn(`[AI] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms`, {
        error: aiError.message,
        type: aiError.type,
        nextRetryIn: `${delay}ms`,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Unknown error occurred during retry");
}
