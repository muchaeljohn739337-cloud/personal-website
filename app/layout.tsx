import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AIChat from '@/components/AIChat';

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
  keywords: ['fintech', 'payments', 'crypto', 'digital payments', 'financial platform', 'payment processing'],
  openGraph: {
    title: 'Advancia PayLedger | The Future of Digital Payments',
    description: 'Seamless payments, powerful analytics, unlimited possibilities.',
    url: 'https://advanciapayledger.com',
    siteName: 'Advancia PayLedger',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <AIChat />
      </body>
    </html>
  );
}
