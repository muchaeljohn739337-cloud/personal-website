'use client';

/**
 * Skip Links Component
 * Provides keyboard-accessible skip links for screen readers and keyboard users
 */

export function SkipLinks() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:font-semibold focus:shadow-lg"
      >
        Skip to navigation
      </a>
    </>
  );
}
