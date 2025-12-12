/**
 * Color Contrast Checker
 * Checks if color combinations meet WCAG 2.1 AA standards
 *
 * WCAG Requirements:
 * - Normal text (16px): 4.5:1 contrast ratio
 * - Large text (18px+ or 14px+ bold): 3:1 contrast ratio
 * - UI components: 3:1 contrast ratio
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 * Formula from WCAG 2.1: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function getContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return null;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number | null; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 3 : 4.5;

  return {
    passes: ratio !== null && ratio >= required,
    ratio,
    required,
  };
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number | null; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 4.5 : 7;

  return {
    passes: ratio !== null && ratio >= required,
    ratio,
    required,
  };
}

/**
 * Common color combinations to check
 */
export const COMMON_COLORS = {
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8', // slate-400
  textMuted: '#64748b', // slate-500

  // Background colors
  bgPrimary: '#0f172a', // slate-900
  bgSecondary: '#1e293b', // slate-800
  bgTertiary: '#334155', // slate-700

  // Accent colors
  blue: '#3b82f6', // blue-500
  blueDark: '#2563eb', // blue-600
  violet: '#8b5cf6', // violet-500
  emerald: '#10b981', // emerald-500
  red: '#ef4444', // red-500

  // UI colors
  border: '#334155', // slate-700
  borderLight: '#475569', // slate-600
};

/**
 * Check all common color combinations
 */
export function checkCommonColors(): Array<{
  foreground: string;
  background: string;
  ratio: number | null;
  passesAA: boolean;
  passesAAA: boolean;
  isLargeText: boolean;
}> {
  const combinations = [
    // Normal text
    { fg: COMMON_COLORS.textPrimary, bg: COMMON_COLORS.bgPrimary, large: false },
    { fg: COMMON_COLORS.textSecondary, bg: COMMON_COLORS.bgPrimary, large: false },
    { fg: COMMON_COLORS.textMuted, bg: COMMON_COLORS.bgPrimary, large: false },
    { fg: COMMON_COLORS.blue, bg: COMMON_COLORS.bgPrimary, large: false },

    // Large text
    { fg: COMMON_COLORS.textPrimary, bg: COMMON_COLORS.bgPrimary, large: true },
    { fg: COMMON_COLORS.textSecondary, bg: COMMON_COLORS.bgPrimary, large: true },

    // Buttons
    { fg: '#ffffff', bg: COMMON_COLORS.blue, large: false },
    { fg: '#ffffff', bg: COMMON_COLORS.blueDark, large: false },
  ];

  return combinations.map(({ fg, bg, large }) => {
    const ratio = getContrastRatio(fg, bg);
    const aa = meetsWCAGAA(fg, bg, large);
    const aaa = meetsWCAGAAA(fg, bg, large);

    return {
      foreground: fg,
      background: bg,
      ratio,
      passesAA: aa.passes,
      passesAAA: aaa.passes,
      isLargeText: large,
    };
  });
}
