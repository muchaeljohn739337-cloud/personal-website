'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate loading text
    const textInterval = setInterval(() => {
      setLoadingText((prev) => {
        if (prev === 'Loading...') return 'Loading';
        return prev + '.';
      });
    }, 400);

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 200);

    // Start fade out after content is ready
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setIsLoading(false), 500);
      }, 300);
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-blue-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Ripple rings */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-ripple-1 h-[600px] w-[600px] rounded-full border border-blue-500/20" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-ripple-2 h-[400px] w-[400px] rounded-full border border-cyan-500/20" />
        </div>
      </div>

      {/* Main rotating logo */}
      <div className="relative mb-8">
        {/* Outer rotating ring */}
        <div className="absolute -inset-6 animate-spin-slow">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="2"
              strokeDasharray="150 100"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Second rotating ring (opposite direction) */}
        <div className="absolute -inset-4 animate-spin-reverse">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="1.5"
              strokeDasharray="80 120"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Glowing background */}
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-cyan-500/40 via-blue-500/40 to-indigo-500/40 blur-2xl" />

        {/* Main logo container - rotates on load */}
        <div className="relative flex h-32 w-32 animate-logo-spin items-center justify-center">
          {/* Logo background */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/50">
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

            {/* AP Logo */}
            <svg viewBox="0 0 100 100" className="h-16 w-16" fill="none">
              {/* A letter stylized */}
              <path
                d="M30 70 L50 25 L70 70 M38 55 L62 55"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* P letter integrated */}
              <path
                d="M50 25 L50 70 M50 25 C65 25 70 35 70 42 C70 49 65 55 50 55"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
        </div>
        <div className="absolute inset-0 animate-spin-reverse">
          <div className="absolute -bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
        </div>
      </div>

      {/* Brand name */}
      <h1 className="mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-3xl font-bold text-transparent">
        Advancia PayLedger
      </h1>
      <p className="mb-8 text-sm text-slate-400">The Future of Digital Payments</p>

      {/* Progress bar */}
      <div className="relative h-2 w-64 overflow-hidden rounded-full bg-slate-800/50 backdrop-blur">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>

      {/* Loading text */}
      <p className="mt-4 text-sm font-medium text-cyan-300">{loadingText}</p>

      {/* Loading features text */}
      <p className="mt-2 text-xs text-slate-500">
        {progress < 30 && 'Initializing systems...'}
        {progress >= 30 && progress < 60 && 'Loading features...'}
        {progress >= 60 && progress < 90 && 'Preparing dashboard...'}
        {progress >= 90 && 'Almost ready...'}
      </p>
    </div>
  );
}
