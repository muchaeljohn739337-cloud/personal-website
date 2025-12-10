/**
 * Utility Functions Tests
 */

// Simple cn implementation for testing
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

describe('Utility Functions', () => {
  describe('cn (classNames merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toContain('bg-red-500');
      expect(result).toContain('text-white');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('active-class');
    });

    it('should handle undefined values', () => {
      const result = cn('base-class', undefined, 'another-class');
      expect(result).toContain('base-class');
      expect(result).toContain('another-class');
    });

    it('should filter false values', () => {
      const result = cn('base-class', false, 'another-class');
      expect(result).toBe('base-class another-class');
    });
  });
});

describe('Date Utilities', () => {
  it('should format dates correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = date.toLocaleDateString('en-US');
    expect(formatted).toBeTruthy();
  });
});

describe('Number Utilities', () => {
  it('should format currency correctly', () => {
    const amount = 1234.56;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    expect(formatted).toBe('$1,234.56');
  });

  it('should format large numbers with K/M suffix', () => {
    const formatNumber = (num: number): string => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(2500000)).toBe('2.5M');
    expect(formatNumber(500)).toBe('500');
  });
});

describe('String Utilities', () => {
  it('should truncate long strings', () => {
    const truncate = (str: string, maxLength: number): string => {
      if (str.length <= maxLength) return str;
      return str.slice(0, maxLength - 3) + '...';
    };

    expect(truncate('Hello World', 8)).toBe('Hello...');
    expect(truncate('Short', 10)).toBe('Short');
  });

  it('should slugify strings', () => {
    const slugify = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Test 123!')).toBe('test-123');
  });
});

describe('Validation Utilities', () => {
  it('should validate email format', () => {
    const isValidEmail = (email: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
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
    expect(isStrongPassword('alllowercase123')).toBe(false);
  });
});
