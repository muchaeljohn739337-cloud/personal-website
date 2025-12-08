'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LogoProps {
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
  href?: string;
}

export function Logo({ variant = 'default', className = '', href = '/' }: LogoProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');

  const LogoContent = () => (
    <div className={`flex items-center gap-3 group ${className}`}>
      {/* Modern VS Code-inspired Logo Icon */}
      <div className="relative">
        <div className="w-9 h-9 rounded-lg bg-[#1e1e1e] border border-slate-700/50 flex items-center justify-center shadow-lg group-hover:border-blue-500/50 transition-all duration-300 group-hover:scale-105">
          {/* Modern Payment/Blockchain inspired icon - Grid with connection nodes */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid pattern - modern tech aesthetic */}
            <path
              d="M6 3h2v2H6V3zm10 0h2v2h-2V3zM6 19h2v2H6v-2zm10 0h2v2h-2v-2z"
              className="fill-blue-500"
            />
            <path
              d="M3 6h2v2H3V6zm0 10h2v2H3v-2zm16-10h2v2h-2V6zm0 10h2v2h-2v-2z"
              className="fill-blue-400"
            />
            {/* Connection lines */}
            <path
              d="M7 7h10M7 12h10M7 17h10"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M12 3v6M12 15v6" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
            {/* Center node - payment focus */}
            <circle cx="12" cy="12" r="2" fill="#3b82f6" />
          </svg>
        </div>
        {/* Subtle VS Code blue glow effect */}
        <div className="absolute inset-0 rounded-lg bg-blue-500/10 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Brand Name - Clean, modern typography */}
      {(variant === 'default' || variant === 'compact') && (
        <div className="flex flex-col">
          <span
            className={`font-semibold text-white ${
              isDashboard ? 'text-base' : 'text-lg'
            } leading-tight tracking-tight`}
          >
            Advancia
          </span>
          {variant === 'default' && (
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              PayLedger
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}
