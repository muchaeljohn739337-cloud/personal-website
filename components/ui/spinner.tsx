'use client';

import { cn } from '@/lib/utils/cn';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'dots' | 'pulse' | 'orbit' | 'bars';
  className?: string;
  label?: string;
}

const sizeMap = {
  xs: { container: 'h-4 w-4', dot: 'h-1 w-1', bar: 'h-2 w-0.5' },
  sm: { container: 'h-6 w-6', dot: 'h-1.5 w-1.5', bar: 'h-3 w-1' },
  md: { container: 'h-8 w-8', dot: 'h-2 w-2', bar: 'h-4 w-1' },
  lg: { container: 'h-12 w-12', dot: 'h-2.5 w-2.5', bar: 'h-5 w-1.5' },
  xl: { container: 'h-16 w-16', dot: 'h-3 w-3', bar: 'h-6 w-2' },
};

// Default gradient spinner with smooth animation
const GradientSpinner = ({
  size = 'md',
  className,
}: {
  size: keyof typeof sizeMap;
  className?: string;
}) => (
  <div className={cn('relative', sizeMap[size].container, className)}>
    <svg viewBox="0 0 50 50" className="h-full w-full animate-spin">
      <defs>
        <linearGradient id="gradient-spinner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#gradient-spinner)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="80 40"
        className="origin-center"
      />
    </svg>
    {/* Center glow */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 blur-sm" />
    </div>
  </div>
);

// Modern dots spinner
const DotsSpinner = ({
  size = 'md',
  className,
}: {
  size: keyof typeof sizeMap;
  className?: string;
}) => (
  <div className={cn('flex items-center justify-center gap-1', className)}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={cn(
          sizeMap[size].dot,
          'rounded-full bg-gradient-to-r from-cyan-400 to-blue-500',
          'animate-bounce'
        )}
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

// Pulse ring spinner
const PulseSpinner = ({
  size = 'md',
  className,
}: {
  size: keyof typeof sizeMap;
  className?: string;
}) => (
  <div className={cn('relative', sizeMap[size].container, className)}>
    <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-40" />
    <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-60" />
    <div className="absolute inset-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
  </div>
);

// Orbiting dots spinner
const OrbitSpinner = ({
  size = 'md',
  className,
}: {
  size: keyof typeof sizeMap;
  className?: string;
}) => (
  <div className={cn('relative', sizeMap[size].container, className)}>
    {/* Center */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className={cn(sizeMap[size].dot, 'rounded-full bg-gradient-to-r from-cyan-400 to-blue-500')}
      />
    </div>
    {/* Orbiting dots */}
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="absolute inset-0 animate-spin"
        style={{ animationDuration: `${1.5 + i * 0.3}s` }}
      >
        <div
          className={cn(
            'absolute rounded-full',
            i === 0 ? 'h-1.5 w-1.5 bg-cyan-400 top-0 left-1/2 -translate-x-1/2' : '',
            i === 1 ? 'h-1 w-1 bg-blue-400 bottom-0 left-1/2 -translate-x-1/2' : '',
            i === 2 ? 'h-1 w-1 bg-indigo-400 top-1/2 right-0 -translate-y-1/2' : ''
          )}
        />
      </div>
    ))}
  </div>
);

// Bars spinner (equalizer style)
const BarsSpinner = ({
  size = 'md',
  className,
}: {
  size: keyof typeof sizeMap;
  className?: string;
}) => (
  <div className={cn('flex items-end justify-center gap-0.5', sizeMap[size].container, className)}>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={cn(
          sizeMap[size].bar,
          'rounded-full bg-gradient-to-t from-cyan-500 to-blue-500',
          'animate-pulse origin-bottom'
        )}
        style={{
          animationDelay: `${i * 0.1}s`,
          animationDuration: '0.6s',
          height: `${60 + Math.sin(i * 1.2) * 40}%`,
        }}
      />
    ))}
  </div>
);

// Default circular spinner
const DefaultSpinner = ({
  size = 'md',
  className,
}: {
  size: keyof typeof sizeMap;
  className?: string;
}) => (
  <div className={cn('relative', sizeMap[size].container, className)}>
    <svg viewBox="0 0 50 50" className="h-full w-full animate-spin">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="80 40"
        className="opacity-25"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="40 80"
        className="opacity-75"
      />
    </svg>
  </div>
);

export function Spinner({ size = 'md', variant = 'gradient', className, label }: SpinnerProps) {
  const SpinnerComponent = {
    default: DefaultSpinner,
    gradient: GradientSpinner,
    dots: DotsSpinner,
    pulse: PulseSpinner,
    orbit: OrbitSpinner,
    bars: BarsSpinner,
  }[variant];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <SpinnerComponent size={size} />
      {label && <span className="text-sm font-medium text-slate-400 animate-pulse">{label}</span>}
    </div>
  );
}

// Full page loading overlay
export function LoadingOverlay({
  message = 'Loading...',
  variant = 'gradient',
}: {
  message?: string;
  variant?: SpinnerProps['variant'];
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <Spinner size="xl" variant={variant} />
      <p className="mt-4 text-lg font-medium text-white">{message}</p>
      <p className="mt-1 text-sm text-slate-400">Please wait...</p>
    </div>
  );
}

// Inline loading state
export function InlineLoader({ text = 'Loading' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <Spinner size="xs" variant="gradient" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Skeleton loader
export function SkeletonLoader({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-800/50', className)} />;
}

export default Spinner;
