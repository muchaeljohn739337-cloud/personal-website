'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';

// Dynamically import Web3AuthProvider to avoid SSR issues
const Web3AuthProvider = dynamic(
  () => import('@/lib/web3auth/provider').then((mod) => mod.Web3AuthProvider),
  {
    ssr: false,
    loading: () => null,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <Web3AuthProvider>{children}</Web3AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
