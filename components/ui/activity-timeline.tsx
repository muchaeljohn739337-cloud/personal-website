'use client';

import { cn } from '@/lib/utils/cn';
import { LucideIcon } from 'lucide-react';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  icon?: LucideIcon;
  iconColor?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusColors = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === items.length - 1;
        const colorClass = item.status ? statusColors[item.status] : statusColors.info;

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && <div className="absolute left-5 top-10 h-full w-px bg-slate-800" />}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                colorClass
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  )}
                </div>
                <span className="text-xs text-slate-600">{item.time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
