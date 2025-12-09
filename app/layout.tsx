import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import { Providers } from '@/components/providers';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { MonitoringInit } from '@/components/MonitoringInit';
import { PerformanceOptimizer } from '@/components/PerformanceOptimizer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load heavy components
const AIChat = dynamic(() => import('@/components/AIChat'), {
  ssr: false,
  loading: () => null,
});
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
  ssr: false,
  loading: () => null,
});

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Advancia PayLedger | The Future of Digital Payments',
  description:
    'Advancia PayLedger is your all-in-one fintech solution for managing payments, crypto transactions, health rewards, and more. Secure, fast, and built for modern businesses.',
  keywords: [
    'fintech',
    'payments',
    'crypto',
    'digital payments',
    'financial platform',
    'payment processing',
    'blockchain',
    'web3',
    'defi',
  ],
  authors: [{ name: 'Advancia' }],
  creator: 'Advancia',
  publisher: 'Advancia PayLedger',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'googlea48e26fef750d2b0', // Google Search Console verification
  },
  openGraph: {
    title: 'Advancia PayLedger | The Future of Digital Payments',
    description: 'Seamless payments, powerful analytics, unlimited possibilities.',
    url: 'https://advanciapayledger.com',
    siteName: 'Advancia PayLedger',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Advancia PayLedger',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advancia PayLedger | The Future of Digital Payments',
    description: 'Seamless payments, powerful analytics, unlimited possibilities.',
    images: ['/og-image.png'],
  },
  metadataBase: new URL('https://advanciapayledger.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>
            <MonitoringInit />
            <PerformanceOptimizer />
            <LoadingScreen />
            {children}
            <AIChat />
            <CookieConsent />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
