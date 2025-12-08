/**
 * Analytics & Monitoring
 * User behavior tracking and performance metrics
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class Analytics {
  private enabled = false;
  private consent = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.consent = this.getCookieConsent();
      this.enabled = this.consent && process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

      // Listen for consent changes
      window.addEventListener('analytics-consent', ((e: CustomEvent) => {
        this.consent = e.detail?.analytics || false;
        this.enabled = this.consent && process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
      }) as EventListener);
    }
  }

  private getCookieConsent(): boolean {
    if (typeof window === 'undefined') return false;
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) return false;
    try {
      const prefs = JSON.parse(consent);
      return prefs.analytics === true;
    } catch {
      return false;
    }
  }

  /**
   * Track a custom event
   */
  track(event: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      name: event,
      properties,
      timestamp: Date.now(),
    };

    // Send to analytics service
    this.sendEvent(analyticsEvent);
  }

  /**
   * Track page view
   */
  pageView(path: string, title?: string): void {
    this.track('page_view', {
      path,
      title: title || document.title,
      url: window.location.href,
    });
  }

  /**
   * Track user action
   */
  trackAction(action: string, properties?: Record<string, unknown>): void {
    this.track('user_action', {
      action,
      ...properties,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.enabled) return;
    this.track('performance_metric', {
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      timestamp: metric.timestamp,
    } as Record<string, unknown>);
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Send event to analytics endpoint
   */
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals(): void {
    if (typeof window === 'undefined' || !this.enabled) return;

    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
      };
      const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
      this.trackPerformance({
        name: 'LCP',
        value: lcp,
        unit: 'ms',
        timestamp: Date.now(),
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        this.trackPerformance({
          name: 'FID',
          value: fid,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShift.hadRecentInput && layoutShift.value) {
          clsValue += layoutShift.value;
        }
      }
      this.trackPerformance({
        name: 'CLS',
        value: clsValue,
        unit: 'score',
        timestamp: Date.now(),
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// Singleton instance
let analyticsInstance: Analytics | null = null;

export function getAnalytics(): Analytics {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      consent: false,
      getCookieConsent: () => false,
      sendEvent: async () => {},
      track: () => {},
      pageView: () => {},
      trackAction: () => {},
      trackPerformance: () => {},
      trackError: () => {},
      trackWebVitals: () => {},
    } as unknown as Analytics;
  }

  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
  }
  return analyticsInstance;
}

// Convenience functions
export function track(event: string, properties?: Record<string, unknown>): void {
  getAnalytics().track(event, properties);
}

export function trackPageView(path: string, title?: string): void {
  getAnalytics().pageView(path, title);
}

export function trackAction(action: string, properties?: Record<string, unknown>): void {
  getAnalytics().trackAction(action, properties);
}
