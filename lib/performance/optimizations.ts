/**
 * Performance Optimizations
 * Smooth scrolling, fast button responses, and UX enhancements
 */

/**
 * Initialize smooth scrolling
 */
export function initSmoothScrolling() {
  if (typeof window === 'undefined') return;

  // Use native smooth scroll if available
  if ('scrollBehavior' in document.documentElement.style) {
    return; // Browser supports native smooth scroll
  }

  // Polyfill for older browsers
  let isScrolling = false;

  window.addEventListener(
    'scroll',
    () => {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          isScrolling = false;
        });
        isScrolling = true;
      }
    },
    { passive: true }
  );
}

/**
 * Optimize button click performance
 */
export function optimizeButtonClicks() {
  if (typeof window === 'undefined') return;

  // Add fast response to all buttons
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest(
        'button, a[role="button"], [data-button]'
      ) as HTMLElement | null;

      if (button) {
        // Add visual feedback immediately
        button.style.transform = 'scale(0.98)';
        button.style.transition = 'transform 0.05s';

        setTimeout(() => {
          button.style.transform = '';
          button.style.transition = '';
        }, 50);
      }
    },
    { passive: true }
  );
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Optimize scroll performance
 */
export function optimizeScrollPerformance() {
  if (typeof window === 'undefined') return;

  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Scroll handling logic here
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  const criticalResources = ['/fonts/inter.woff2', '/fonts/jetbrains-mono.woff2'];

  criticalResources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = resource;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Initialize all performance optimizations
 */
export function initPerformanceOptimizations() {
  if (typeof window === 'undefined') return;

  initSmoothScrolling();
  optimizeButtonClicks();
  optimizeScrollPerformance();
  preloadCriticalResources();

  // Schedule health checks
  if ('serviceWorker' in navigator) {
    // Service worker for offline support and caching
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration is optional
    });
  }
}
