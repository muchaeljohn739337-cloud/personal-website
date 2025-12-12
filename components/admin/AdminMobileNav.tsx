'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface AdminMobileNavProps {
  navItems: NavItem[];
}

export function AdminMobileNav({ navItems }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-slate-900 dark:text-white" />
        ) : (
          <Menu className="h-5 w-5 text-slate-900 dark:text-white" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Menu Panel */}
          <div
            className={`fixed top-14 sm:top-16 left-0 right-0 bottom-0 z-50 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-4 space-y-1">
              <div className="px-3 py-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Admin Navigation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select a section to manage
                </p>
              </div>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white transition-colors min-h-[44px]"
                >
                  <span className="text-lg">←</span>
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
