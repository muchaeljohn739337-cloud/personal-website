/**
 * Silent Mode Utility
 * Suppresses backend notifications and console logs when enabled
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let silentModeEnabled = false;

export const initSilentMode = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/admin/config/silent-mode`);

    // Silently handle 404 - endpoint not yet available
    if (res.status === 404) {
      return false;
    }

    if (!res.ok) {
      return false;
    }

    const data = await res.json();

    silentModeEnabled = data.silentMode || false;

    if (silentModeEnabled) {
      // Suppress console methods
      const noop = () => {};
      window.console.log = noop;
      window.console.info = noop;
      window.console.warn = noop;
      window.console.debug = noop;
      // Keep console.error for critical issues

      console.error("🛑 Silent Mode: Backend notifications suppressed");
    }

    return silentModeEnabled;
  } catch (error) {
    // Silently fail - this is a non-critical feature
    return false;
  }
};

export const isSilentMode = (): boolean => {
  return silentModeEnabled;
};

export const showToastIfAllowed = (
  toastFn: () => void,
  isBackendError = false,
): void => {
  // Only suppress backend errors in silent mode
  if (silentModeEnabled && isBackendError) {
    return; // Suppress
  }
  toastFn(); // Show
};
