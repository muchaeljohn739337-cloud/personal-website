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
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo */}
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-2xl shadow-blue-500/30">
          <svg
            className="h-14 w-14 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
            />
          </svg>
        </div>
        {/* Pulse ring animation */}
        <div className="absolute inset-0 animate-ping rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-20" />
      </div>

      {/* Brand name */}
      <h1 className="mb-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-3xl font-bold text-transparent">
        Advancia PayLedger
      </h1>
      <p className="mb-8 text-sm text-slate-400">The Future of Digital Payments</p>

      {/* Loading spinner */}
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500" />
      </div>

      {/* Loading bar */}
      <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      </div>
    </div>
  );
}
