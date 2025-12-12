import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cryptocurrency Payments | Advancia PayLedger',
  description:
    'Accept Bitcoin, Ethereum, USDT, and 50+ cryptocurrencies. Instant conversion, competitive rates, and secure blockchain transactions.',
  keywords: [
    'crypto payments',
    'bitcoin',
    'ethereum',
    'cryptocurrency',
    'blockchain payments',
    'crypto processing',
    'btc',
    'eth',
    'usdt',
  ],
  openGraph: {
    title: 'Accept Cryptocurrency Payments | Advancia PayLedger',
    description:
      'Start accepting Bitcoin, Ethereum, and 50+ cryptocurrencies with instant conversion and competitive rates.',
    url: 'https://advanciapayledger.com/crypto',
    images: ['/og-crypto.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accept Cryptocurrency Payments',
    description: 'Bitcoin, Ethereum, USDT and more. Instant conversion, secure transactions.',
  },
};

export default function CryptoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
