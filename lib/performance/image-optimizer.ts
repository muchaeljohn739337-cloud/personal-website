/**
 * Image Optimization Utilities
 * Helper functions for image optimization and conversion
 */

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  width?: number;
  height?: number;
}

/**
 * Generate optimized image URL
 * For use with next/image or CDN
 */
export function getOptimizedImageUrl(src: string, options: ImageOptimizationOptions = {}): string {
  const { quality = 85, format = 'webp', width, height } = options;

  // If using Cloudflare Images or similar CDN
  if (src.includes('cloudflare') || src.includes('cdn')) {
    const params = new URLSearchParams();
    if (format) params.set('format', format);
    if (quality) params.set('quality', quality.toString());
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());

    return `${src}?${params.toString()}`;
  }

  // For local images, Next.js Image component handles optimization
  return src;
}

/**
 * Get image dimensions for responsive images
 */
export function getImageSizes(breakpoints: number[] = [640, 768, 1024, 1280, 1920]): string {
  return breakpoints
    .map((bp, i) => {
      if (i === breakpoints.length - 1) {
        return `${bp}px`;
      }
      return `(max-width: ${bp}px) ${bp}px`;
    })
    .join(', ');
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [640, 768, 1024, 1280, 1920],
  format: 'webp' | 'avif' = 'webp'
): string {
  return widths
    .map((width) => `${getOptimizedImageUrl(baseUrl, { width, format })} ${width}w`)
    .join(', ');
}

/**
 * Check if browser supports AVIF
 */
export function supportsAVIF(): boolean {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
}

/**
 * Get best image format for browser
 */
export function getBestImageFormat(): 'avif' | 'webp' | 'jpg' {
  if (supportsAVIF()) return 'avif';
  // Check WebP support
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'jpg';
}
