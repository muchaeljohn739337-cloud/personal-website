/**
 * AI Connector - Cloudflare Worker for AI state management
 * Handles AI requests, session management, and Durable Objects for state
 */

// Durable Object for AI State Management
export class AIStateManager {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (request.method) {
        case "GET":
          return this.handleGet(path);
        case "POST":
          return this.handlePost(path, await request.json());
        case "DELETE":
          return this.handleDelete(path);
        default:
          return new Response("Method not allowed", { status: 405 });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  async handleGet(path) {
    if (path === "/state") {
      const state = await this.state.storage.get("aiState");
      return new Response(JSON.stringify(state || {}), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/sessions") {
      const sessions = await this.state.storage.get("sessions");
      return new Response(JSON.stringify(sessions || []), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/health") {
      return new Response(
        JSON.stringify({ status: "healthy", timestamp: Date.now() }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Not found", { status: 404 });
  }

  async handlePost(path, data) {
    if (path === "/state") {
      await this.state.storage.put("aiState", data);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/session") {
      const sessionId = crypto.randomUUID();
      const session = {
        id: sessionId,
        userId: data.userId,
        context: data.context || {},
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      let sessions = (await this.state.storage.get("sessions")) || [];
      sessions.push(session);
      await this.state.storage.put("sessions", sessions);

      return new Response(JSON.stringify(session), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/chat") {
      const { sessionId, message, _userId } = data;

      let history = (await this.state.storage.get(`chat:${sessionId}`)) || [];
      history.push({
        role: "user",
        content: message,
        timestamp: Date.now(),
      });

      // Mock AI response (replace with actual AI API call)
      const aiResponse = {
        role: "assistant",
        content: `Processed: ${message}`,
        timestamp: Date.now(),
      };
      history.push(aiResponse);

      await this.state.storage.put(`chat:${sessionId}`, history);

      return new Response(JSON.stringify(aiResponse), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }

  async handleDelete(path) {
    if (path.startsWith("/session/")) {
      const sessionId = path.split("/")[2];
      let sessions = (await this.state.storage.get("sessions")) || [];
      sessions = sessions.filter((s) => s.id !== sessionId);
      await this.state.storage.put("sessions", sessions);
      await this.state.storage.delete(`chat:${sessionId}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}

// Main Worker Handler
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
      // Health check
      if (path === "/api/ai/health") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            service: "ai-connector",
            timestamp: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Route to Durable Object for state management
      if (
        path.startsWith("/api/ai/state") ||
        path.startsWith("/api/ai/session") ||
        path.startsWith("/api/ai/chat")
      ) {
        const id = env.AI_STATE.idFromName("global");
        const stub = env.AI_STATE.get(id);

        const doPath = path.replace("/api/ai", "");
        const doRequest = new Request(`https://ai-state${doPath}`, {
          method: request.method,
          headers: request.headers,
          body: request.method !== "GET" ? request.body : undefined,
        });

        const response = await stub.fetch(doRequest);
        const data = await response.text();

        return new Response(data, {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // KV Storage operations
      if (path.startsWith("/api/ai/kv")) {
        return handleKVOperations(request, env, corsHeaders);
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

// KV Storage Handler
async function handleKVOperations(request, env, corsHeaders) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response(JSON.stringify({ error: "Key parameter required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    switch (request.method) {
      case "GET": {
        const value = await env.ADVANCIA_DATA.get(key, { type: "json" });
        return new Response(JSON.stringify({ key, value }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      case "POST":
      case "PUT": {
        const data = await request.json();
        await env.ADVANCIA_DATA.put(key, JSON.stringify(data.value));
        return new Response(JSON.stringify({ success: true, key }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      case "DELETE": {
        await env.ADVANCIA_DATA.delete(key);
        return new Response(JSON.stringify({ success: true, key }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
