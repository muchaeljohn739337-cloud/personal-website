'use client';

import { useEffect, useState } from 'react';

interface ProfessionalLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

export function ProfessionalLoader({
  size = 'lg',
  text = 'Loading...',
  fullScreen = false,
}: ProfessionalLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={`${sizeClasses[size]} animate-spin-slow`}>
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <defs>
              <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#loaderGradient)"
              strokeWidth="4"
              strokeDasharray="200 100"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Inner pulsing circle */}
        <div
          className={`absolute inset-0 ${sizeClasses[size]} animate-pulse rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20`}
        />

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/50" />
        </div>
      </div>

      {/* Progress ring */}
      <div className="relative mt-6 h-2 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading text */}
      {text && (
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">{text}</p>
      )}
    </div>
  );
}
