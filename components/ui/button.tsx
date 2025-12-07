'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils/cn';

// Advanced Loading Spinner Component
const LoadingSpinner = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('relative mr-2', sizeClasses[size])}>
      {/* Outer rotating ring */}
      <div className="absolute inset-0 animate-spin">
        <svg viewBox="0 0 24 24" className="h-full w-full">
          <defs>
            <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="url(#spinnerGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="45 20"
          />
        </svg>
      </div>
      {/* Inner pulsing dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-80" />
      </div>
    </div>
  );
};

// Dots Loading Animation
const LoadingDots = () => (
  <div className="mr-2 flex items-center gap-1">
    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
  </div>
);

// Pulse Ring Animation
const LoadingPulse = () => (
  <div className="relative mr-2 h-4 w-4">
    <div className="absolute inset-0 animate-ping rounded-full bg-current opacity-30" />
    <div className="absolute inset-1 rounded-full bg-current opacity-60" />
  </div>
);

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 focus-visible:ring-blue-500',
        destructive:
          'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:from-red-700 hover:to-rose-700 focus-visible:ring-red-500',
        outline:
          'border-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
        ghost: 'text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800',
        link: 'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400',
        success:
          'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:from-emerald-700 hover:to-green-700 focus-visible:ring-emerald-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingStyle?: 'spinner' | 'dots' | 'pulse';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      loadingStyle = 'spinner',
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'default';

    const LoadingComponent = () => {
      switch (loadingStyle) {
        case 'dots':
          return <LoadingDots />;
        case 'pulse':
          return <LoadingPulse />;
        default:
          return <LoadingSpinner size={spinnerSize} />;
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingComponent />}
        {isLoading ? <span className="opacity-90">Processing...</span> : children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants, LoadingSpinner, LoadingDots, LoadingPulse };
