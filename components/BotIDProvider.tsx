'use client';

/**
 * BotID Provider Component
 * Injects BotID script for client-side verification
 * Only loads on high-value pages
 */

import { useEffect } from 'react';
import Script from 'next/script';

interface BotIDProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function BotIDProvider({ children, enabled = true }: BotIDProviderProps) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    // BotID will be loaded via script tag
    // The script handles token generation automatically
  }, [enabled]);

  return (
    <>
      {enabled && (
        <Script
          src="https://cdn.botid.io/botid.js"
          strategy="afterInteractive"
          onLoad={() => {
            // BotID script loaded
            if (typeof window !== 'undefined' && (window as Window & { botid?: unknown }).botid) {
              console.log('BotID loaded successfully');
            }
          }}
        />
      )}
      {children}
    </>
  );
}
