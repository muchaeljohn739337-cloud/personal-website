/**
 * LogRocket Integration
 * Session replay and logging service
 * https://logrocket.com
 */

declare global {
  interface Window {
    LogRocket?: {
      init: (appId: string, config?: LogRocketConfig) => void;
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      captureException: (error: Error, metadata?: Record<string, unknown>) => void;
      getSessionURL: (callback: (sessionURL: string) => void) => void;
      reduxMiddleware?: unknown;
      sessionURL?: string;
    };
  }
}

interface LogRocketConfig {
  release?: string;
  shouldCaptureConsole?: boolean;
  shouldCaptureNetwork?: boolean;
  shouldCaptureNetworkBody?: boolean;
  shouldCaptureException?: boolean;
  shouldCaptureDom?: boolean;
  shouldCaptureInputs?: boolean;
  dom?: {
    blockSelector?: string;
    inputSanitizer?: (element: HTMLElement) => boolean;
  };
  network?: {
    requestSanitizer?: (request: unknown) => unknown;
    responseSanitizer?: (response: unknown) => unknown;
  };
}

class LogRocketService {
  private initialized = false;
  private appId: string | null = null;

  /**
   * Initialize LogRocket
   */
  init(): void {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;

    const appId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;
    if (!appId) {
      console.warn('[LogRocket] App ID not configured');
      return;
    }

    this.appId = appId;

    // Load LogRocket script
    const script = document.createElement('script');
    script.src = 'https://cdn.lr-ingest.com/LogRocket.min.js';
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => {
      if (window.LogRocket) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        window.LogRocket.init(appId, {
          release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          shouldCaptureConsole: !isDevelopment, // Don't capture console in dev
          shouldCaptureNetwork: true,
          shouldCaptureNetworkBody: false, // Don't capture request/response bodies
          shouldCaptureException: true,
          shouldCaptureDom: true,
          shouldCaptureInputs: false, // Privacy - don't capture input values
          dom: {
            blockSelector: '[data-lr-block], [data-sensitive], input[type="password"]',
            inputSanitizer: (element) => {
              // Block sensitive inputs
              const sensitiveTypes = ['password', 'credit-card', 'cvv', 'ssn'];
              return sensitiveTypes.some((type) => element.getAttribute('type') === type);
            },
          },
          network: {
            requestSanitizer: (request) => {
              // Sanitize sensitive headers
              if (request && typeof request === 'object') {
                const sanitized = { ...request } as Record<string, unknown>;
                if (sanitized.headers) {
                  const headers = sanitized.headers as Record<string, unknown>;
                  delete headers['authorization'];
                  delete headers['cookie'];
                  delete headers['x-api-key'];
                }
                return sanitized;
              }
              return request;
            },
            responseSanitizer: (response) => {
              // Sanitize sensitive response data
              if (response && typeof response === 'object') {
                const sanitized = { ...response } as Record<string, unknown>;
                if (sanitized.body && typeof sanitized.body === 'object') {
                  const body = sanitized.body as Record<string, unknown>;
                  delete body.token;
                  delete body.accessToken;
                  delete body.refreshToken;
                }
                return sanitized;
              }
              return response;
            },
          },
        });

        this.initialized = true;
        console.log('[LogRocket] Initialized successfully');
      }
    };

    script.onerror = () => {
      console.error('[LogRocket] Failed to load script');
    };

    document.head.appendChild(script);
  }

  /**
   * Identify a user session
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (typeof window === 'undefined' || !window.LogRocket || !this.initialized) return;

    // Sanitize traits
    const sanitizedTraits: Record<string, unknown> = {};
    if (traits) {
      Object.keys(traits).forEach((key) => {
        // Don't send sensitive data
        if (!['password', 'token', 'secret', 'apiKey'].includes(key.toLowerCase())) {
          sanitizedTraits[key] = traits[key];
        }
      });
    }

    window.LogRocket.identify(userId, sanitizedTraits);
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, metadata?: Record<string, unknown>): void {
    if (typeof window === 'undefined' || !window.LogRocket || !this.initialized) return;

    // Sanitize metadata
    const sanitizedMetadata: Record<string, unknown> = {};
    if (metadata) {
      Object.keys(metadata).forEach((key) => {
        if (!['password', 'token', 'secret', 'apiKey'].includes(key.toLowerCase())) {
          sanitizedMetadata[key] = metadata[key];
        }
      });
    }

    window.LogRocket.captureException(error, sanitizedMetadata);
  }

  /**
   * Get current session URL
   */
  getSessionURL(): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.LogRocket || !this.initialized) {
        resolve(null);
        return;
      }

      if (window.LogRocket.getSessionURL) {
        window.LogRocket.getSessionURL((sessionURL) => {
          resolve(sessionURL);
        });
      } else {
        resolve(window.LogRocket.sessionURL || null);
      }
    });
  }

  /**
   * Check if LogRocket is initialized
   */
  isInitialized(): boolean {
    return this.initialized && typeof window !== 'undefined' && !!window.LogRocket;
  }
}

// Singleton instance
let logRocketInstance: LogRocketService | null = null;

export function getLogRocket(): LogRocketService {
  if (!logRocketInstance) {
    logRocketInstance = new LogRocketService();
  }
  return logRocketInstance;
}

// Convenience functions
export function initLogRocket(): void {
  getLogRocket().init();
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  getLogRocket().identify(userId, traits);
}

export function captureException(error: Error, metadata?: Record<string, unknown>): void {
  getLogRocket().captureException(error, metadata);
}

export function getSessionURL(): Promise<string | null> {
  return getLogRocket().getSessionURL();
}
