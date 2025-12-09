/**
 * Global Setup for Playwright Tests
 * Fixes Node.js compatibility issues
 */

import { chromium, FullConfig } from '@playwright/test';

// Polyfill TransformStream for Node.js < 18
if (typeof globalThis.TransformStream === 'undefined') {
  // @ts-expect-error - Polyfill for older Node.js versions
  globalThis.TransformStream = class TransformStream {
    readable: ReadableStream;
    writable: WritableStream;

    constructor() {
      // Create minimal polyfill
      this.readable = new ReadableStream({
        start() {
          // Empty implementation
        },
      });
      this.writable = new WritableStream({
        write() {
          // Empty implementation
        },
      });
    }
  };

  // Also polyfill ReadableStream and WritableStream if needed
  if (typeof globalThis.ReadableStream === 'undefined') {
    // @ts-expect-error - Polyfill for older Node.js versions
    globalThis.ReadableStream = class ReadableStream {
      constructor() {
        // Minimal implementation
      }
    };
  }

  if (typeof globalThis.WritableStream === 'undefined') {
    // @ts-expect-error - Polyfill for older Node.js versions
    globalThis.WritableStream = class WritableStream {
      constructor() {
        // Minimal implementation
      }
    };
  }
}

async function globalSetup(config: FullConfig) {
  // Setup test environment
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Wait for server to be ready
  await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000');
  await page.waitForLoadState('networkidle');

  await browser.close();
}

export default globalSetup;
