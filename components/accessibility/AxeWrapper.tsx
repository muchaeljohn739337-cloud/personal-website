'use client';

import { useEffect } from 'react';
import React from 'react';
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
      .then((axe) => {
        axe.default(React, ReactDOM, 1000, {
          rules: {
            // Enable important accessibility rules
            'color-contrast': { enabled: true },
            'image-alt': { enabled: true },
            'button-name': { enabled: true },
            'input-button-name': { enabled: true },
            'label': { enabled: true },
            'link-name': { enabled: true },
            'aria-hidden-focus': { enabled: true },
            'aria-required-attr': { enabled: true },
            'aria-valid-attr-value': { enabled: true },
          },
        });
      })
      .catch((error) => {
        // Silently fail if axe-core is not available
        console.warn('Axe accessibility testing not available:', error);
      });
  }, []);

  return <>{children}</>;
}

