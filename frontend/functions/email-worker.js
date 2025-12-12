/**
 * Email Worker - Cloudflare Worker for email routing
 * Handles incoming emails for advanciapayledger.com
 */

export default {
  async email(message, env, _ctx) {
    const { from, to } = message;
    const subject = message.headers.get("subject") || "(No Subject)";

    console.log(`📧 Incoming email from ${from} to ${to}`);
    console.log(`   Subject: ${subject}`);

    try {
      const toAddress = to.toLowerCase();
      const localPart = toAddress.split("@")[0];

      // Route based on recipient
      switch (localPart) {
        case "support":
          await handleSupportEmail(message, env);
          break;
        case "admin":
          await handleAdminEmail(message, env);
          break;
        case "ai":
          await handleAIEmail(message, env);
          break;
        default:
          await handleCatchAllEmail(message, env);
      }

      // Store email metadata in KV
      await storeEmailMetadata(message, env);
    } catch (error) {
      console.error("Email processing error:", error);
    }
  },

  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Get email stats
      if (path === "/api/email/stats") {
        const stats = await getEmailStats(env);
        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get recent emails
      if (path === "/api/email/recent") {
        const emails = await getRecentEmails(env);
        return new Response(JSON.stringify(emails), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Send email
      if (path === "/api/email/send" && request.method === "POST") {
        const data = await request.json();
        const result = await sendEmail(data, env);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Health check
      if (path === "/api/email/health") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            service: "email-worker",
            timestamp: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
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

// Handle support emails - create ticket
async function handleSupportEmail(message, env) {
  const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const ticket = {
    id: ticketId,
    from: message.from,
    subject: message.headers.get("subject"),
    receivedAt: new Date().toISOString(),
    status: "open",
    priority: detectPriority(message.headers.get("subject")),
  };

  await env.ADVANCIA_DATA.put(`ticket:${ticketId}`, JSON.stringify(ticket));

  let ticketList =
    (await env.ADVANCIA_DATA.get("tickets:list", { type: "json" })) || [];
  ticketList.unshift(ticketId);
  ticketList = ticketList.slice(0, 1000);
  await env.ADVANCIA_DATA.put("tickets:list", JSON.stringify(ticketList));

  console.log(`✅ Created support ticket: ${ticketId}`);
}

// Handle admin emails
async function handleAdminEmail(message, env) {
  const subject = message.headers.get("subject") || "";

  const adminLog = {
    from: message.from,
    subject: subject,
    receivedAt: new Date().toISOString(),
  };

  let adminLogs =
    (await env.ADVANCIA_DATA.get("admin:emails", { type: "json" })) || [];
  adminLogs.unshift(adminLog);
  adminLogs = adminLogs.slice(0, 100);
  await env.ADVANCIA_DATA.put("admin:emails", JSON.stringify(adminLogs));
}

// Handle AI emails
async function handleAIEmail(message, env) {
  const aiRequest = {
    id: `AI-${Date.now()}`,
    from: message.from,
    subject: message.headers.get("subject"),
    receivedAt: new Date().toISOString(),
    status: "queued",
  };

  await env.ADVANCIA_DATA.put(
    `ai:request:${aiRequest.id}`,
    JSON.stringify(aiRequest),
  );
}

// Handle catch-all emails
async function handleCatchAllEmail(message, env) {
  const unrouted = {
    from: message.from,
    to: message.to,
    subject: message.headers.get("subject"),
    receivedAt: new Date().toISOString(),
  };

  let unroutedList =
    (await env.ADVANCIA_DATA.get("emails:unrouted", { type: "json" })) || [];
  unroutedList.unshift(unrouted);
  unroutedList = unroutedList.slice(0, 500);
  await env.ADVANCIA_DATA.put("emails:unrouted", JSON.stringify(unroutedList));
}

// Store email metadata
async function storeEmailMetadata(message, env) {
  const metadata = {
    from: message.from,
    to: message.to,
    subject: message.headers.get("subject"),
    receivedAt: new Date().toISOString(),
    messageId: message.headers.get("message-id"),
  };

  let stats = (await env.ADVANCIA_DATA.get("email:stats", {
    type: "json",
  })) || {
    total: 0,
    today: 0,
    lastReset: new Date().toDateString(),
  };

  const today = new Date().toDateString();
  if (stats.lastReset !== today) {
    stats.today = 0;
    stats.lastReset = today;
  }

  stats.total++;
  stats.today++;
  await env.ADVANCIA_DATA.put("email:stats", JSON.stringify(stats));

  let recent =
    (await env.ADVANCIA_DATA.get("emails:recent", { type: "json" })) || [];
  recent.unshift(metadata);
  recent = recent.slice(0, 50);
  await env.ADVANCIA_DATA.put("emails:recent", JSON.stringify(recent));
}

// Detect email priority
function detectPriority(subject) {
  if (!subject) return "normal";
  const lower = subject.toLowerCase();
  if (
    lower.includes("urgent") ||
    lower.includes("emergency") ||
    lower.includes("critical")
  ) {
    return "high";
  }
  if (lower.includes("low priority") || lower.includes("fyi")) {
    return "low";
  }
  return "normal";
}

// Get email stats
async function getEmailStats(env) {
  const stats = await env.ADVANCIA_DATA.get("email:stats", { type: "json" });
  return stats || { total: 0, today: 0 };
}

// Get recent emails
async function getRecentEmails(env) {
  const emails = await env.ADVANCIA_DATA.get("emails:recent", { type: "json" });
  return emails || [];
}

// Send email via external API
async function sendEmail(data, env) {
  const { to, subject, _body, _html } = data;

  console.log(`📤 Would send email to: ${to}`);
  console.log(`   Subject: ${subject}`);

  let outgoing =
    (await env.ADVANCIA_DATA.get("emails:outgoing", { type: "json" })) || [];
  outgoing.unshift({
    to,
    subject,
    sentAt: new Date().toISOString(),
    status: "queued",
  });
  outgoing = outgoing.slice(0, 100);
  await env.ADVANCIA_DATA.put("emails:outgoing", JSON.stringify(outgoing));

  return {
    success: true,
    message: "Email queued for delivery",
  };
}
