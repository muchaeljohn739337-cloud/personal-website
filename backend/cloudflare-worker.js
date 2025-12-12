/**
 * Cloudflare Worker - Auto Maintenance Mode
 *
 * Automatically shows maintenance page if backend returns 500 errors
 * Deploy to Cloudflare Workers to activate
 *
 * Setup:
 * 1. Go to Cloudflare Dashboard > Workers & Pages
 * 2. Create new Worker
 * 3. Paste this code
 * 4. Add route: your-domain.com/*
 * 5. Set environment variable: BACKEND_URL=https://your-backend.com
 */

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

// Health check cache (prevents hammering backend)
let backendHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 10000; // 10 seconds

async function handleRequest(request) {
  const url = new URL(request.url);

  // Always allow health check endpoint
  if (url.pathname === "/api/health") {
    return await checkBackendHealth(request);
  }

  // Check if we need to update backend health status
  const now = Date.now();
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    await updateBackendHealth();
  }

  // If backend is unhealthy, show maintenance page
  if (!backendHealthy && !url.pathname.includes("/maintenance")) {
    return new Response(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Retry-After": "30",
      },
    });
  }

  // Forward request to backend
  try {
    const backendUrl = BACKEND_URL + url.pathname + url.search;
    const backendRequest = new Request(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(backendRequest);

    // If backend returns 500 error, mark as unhealthy
    if (response.status >= 500) {
      backendHealthy = false;
      lastHealthCheck = Date.now();

      // Return maintenance page
      return new Response(MAINTENANCE_HTML, {
        status: 503,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Retry-After": "30",
        },
      });
    }

    return response;
  } catch (error) {
    // Network error, backend is down
    backendHealthy = false;
    lastHealthCheck = Date.now();

    return new Response(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Retry-After": "30",
      },
    });
  }
}

async function checkBackendHealth(request) {
  try {
    const backendUrl = BACKEND_URL + "/api/health";
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: { "User-Agent": "Cloudflare-Worker-Health-Check" },
    });

    if (response.ok) {
      backendHealthy = true;
    } else {
      backendHealthy = false;
    }

    lastHealthCheck = Date.now();
    return response;
  } catch (error) {
    backendHealthy = false;
    lastHealthCheck = Date.now();

    return new Response(
      JSON.stringify({
        status: "error",
        message: "Backend unavailable",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function updateBackendHealth() {
  try {
    const response = await fetch(BACKEND_URL + "/api/health", {
      method: "GET",
      headers: { "User-Agent": "Cloudflare-Worker-Health-Check" },
      timeout: 5000,
    });

    backendHealthy = response.ok;
    lastHealthCheck = Date.now();
  } catch (error) {
    backendHealthy = false;
    lastHealthCheck = Date.now();
  }
}

// Maintenance page HTML (inline to avoid external dependencies)
const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Maintenance - We'll Be Right Back</title>
  <meta http-equiv="refresh" content="30">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      width: 100%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 60px 40px;
      border-radius: 30px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: fadeIn 0.5s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon { font-size: 80px; margin-bottom: 30px; }
    h1 { font-size: 42px; font-weight: 700; margin-bottom: 20px; }
    .subtitle { font-size: 20px; margin-bottom: 40px; opacity: 0.9; }
    .spinner {
      border: 5px solid rgba(255, 255, 255, 0.3);
      border-top: 5px solid white;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
      margin: 40px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .status { font-size: 14px; opacity: 0.7; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>System Upgrade in Progress</h1>
    <p class="subtitle">We're making your experience even better!</p>
    <div class="spinner"></div>
    <p>Estimated completion: 2-5 minutes</p>
    <p class="status">Auto-refreshing every 30 seconds...</p>
  </div>
  <script>
    setTimeout(() => location.reload(), 30000);
    setInterval(async () => {
      try {
        const r = await fetch('/api/health');
        if (r.ok) window.location.href = '/';
      } catch (e) {}
    }, 10000);
  </script>
</body>
</html>`;

// Configuration (set in Cloudflare Worker environment variables)
const BACKEND_URL = typeof BACKEND_URL !== "undefined" ? BACKEND_URL : "http://localhost:4000";
