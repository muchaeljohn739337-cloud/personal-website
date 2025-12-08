import * as Sentry from '@sentry/nextjs';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Performance Monitoring
  // Adjust this value in production - use tracesSampler for greater control
  tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev

  // Session Replay
  replaysOnErrorSampleRate: 1.0, // Always record replays on errors
  replaysSessionSampleRate: isProduction ? 0.1 : 0.3, // 10% in prod, 30% in dev

  // Debug mode
  debug: isDevelopment && process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',

  // Filter sensitive data
  beforeSend(event) {
    // Filter out sensitive information
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Filter query strings
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        params.delete('password');
        params.delete('token');
        params.delete('api_key');
        event.request.query_string = params.toString();
      }
    }

    // Filter user data if needed
    if (event.user) {
      // Only keep necessary user info
      event.user = {
        id: event.user.id,
        username: event.user.username,
        email: event.user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
      };
    }

    return event;
  },

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask sensitive data
      maskAllText: false, // Set to true in production for privacy
      blockAllMedia: true, // Block images/videos for privacy
      maskAllInputs: true, // Mask all input fields
      block: [
        // Block sensitive elements
        '[data-sentry-block]',
        '[data-sensitive]',
        'input[type="password"]',
        'input[type="credit-card"]',
      ],
    }),
    Sentry.browserTracingIntegration({
      // Track navigation performance
      enableInp: true, // Interaction to Next Paint
    }),
    Sentry.captureConsoleIntegration({
      levels: ['error'], // Only capture console errors
    }),
  ],

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    // Network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // Third-party scripts
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // Known non-critical errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  // Deny URLs from being reported
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    // Monitoring services
    /sentry\.io/i,
    /logrocket\.com/i,
  ],
});
