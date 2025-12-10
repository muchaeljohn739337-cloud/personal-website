'use client';

import { Crown, Sparkles, Star } from 'lucide-react';
import * as React from 'react';

interface PremiumBadgeProps {
  variant?: 'default' | 'compact' | 'icon' | 'banner';
  showIcon?: boolean;
  className?: string;
}

export function PremiumBadge({
  variant = 'default',
  showIcon = true,
  className,
}: PremiumBadgeProps) {
  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 p-1.5 shadow-lg shadow-amber-500/30 ${className || ''}`}
        title="Premium Verified"
        aria-label="Premium Verified Account"
      >
        <Crown className="h-3 w-3 text-white" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2.5 py-1 text-xs font-semibold text-white shadow-md shadow-amber-500/30 ${className || ''}`}
        title="Premium Verified"
      >
        {showIcon && <Crown className="h-3 w-3" />}
        <span>Premium</span>
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 px-4 py-2.5 ${className || ''}`}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-1.5 shadow-lg shadow-amber-500/30">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Premium Verified</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Super Admin Account</p>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/40 ring-2 ring-amber-300/50 dark:ring-amber-400/30 ${className || ''}`}
      title="Premium Verified Super Admin"
      aria-label="Premium Verified Super Admin Account"
    >
      {showIcon && <Crown className="h-4 w-4" />}
      <span>Premium Verified</span>
      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
    </span>
  );
}

