'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { initLogRocket, identifyUser } from '@/lib/monitoring/logrocket';

/**
 * Initialize monitoring services (LogRocket, etc.)
 * This component runs on the client side to set up monitoring
 */
export function MonitoringInit() {
  const { data: session } = useSession();

  useEffect(() => {
    // Check cookie consent for analytics
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      try {
        const prefs = JSON.parse(consent);
        if (prefs.analytics) {
          // Initialize LogRocket if analytics consent is given
          initLogRocket();
        }
      } catch {
        // Invalid consent data, don't initialize
      }
    }
  }, []);

  useEffect(() => {
    // Identify user in LogRocket when they log in
    if (session?.user?.id) {
      const consent = localStorage.getItem('cookie-consent');
      if (consent) {
        try {
          const prefs = JSON.parse(consent);
          if (prefs.analytics) {
            identifyUser(session.user.id, {
              email: session.user.email,
              name: session.user.name,
              role: session.user.role,
            });
          }
        } catch {
          // Invalid consent data
        }
      }
    }
  }, [session]);

  return null;
}
