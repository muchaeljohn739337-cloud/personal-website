/**
 * Accessibility Utilities
 * Helper functions for accessibility features
 */

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const region = document.getElementById('aria-live-region');
  if (region) {
    region.setAttribute('aria-live', priority);
    region.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }
}

/**
 * Check if element is keyboard focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return element.matches(focusableSelectors);
}

/**
 * Trap focus within a container (for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTab);
  };
}

/**
 * Get accessible name for an element
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }

  // Fallback to text content
  return element.textContent?.trim() || '';
}

/**
 * Check color contrast ratio (WCAG AA: 4.5:1 for normal text, 3:1 for large)
 */
export function checkContrastRatio(
  foreground: string,
  background: string
): { ratio: number; passesAA: boolean; passesAAA: boolean } {
  // Simplified contrast check - in production, use a library like 'color-contrast-checker'
  // This is a placeholder that should be replaced with actual contrast calculation
  const ratio = 4.5; // Placeholder - implement actual calculation

  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
  };
}

