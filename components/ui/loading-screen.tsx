'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after content is ready
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Remove from DOM after animation
      setTimeout(() => setIsLoading(false), 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Water ripple background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-ripple-1 h-[600px] w-[600px] rounded-full border border-blue-500/20" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-ripple-2 h-[400px] w-[400px] rounded-full border border-cyan-500/20" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-ripple-3 h-[200px] w-[200px] rounded-full border border-indigo-500/20" />
        </div>
      </div>

      {/* Logo with water splash */}
      <div className="relative mb-8">
        {/* Water splash particles */}
        <div className="absolute -inset-8">
          {/* Splash droplets */}
          <div className="animate-splash-1 absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-80" />
          <div className="animate-splash-2 absolute right-0 top-1/4 h-2 w-2 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500 opacity-80" />
          <div className="animate-splash-3 absolute bottom-0 left-1/4 h-2.5 w-2.5 rounded-full bg-gradient-to-b from-cyan-300 to-blue-400 opacity-80" />
          <div className="animate-splash-4 absolute left-0 top-1/3 h-2 w-2 rounded-full bg-gradient-to-b from-blue-300 to-cyan-500 opacity-80" />
          <div className="animate-splash-5 absolute bottom-1/4 right-1/4 h-1.5 w-1.5 rounded-full bg-gradient-to-b from-indigo-400 to-blue-500 opacity-80" />
          <div className="animate-splash-6 absolute right-1/3 top-0 h-2 w-2 rounded-full bg-gradient-to-b from-cyan-400 to-blue-400 opacity-80" />
        </div>

        {/* Main logo container */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          {/* Glowing background */}
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-indigo-500/30 blur-xl" />

          {/* Logo background */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/50">
            {/* AP Logo - Advancia PayLedger */}
            <svg viewBox="0 0 100 100" className="h-16 w-16" fill="none">
              {/* Outer ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#logoGradient)"
                strokeWidth="2"
                opacity="0.5"
              />

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
                stroke="url(#logoGradient2)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.8"
              />

              {/* Water drop accent */}
              <path
                d="M50 75 C50 75 42 82 42 87 C42 92 46 95 50 95 C54 95 58 92 58 87 C58 82 50 75 50 75Z"
                fill="url(#dropGradient)"
                className="animate-pulse"
              />

              {/* Gradients */}
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
                <linearGradient id="dropGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Water ring animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-water-ring-1 h-24 w-24 rounded-2xl border-2 border-cyan-400/40" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-water-ring-2 h-24 w-24 rounded-2xl border border-blue-400/30" />
        </div>
      </div>

      {/* Brand name */}
      <h1 className="mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-3xl font-bold text-transparent">
        Advancia PayLedger
      </h1>
      <p className="mb-8 text-sm text-slate-400">The Future of Digital Payments</p>

      {/* Water wave loading indicator */}
      <div className="relative h-12 w-48 overflow-hidden rounded-full bg-slate-800/50 backdrop-blur">
        <div className="animate-wave absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-indigo-500/30" />
        <div className="animate-wave-2 absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-cyan-300">Loading...</span>
        </div>
      </div>

      {/* Bottom water drops */}
      <div className="mt-8 flex items-end gap-2">
        <div className="animate-drop-1 h-4 w-2 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
        <div className="animate-drop-2 h-6 w-2 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500" />
        <div className="animate-drop-3 h-5 w-2 rounded-full bg-gradient-to-b from-cyan-300 to-blue-400" />
        <div className="animate-drop-4 h-4 w-2 rounded-full bg-gradient-to-b from-blue-400 to-cyan-500" />
        <div className="animate-drop-5 h-6 w-2 rounded-full bg-gradient-to-b from-indigo-400 to-blue-500" />
      </div>
    </div>
  );
}
