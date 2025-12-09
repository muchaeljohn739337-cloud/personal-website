'use client';

import { useEffect } from 'react';
import { initPerformanceOptimizations } from '@/lib/performance/optimizations';

export function PerformanceOptimizer() {
  useEffect(() => {
    initPerformanceOptimizations();
  }, []);

  return null;
}
