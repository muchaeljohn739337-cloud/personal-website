'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

import { Web3AuthProvider } from '@/lib/web3auth/provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <Web3AuthProvider>{children}</Web3AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
