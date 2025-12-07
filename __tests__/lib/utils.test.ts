/**
 * Utility Functions Tests
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// cn function (same as in lib/utils/cn.ts)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('px-4', 'py-2');
      expect(result).toBe('px-4 py-2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('should handle false conditionals', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('should merge tailwind conflicts correctly', () => {
      const result = cn('px-4', 'px-6');
      expect(result).toBe('px-6');
    });

    it('should handle arrays', () => {
      const result = cn(['px-4', 'py-2']);
      expect(result).toBe('px-4 py-2');
    });

    it('should handle objects', () => {
      const result = cn({
        'bg-blue-500': true,
        'bg-red-500': false,
      });
      expect(result).toBe('bg-blue-500');
    });
  });

  describe('String Utilities', () => {
    it('should generate slug from title', () => {
      const generateSlug = (title: string): string => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 100);
      };

      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Test Post 123')).toBe('test-post-123');
      expect(generateSlug('  Spaces  ')).toBe('spaces');
      expect(generateSlug('Special!@#Characters')).toBe('special-characters');
    });

    it('should calculate read time', () => {
      const calculateReadTime = (content: string): number => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
      };

      const shortContent = 'This is a short post.';
      const longContent = Array(500).fill('word').join(' ');

      expect(calculateReadTime(shortContent)).toBe(1);
      expect(calculateReadTime(longContent)).toBe(3);
    });
  });

  describe('Date Utilities', () => {
    it('should format date correctly', () => {
      const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
      };

      const date = new Date('2024-12-07T12:00:00Z');
      expect(formatDate(date)).toBe('2024-12-07');
    });

    it('should check if date is in past', () => {
      const isInPast = (date: Date): boolean => {
        return date < new Date();
      };

      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');

      expect(isInPast(pastDate)).toBe(true);
      expect(isInPast(futureDate)).toBe(false);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
    });

    it('should validate password strength', () => {
      const isStrongPassword = (password: string): boolean => {
        return (
          password.length >= 8 &&
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password)
        );
      };

      expect(isStrongPassword('Secure123')).toBe(true);
      expect(isStrongPassword('weak')).toBe(false);
      expect(isStrongPassword('nouppercase123')).toBe(false);
      expect(isStrongPassword('NOLOWERCASE123')).toBe(false);
      expect(isStrongPassword('NoNumbers')).toBe(false);
    });
  });
});
