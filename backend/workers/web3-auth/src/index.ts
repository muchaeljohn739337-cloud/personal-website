/**
 * Cloudflare Worker: Web3 Authentication Edge Service
 *
 * Handles signature verification at the edge for low-latency Web3 authentication.
 * Uses Cloudflare KV for nonce storage and rate limiting.
 */

// Cloudflare Worker types
interface KVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: "text"): Promise<string | null>;
  get(key: string, type: "json"): Promise<any>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

interface Env {
  WEB3_NONCES: KVNamespace;
  RATE_LIMITS: KVNamespace;
  JWT_SECRET: string;
  BACKEND_URL: string;
}

interface NonceData {
  nonce: string;
  expiresAt: number;
  attempts: number;
}

/**
 * Verify Ethereum signature using Web Crypto API
 */
async function verifySignature(message: string, signature: string, expectedAddress: string): Promise<boolean> {
  try {
    // Remove 0x prefix if present
    const sig = signature.startsWith("0x") ? signature.slice(2) : signature;

    // Parse signature components (r, s, v)
    if (sig.length !== 130) {
      // eslint-disable-next-line no-console
      console.error("Invalid signature length");
      return false;
    }

    const r = sig.slice(0, 64);
    const s = sig.slice(64, 128);
    const v = parseInt(sig.slice(128, 130), 16);

    // Ethereum signed message prefix
    const prefix = "\x19Ethereum Signed Message:\n";
    const prefixedMessage = prefix + message.length.toString() + message;

    // Hash the message
    const msgBuffer = new TextEncoder().encode(prefixedMessage);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _msgHash = await crypto.subtle.digest("SHA-256", msgBuffer);

    // Note: Full ECDSA verification requires secp256k1 library
    // This is a simplified version for demonstration
    // In production, use a proper library or proxy to backend

    // eslint-disable-next-line no-console
    console.log("Signature verification attempted:", {
      address: expectedAddress,
      r: r.slice(0, 10) + "...",
      s: s.slice(0, 10) + "...",
      v,
    });

    // For now, proxy to backend for full verification
    return true; // Placeholder - implement full verification or proxy
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Generate cryptographically secure random nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Check rate limiting
 */
async function checkRateLimit(env: Env, walletAddress: string): Promise<boolean> {
  const key = `ratelimit:${walletAddress.toLowerCase()}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const stored = (await env.RATE_LIMITS.get(key, "json")) as number[] | null;
  let requests = stored || [];

  // Filter out old requests
  requests = requests.filter((timestamp) => now - timestamp < windowMs);

  if (requests.length >= maxRequests) {
    return false;
  }

  requests.push(now);
  await env.RATE_LIMITS.put(key, JSON.stringify(requests), {
    expirationTtl: 120, // 2 minutes
  });

  return true;
}

/**
 * CORS headers
 */
function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(origin || undefined),
      });
    }

    try {
      // Route: POST /nonce - Generate nonce
      if (url.pathname === "/nonce" && request.method === "POST") {
        const body = (await request.json()) as { walletAddress: string };
        const { walletAddress } = body;

        if (!walletAddress) {
          return new Response(JSON.stringify({ error: "Wallet address required" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin || undefined),
            },
          });
        }

        // Rate limiting
        const allowed = await checkRateLimit(env, walletAddress);
        if (!allowed) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin || undefined),
            },
          });
        }

        // Generate nonce
        const nonce = generateNonce();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store in KV
        const nonceData: NonceData = {
          nonce,
          expiresAt,
          attempts: 0,
        };

        await env.WEB3_NONCES.put(`nonce:${walletAddress.toLowerCase()}`, JSON.stringify(nonceData), {
          expirationTtl: 300, // 5 minutes
        });

        // Create SIWE message
        const domain = url.hostname;
        const message = `${domain} wants you to sign in with your Ethereum account:
${walletAddress}

Sign in with Ethereum to the app.

URI: https://${domain}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

        return new Response(
          JSON.stringify({
            nonce,
            message,
            expiresIn: 300,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin || undefined),
            },
          }
        );
      }

      // Route: POST /verify - Verify signature (proxy to backend)
      if (url.pathname === "/verify" && request.method === "POST") {
        const body = (await request.json()) as {
          walletAddress: string;
          signature: string;
          message: string;
        };

        const { walletAddress, signature, message } = body;

        if (!walletAddress || !signature || !message) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin || undefined),
            },
          });
        }

        // Validate nonce from KV
        const key = `nonce:${walletAddress.toLowerCase()}`;
        const stored = (await env.WEB3_NONCES.get(key, "json")) as NonceData | null;

        if (!stored) {
          return new Response(JSON.stringify({ error: "Nonce not found or expired" }), {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin || undefined),
            },
          });
        }

        // Check expiration
        if (Date.now() > stored.expiresAt) {
          await env.WEB3_NONCES.delete(key);
          return new Response(JSON.stringify({ error: "Nonce expired" }), {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin || undefined),
            },
          });
        }

        // Extract nonce from message
        const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
        if (!nonceMatch || nonceMatch[1] !== stored.nonce) {
          return new Response(JSON.stringify({ error: "Invalid nonce" }), {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin || undefined),
            },
          });
        }

        // Proxy to backend for full signature verification
        const backendResponse = await fetch(`${env.BACKEND_URL}/api/auth/web3/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ walletAddress, signature, message }),
        });

        // Delete nonce after verification attempt
        await env.WEB3_NONCES.delete(key);

        const result = await backendResponse.json();

        return new Response(JSON.stringify(result), {
          status: backendResponse.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin || undefined),
          },
        });
      }

      // Route: GET /health - Health check
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            service: "web3-auth-edge",
            timestamp: new Date().toISOString(),
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(origin || undefined),
            },
          }
        );
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin || undefined),
        },
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin || undefined),
          },
        }
      );
    }
  },
};
