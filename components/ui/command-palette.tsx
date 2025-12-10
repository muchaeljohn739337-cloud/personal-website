'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  Settings,
  CreditCard,
  Users,
  BarChart3,
  Wallet,
  Gift,
  Activity,
  Sparkles,
  FileText,
  HelpCircle,
  LogOut,
  Moon,
  Zap,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const pages = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, keywords: ['home', 'main'] },
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    keywords: ['payment', 'subscription', 'invoice'],
  },
  { name: 'Team', href: '/dashboard/team', icon: Users, keywords: ['members', 'invite'] },
  { name: 'Tokens', href: '/dashboard/tokens', icon: Wallet, keywords: ['crypto', 'wallet'] },
  { name: 'Rewards', href: '/dashboard/rewards', icon: Gift, keywords: ['points', 'loyalty'] },
  { name: 'Health', href: '/dashboard/health', icon: Activity, keywords: ['wellness', 'tracking'] },
  { name: 'MedBed', href: '/dashboard/medbed', icon: Sparkles, keywords: ['booking', 'session'] },
  {
    name: 'Analytics',
    href: '/dashboard/settings',
    icon: BarChart3,
    keywords: ['reports', 'data'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    keywords: ['preferences', 'account'],
  },
];

const actions = [
  { name: 'New Transaction', action: 'new-transaction', icon: Zap, keywords: ['send', 'payment'] },
  { name: 'View Documentation', action: 'docs', icon: FileText, keywords: ['help', 'guide'] },
  { name: 'Get Help', action: 'help', icon: HelpCircle, keywords: ['support', 'contact'] },
  { name: 'Toggle Dark Mode', action: 'theme', icon: Moon, keywords: ['light', 'dark', 'theme'] },
  { name: 'Sign Out', action: 'signout', icon: LogOut, keywords: ['logout', 'exit'] },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSelect = useCallback(
    (value: string) => {
      const page = pages.find((p) => p.href === value);
      if (page) {
        router.push(page.href);
        onClose();
        return;
      }

      const action = actions.find((a) => a.action === value);
      if (action) {
        switch (action.action) {
          case 'signout':
            signOut({ callbackUrl: '/' });
            break;
          case 'theme': {
            const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            document.documentElement.classList.toggle('dark');
            // Persist to localStorage
            localStorage.setItem('theme', currentTheme === 'dark' ? 'light' : 'dark');
            break;
          }
          case 'docs':
            window.open('/docs', '_blank');
            break;
          case 'help':
            window.open('/help', '_blank');
            break;
        }
        onClose();
      }
    },
    [router, onClose]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <Command
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
              loop
            >
              <div className="flex items-center border-b border-white/10 px-4">
                <Search className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="flex h-14 w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                />
                <kbd className="hidden rounded bg-slate-800 px-2 py-1 text-xs text-slate-400 sm:inline-block">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-slate-500">
                  No results found.
                </Command.Empty>

                <Command.Group
                  heading="Pages"
                  className="px-2 py-1.5 text-xs font-medium text-slate-500"
                >
                  {pages.map((page) => (
                    <Command.Item
                      key={page.href}
                      value={page.href}
                      keywords={page.keywords}
                      onSelect={handleSelect}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 aria-selected:bg-violet-500/20 aria-selected:text-white"
                    >
                      <page.icon className="h-4 w-4 text-slate-400" />
                      {page.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-white/10" />

                <Command.Group
                  heading="Actions"
                  className="px-2 py-1.5 text-xs font-medium text-slate-500"
                >
                  {actions.map((action) => (
                    <Command.Item
                      key={action.action}
                      value={action.action}
                      keywords={action.keywords}
                      onSelect={handleSelect}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 aria-selected:bg-violet-500/20 aria-selected:text-white"
                    >
                      <action.icon className="h-4 w-4 text-slate-400" />
                      {action.name}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <kbd className="rounded bg-slate-800 px-1.5 py-0.5">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="rounded bg-slate-800 px-1.5 py-0.5">↵</kbd>
                  <span>Select</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to use command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((open) => !open),
  };
}
