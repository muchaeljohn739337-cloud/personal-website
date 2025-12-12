import * as Sentry from "@sentry/nextjs";
import { replayIntegration } from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Release tracking
  release: process.env.npm_package_version || "1.0.0",

  environment: process.env.NODE_ENV || "development",

  // Error filtering - ignore external/third-party errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out Web3Auth SDK errors (external library/browser extension)
    if (error && typeof error === "object" && "message" in error) {
      const message = String(error.message || "");
      
      // Web3Auth related errors - likely from browser extensions or third-party scripts
      if (
        message.includes("Wallet is not ready") ||
        message.includes("failed to fetch project configurations") ||
        message.includes("Project not found") ||
        message.includes("Web3Auth") ||
        message.includes("correct client ID and network")
      ) {
        console.warn("[Sentry] Filtered external Web3Auth error:", message);
        return null; // Don't send to Sentry
      }
    }

    // Filter out common browser extension errors
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        const exMessage = exception.value || "";
        
        // Browser extension injected errors
        if (
          exMessage.includes("extension://") ||
          exMessage.includes("chrome-extension://") ||
          exMessage.includes("moz-extension://") ||
          (exMessage.includes("Cannot read properties of undefined") && exMessage.includes("ethereum"))
        ) {
          console.warn("[Sentry] Filtered browser extension error:", exMessage);
          return null;
        }
      }
    }

    // Filter by stack trace - ignore errors from third-party scripts
    if (event.exception?.values?.[0]?.stacktrace?.frames) {
      const frames = event.exception.values[0].stacktrace.frames;
      const hasExternalFrame = frames.some((frame) => {
        const filename = frame.filename || "";
        return (
          filename.includes("web3auth") ||
          filename.includes("extension://") ||
          filename.includes("injected") ||
          filename.includes("inpage")
        );
      });
      
      if (hasExternalFrame) {
        console.warn("[Sentry] Filtered error from external script");
        return null;
      }
    }

    return event;
  },

  // Ignore specific error types
  ignoreErrors: [
    // Web3Auth errors
    "Wallet is not ready",
    "failed to fetch project configurations",
    "Project not found",
    /Web3Auth/i,
    /client ID and network/i,
    
    // Common browser errors to ignore
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    /Loading chunk \d+ failed/,
    "Network request failed",
    "Failed to fetch",
    
    // Browser extension errors
    /chrome-extension:/,
    /moz-extension:/,
    /safari-extension:/,
  ],

  // Deny URLs - don't capture errors from these sources
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
    
    // Third-party scripts
    /web3auth/i,
    /walletconnect/i,
  ],
});
