'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BalanceVisibilityProps {
  value: string | number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'gradient' | 'minimal';
}

export function BalanceVisibility({
  value,
  currency,
  className = '',
  size = 'md',
  showIcon = true,
  iconPosition = 'right',
  variant = 'default',
}: BalanceVisibilityProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('balanceVisibility');
      return stored !== 'false';
    }
    return true;
  });

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('balanceVisibility', String(isVisible));
    }
  }, [isVisible]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return val;
  };

  const hiddenValue = '••••••';
  const displayValue = isVisible ? formatValue(value) : hiddenValue;

  const sizeClasses = {
    sm: 'text-base sm:text-lg',
    md: 'text-xl sm:text-2xl lg:text-3xl',
    lg: 'text-2xl sm:text-3xl lg:text-4xl',
    xl: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4 sm:h-5 sm:w-5',
    md: 'h-5 w-5 sm:h-6 sm:w-6',
    lg: 'h-6 w-6 sm:h-7 sm:w-7',
    xl: 'h-7 w-7 sm:h-8 sm:w-8',
  };

  const variantClasses = {
    default: 'text-white',
    gradient:
      'bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent',
    minimal: 'text-slate-300 dark:text-slate-400',
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {showIcon && iconPosition === 'left' && (
        <button
          onClick={toggleVisibility}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`${iconSizes[size]} text-slate-400 hover:text-cyan-400 transition-all duration-300 hover:scale-110 active:scale-95 relative group cursor-pointer`}
          aria-label={isVisible ? 'Hide balance' : 'Show balance'}
        >
          {/* Enhanced Water Drop Effects */}
          <div className="absolute -inset-2 rounded-full bg-cyan-400/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
          <div className="absolute -inset-1 rounded-full bg-blue-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Ripple effect on click */}
          {isHovering && (
            <div className="absolute inset-0 rounded-full bg-cyan-400/40 blur-md animate-ping" />
          )}

          {/* Icon with glow */}
          <div className="relative z-10 drop-shadow-lg">
            {isVisible ? (
              <Eye className="filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            ) : (
              <EyeOff className="filter drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
            )}
          </div>
        </button>
      )}

      <span
        className={`font-bold ${sizeClasses[size]} ${variantClasses[variant]} transition-all duration-300 ${
          !isVisible ? 'blur-sm' : ''
        }`}
      >
        {displayValue}
        {currency && isVisible && (
          <span className="text-xs sm:text-sm opacity-70 ml-1 sm:ml-2">{currency}</span>
        )}
      </span>

      {showIcon && iconPosition === 'right' && (
        <button
          onClick={toggleVisibility}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`${iconSizes[size]} text-slate-400 hover:text-cyan-400 transition-all duration-300 hover:scale-110 active:scale-95 relative group cursor-pointer`}
          aria-label={isVisible ? 'Hide balance' : 'Show balance'}
        >
          {/* Enhanced Water Drop Effects */}
          <div className="absolute -inset-2 rounded-full bg-cyan-400/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
          <div className="absolute -inset-1 rounded-full bg-blue-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Ripple effect on hover */}
          {isHovering && (
            <div className="absolute inset-0 rounded-full bg-cyan-400/40 blur-md animate-ping" />
          )}

          {/* Icon with glow */}
          <div className="relative z-10 drop-shadow-lg">
            {isVisible ? (
              <Eye className="filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            ) : (
              <EyeOff className="filter drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
            )}
          </div>
        </button>
      )}
    </div>
  );
}
