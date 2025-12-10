/**
 * Fast-Response Button Component
 * Optimized for instant visual feedback
 */

'use client';

import { ButtonHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface FastButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const FastButton = forwardRef<HTMLButtonElement, FastButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, children, disabled, ...props }, ref) => {
    const [isPressed, setIsPressed] = useState(false);

    const baseStyles =
      'relative inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation will-change-transform';

    const variants = {
      default:
        'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      primary:
        'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500 active:bg-violet-800',
      secondary:
        'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500 active:bg-slate-800',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isPressed && 'scale-[0.98]',
          loading && 'opacity-75 cursor-wait',
          className
        )}
        disabled={disabled || loading}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

FastButton.displayName = 'FastButton';
