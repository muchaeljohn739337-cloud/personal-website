"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Silent Mode Provider
 * Checks backend configuration and enables Silent Mode globally
 * - Suppresses console logs in production
 * - Sets window.__SILENT_MODE__ flag for toast wrapper
 * - Fetches config on app mount
 */
export default function SilentModeProvider() {
  useEffect(() => {
    const checkSilentMode = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/config/silent-mode`,
          {
            credentials: "include",
          },
        );

        // Silently handle 404/502 - endpoint not yet available or failing
        if (
          response.status === 404 ||
          response.status === 502 ||
          !response.ok
        ) {
          if (typeof window !== "undefined") {
            window.__SILENT_MODE__ = false;
          }
          return;
        }

        const data = await response.json();

        if (data.silentMode) {
          // Set global flag for toast wrapper
          if (typeof window !== "undefined") {
            window.__SILENT_MODE__ = true;
          }

          // Suppress console logs in production
          if (process.env.NODE_ENV === "production") {
            const noop = () => {};
            console.log = noop;
            console.info = noop;
            console.warn = noop;
            // Keep console.error for critical debugging
          }

          console.log("🔇 Silent Mode activated");
        } else {
          if (typeof window !== "undefined") {
            window.__SILENT_MODE__ = false;
          }
        }
      } catch {
        // Silently fail - this is a non-critical feature
        if (typeof window !== "undefined") {
          window.__SILENT_MODE__ = false;
        }
      }
    };

    checkSilentMode();
  }, []);

  // This component doesn't render anything
  return null;
}
