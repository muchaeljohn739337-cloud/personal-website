'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// eslint-disable-next-line import/no-unresolved
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  variant?: 'button' | 'switch' | 'icon';
  className?: string;
}

export function ThemeToggle({ variant = 'switch', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={className}>
        {variant === 'icon' ? (
          <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800" />
        ) : variant === 'button' ? (
          <div className="h-9 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
        ) : (
          <div className="h-6 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
        )}
      </div>
    );
  }

  const isDark = theme === 'dark';

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={className}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-amber-500" />
        ) : (
          <Moon className="h-5 w-5 text-slate-600" />
        )}
      </Button>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={className}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </>
        ) : (
          <>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </>
        )}
      </Button>
    );
  }

  // Default: switch variant
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative h-6 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isDark ? 'bg-blue-600' : 'bg-slate-300'
      } ${className || ''}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      role="switch"
      aria-checked={isDark}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          isDark ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  );
}
