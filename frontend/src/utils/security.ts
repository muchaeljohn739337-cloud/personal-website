/**
 * Security utility functions for input sanitization and validation
 */

/**
 * Validates if a URL is safe for redirect (same origin or whitelisted domain)
 * @param url - URL to validate
 * @param allowedDomains - Optional array of allowed external domains
 * @returns true if URL is safe, false otherwise
 */
export function isSafeRedirectUrl(
  url: string,
  allowedDomains: string[] = []
): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);

    // Allow relative URLs (same origin)
    if (urlObj.origin === window.location.origin) {
      return true;
    }

    // Check against whitelist
    const hostname = urlObj.hostname;
    return allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitizes a URL for safe external linking
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeExternalUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitizes transaction hash for use in Etherscan URLs
 * @param txHash - Transaction hash to sanitize
 * @returns Sanitized hash or null if invalid
 */
export function sanitizeTxHash(txHash: string): string | null {
  // Ethereum transaction hash should be 66 characters (0x + 64 hex chars)
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;

  if (txHashRegex.test(txHash)) {
    return txHash;
  }

  return null;
}

/**
 * Sanitizes Ethereum address
 * @param address - Ethereum address to sanitize
 * @returns Sanitized address or null if invalid
 */
export function sanitizeEthAddress(address: string): string | null {
  // Ethereum address should be 42 characters (0x + 40 hex chars)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;

  if (addressRegex.test(address)) {
    return address;
  }

  return null;
}

/**
 * Validates and sanitizes data URL (for QR codes, etc.)
 * @param dataUrl - Data URL to validate
 * @param allowedMimeTypes - Array of allowed MIME types
 * @returns Sanitized data URL or null if invalid
 */
export function sanitizeDataUrl(
  dataUrl: string,
  allowedMimeTypes: string[] = ["image/png", "image/jpeg", "image/gif"]
): string | null {
  try {
    if (!dataUrl.startsWith("data:")) {
      return null;
    }

    const [header] = dataUrl.split(",");
    const mimeTypeMatch = header.match(/data:([^;]+)/);

    if (!mimeTypeMatch) {
      return null;
    }

    const mimeType = mimeTypeMatch[1];

    if (allowedMimeTypes.includes(mimeType)) {
      return dataUrl;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Safely redirect to a validated URL
 * @param url - URL to redirect to
 * @param allowedDomains - Optional array of allowed external domains
 */
export function safeRedirect(url: string, allowedDomains: string[] = []): void {
  if (isSafeRedirectUrl(url, allowedDomains)) {
    window.location.href = url;
  } else {
    console.error("Attempted redirect to unsafe URL:", url);
    // Optionally show error to user
    throw new Error("Invalid redirect URL");
  }
}

/**
 * Whitelist of trusted payment/redirect domains
 */
export const TRUSTED_REDIRECT_DOMAINS = [
  "stripe.com",
  "checkout.stripe.com",
  "advanciapayledger.com",
  "api.advanciapayledger.com",
];

/**
 * Whitelist of trusted blockchain explorer domains
 */
export const TRUSTED_EXPLORER_DOMAINS = [
  "etherscan.io",
  "polygonscan.com",
  "bscscan.com",
];
