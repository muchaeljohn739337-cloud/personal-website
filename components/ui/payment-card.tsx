'use client';

import { CreditCard } from 'lucide-react';

interface PaymentCardProps {
  type?: 'visa' | 'mastercard' | 'crypto' | 'debit';
  last4?: string;
  name?: string;
  className?: string;
}

export function PaymentCard({ type = 'debit', last4, name, className }: PaymentCardProps) {
  const cardColors = {
    visa: 'from-blue-600 to-blue-800',
    mastercard: 'from-red-500 to-orange-500',
    crypto: 'from-indigo-600 to-purple-600',
    debit: 'from-slate-700 to-slate-900',
  };

  return (
    <div
      className={`relative h-48 w-80 rounded-2xl bg-gradient-to-br ${cardColors[type]} p-6 shadow-2xl ${className || ''}`}
    >
      {/* Card chip */}
      <div className="mb-4 h-10 w-12 rounded bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg" />

      {/* Card number */}
      <div className="mb-4 font-mono text-xl font-bold text-white">
        {last4 ? `**** **** **** ${last4}` : '**** **** **** ****'}
      </div>

      {/* Cardholder name */}
      {name && <div className="mb-2 text-sm text-white/80 uppercase tracking-wider">{name}</div>}

      {/* Card type icon */}
      <div className="absolute bottom-6 right-6">
        {type === 'crypto' ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
            <span className="text-xs font-bold text-white">CRYPTO</span>
          </div>
        ) : (
          <CreditCard className="h-8 w-8 text-white/60" />
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/5 blur-xl" />
    </div>
  );
}
