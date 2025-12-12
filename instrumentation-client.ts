import * as Sentry from '@sentry/nextjs';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Client-side Sentry initialization
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Performance Monitoring
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Session Replay
  replaysOnErrorSampleRate: 1.0, // Always record replays on errors
  replaysSessionSampleRate: isProduction ? 0.1 : 0.3,

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

    // Filter user data
    if (event.user) {
      event.user = {
        id: event.user.id,
        username: event.user.username,
      };
    }

    return event;
  },

  // Breadcrumbs
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
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
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
  ],
});

// Export router transition hook for Next.js App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
