'use client';

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * Axe Accessibility Testing Wrapper
 * Only runs in development mode
 *
 * Usage: Wrap your app with this component in development
 *
 * Note: This component should only be used in development.
 * It will automatically detect the environment and only run in dev mode.
 */

export function AxeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Dynamically import axe-core/react
    import('@axe-core/react')
      .then((axe: { default: typeof import('@axe-core/react').default }) => {
        axe.default(React, ReactDOM, 1000);
      })
      .catch((error) => {
        // Silently fail if axe-core is not available
        console.warn('Axe accessibility testing not available:', error);
      });
  }, []);

  return <>{children}</>;
}
