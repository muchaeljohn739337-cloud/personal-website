'use client';

import { useEffect, useState } from 'react';

interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  timeout?: number;
}

/**
 * Accessibility Announcement Component
 * Announces dynamic content changes to screen readers
 */
export function Announcement({ message, priority = 'polite', timeout = 5000 }: AnnouncementProps) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      const timer = setTimeout(() => setAnnouncement(''), timeout);
      return () => clearTimeout(timer);
    }
  }, [message, timeout]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      aria-relevant="additions text"
    >
      {announcement}
    </div>
  );
}

