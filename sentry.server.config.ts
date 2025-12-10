import * as Sentry from '@sentry/nextjs';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Performance Monitoring
  tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production

  // Debug mode
  debug: isDevelopment && process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',

  // Filter sensitive data
  beforeSend(event) {
    // Filter out sensitive information from server errors
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
        delete event.request.headers['x-auth-token'];
      }

      // Filter body if it contains sensitive data
      if (event.request.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, unknown>;
        delete data.password;
        delete data.token;
        delete data.secret;
        delete data.apiKey;
      }
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'Non-Error promise rejection captured',
  ],
});
