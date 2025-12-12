/**
 * Test KV - Cloudflare Worker for testing KV namespace
 * Use this to verify KV connectivity and operations
 */

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Test KV connection
      if (path === "/api/test/kv" || path === "/api/test/kv/health") {
        const testKey = "__kv_health_check__";
        const testValue = { timestamp: Date.now(), test: true };

        await env.ADVANCIA_DATA.put(testKey, JSON.stringify(testValue));
        const readValue = await env.ADVANCIA_DATA.get(testKey, {
          type: "json",
        });
        await env.ADVANCIA_DATA.delete(testKey);

        const success =
          readValue && readValue.timestamp === testValue.timestamp;

        return new Response(
          JSON.stringify({
            status: success ? "healthy" : "unhealthy",
            kvNamespace: "ADVANCIA_DATA",
            writeTest: "passed",
            readTest: success ? "passed" : "failed",
            timestamp: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // List keys
      if (path === "/api/test/kv/list") {
        const prefix = url.searchParams.get("prefix") || "";
        const limit = parseInt(url.searchParams.get("limit") || "100");

        const list = await env.ADVANCIA_DATA.list({ prefix, limit });

        return new Response(
          JSON.stringify({
            keys: list.keys.map((k) => ({
              name: k.name,
              expiration: k.expiration,
              metadata: k.metadata,
            })),
            complete: list.list_complete,
            cursor: list.cursor,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Get single key
      if (path === "/api/test/kv/get") {
        const key = url.searchParams.get("key");
        if (!key) {
          return new Response(
            JSON.stringify({ error: "Key parameter required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const value = await env.ADVANCIA_DATA.get(key, { type: "json" });

        return new Response(
          JSON.stringify({ key, value, exists: value !== null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Set key
      if (path === "/api/test/kv/set" && request.method === "POST") {
        const { key, value, expirationTtl } = await request.json();

        if (!key) {
          return new Response(JSON.stringify({ error: "Key is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const options = {};
        if (expirationTtl) {
          options.expirationTtl = expirationTtl;
        }

        await env.ADVANCIA_DATA.put(key, JSON.stringify(value), options);

        return new Response(JSON.stringify({ success: true, key }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete key
      if (path === "/api/test/kv/delete" && request.method === "DELETE") {
        const key = url.searchParams.get("key");
        if (!key) {
          return new Response(
            JSON.stringify({ error: "Key parameter required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        await env.ADVANCIA_DATA.delete(key);

        return new Response(JSON.stringify({ success: true, key }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Stats
      if (path === "/api/test/kv/stats") {
        const allKeys = await env.ADVANCIA_DATA.list({ limit: 1000 });

        const categories = {};
        for (const key of allKeys.keys) {
          const prefix = key.name.split(":")[0] || "other";
          categories[prefix] = (categories[prefix] || 0) + 1;
        }

        return new Response(
          JSON.stringify({
            totalKeys: allKeys.keys.length,
            hasMore: !allKeys.list_complete,
            categories,
            timestamp: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          error: "Not found",
          availableEndpoints: [
            "GET /api/test/kv - Health check",
            "GET /api/test/kv/list?prefix=&limit=100 - List keys",
            "GET /api/test/kv/get?key=<key> - Get value",
            "POST /api/test/kv/set - Set value",
            "DELETE /api/test/kv/delete?key=<key> - Delete key",
            "GET /api/test/kv/stats - KV statistics",
          ],
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
