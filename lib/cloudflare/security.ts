/**
 * Cloudflare Security Integration
 * WAF, DDoS Protection, Bot Management, and Security Analytics
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// =============================================================================
// API HELPERS
// =============================================================================

async function cloudflareAPI(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: Record<string, unknown>,
  isAccountLevel = false
) {
  if (!CLOUDFLARE_API_TOKEN) {
    throw new Error('Cloudflare API token not configured');
  }

  const baseUrl = isAccountLevel
    ? `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}`
    : `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}`;

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Cloudflare API error');
  }

  return data.result;
}

// =============================================================================
// WAF (Web Application Firewall)
// =============================================================================

export interface WAFRule {
  id: string;
  description: string;
  action: 'block' | 'challenge' | 'js_challenge' | 'managed_challenge' | 'log';
  expression: string;
  enabled: boolean;
  priority: number;
}

/**
 * Get all WAF custom rules
 */
export async function getWAFRules(): Promise<WAFRule[]> {
  try {
    const rules = await cloudflareAPI('/firewall/rules');
    return rules.map((rule: Record<string, unknown>) => ({
      id: rule.id,
      description: rule.description,
      action: rule.action,
      expression: (rule.filter as Record<string, unknown>)?.expression,
      enabled: !rule.paused,
      priority: rule.priority,
    }));
  } catch (error) {
    console.error('Failed to get WAF rules:', error);
    return [];
  }
}

/**
 * Create WAF rule
 */
export async function createWAFRule(rule: Omit<WAFRule, 'id'>): Promise<WAFRule | null> {
  try {
    // First create the filter
    const [filter] = await cloudflareAPI('/filters', 'POST', [
      {
        expression: rule.expression,
        description: rule.description,
      },
    ]);

    // Then create the firewall rule
    const [firewallRule] = await cloudflareAPI('/firewall/rules', 'POST', [
      {
        filter: { id: filter.id },
        action: rule.action,
        description: rule.description,
        paused: !rule.enabled,
        priority: rule.priority,
      },
    ]);

    return {
      id: firewallRule.id,
      description: firewallRule.description,
      action: firewallRule.action,
      expression: rule.expression,
      enabled: !firewallRule.paused,
      priority: firewallRule.priority,
    };
  } catch (error) {
    console.error('Failed to create WAF rule:', error);
    return null;
  }
}

/**
 * Delete WAF rule
 */
export async function deleteWAFRule(ruleId: string): Promise<boolean> {
  try {
    await cloudflareAPI(`/firewall/rules/${ruleId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Failed to delete WAF rule:', error);
    return false;
  }
}

/**
 * Common WAF rule templates
 */
export const WAF_RULE_TEMPLATES = {
  // Block known bad bots
  blockBadBots: {
    description: 'Block known bad bots',
    action: 'block' as const,
    expression: '(cf.client.bot) or (cf.threat_score gt 30)',
    enabled: true,
    priority: 1,
  },

  // Block SQL injection attempts
  blockSQLInjection: {
    description: 'Block SQL injection attempts',
    action: 'block' as const,
    expression:
      '(http.request.uri.query contains "SELECT" and http.request.uri.query contains "FROM") or (http.request.uri.query contains "UNION" and http.request.uri.query contains "SELECT") or (http.request.uri.query contains "DROP TABLE")',
    enabled: true,
    priority: 2,
  },

  // Block XSS attempts
  blockXSS: {
    description: 'Block XSS attempts',
    action: 'block' as const,
    expression:
      '(http.request.uri.query contains "<script") or (http.request.uri.query contains "javascript:") or (http.request.uri.query contains "onerror=")',
    enabled: true,
    priority: 3,
  },

  // Challenge suspicious requests
  challengeSuspicious: {
    description: 'Challenge suspicious requests',
    action: 'managed_challenge' as const,
    expression: '(cf.threat_score gt 10) and (cf.threat_score le 30)',
    enabled: true,
    priority: 10,
  },

  // Block requests from specific countries (example)
  blockCountries: {
    description: 'Block high-risk countries',
    action: 'block' as const,
    expression: '(ip.geoip.country in {"XX" "YY"})', // Replace with actual country codes
    enabled: false,
    priority: 5,
  },

  // Rate limit login attempts
  rateLimitLogin: {
    description: 'Rate limit login attempts',
    action: 'challenge' as const,
    expression:
      '(http.request.uri.path contains "/auth/login") and (http.request.method eq "POST")',
    enabled: true,
    priority: 4,
  },

  // Protect API endpoints
  protectAPI: {
    description: 'Protect API endpoints',
    action: 'managed_challenge' as const,
    expression: '(http.request.uri.path contains "/api/") and (not cf.bot_management.verified_bot)',
    enabled: true,
    priority: 6,
  },
};

// =============================================================================
// DDOS PROTECTION
// =============================================================================

export interface DDoSSettings {
  mode: 'off' | 'low' | 'medium' | 'high' | 'under_attack';
  rulesets: DDoSRuleset[];
}

export interface DDoSRuleset {
  id: string;
  name: string;
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high' | 'default';
}

/**
 * Get DDoS protection settings
 */
export async function getDDoSSettings(): Promise<DDoSSettings | null> {
  try {
    const settings = await cloudflareAPI('/settings/security_level');
    const rulesets = await cloudflareAPI('/rulesets?phase=ddos_l7');

    return {
      mode: settings.value,
      rulesets: rulesets.map((rs: Record<string, unknown>) => ({
        id: rs.id,
        name: rs.name,
        enabled: true,
        sensitivity: 'default',
      })),
    };
  } catch (error) {
    console.error('Failed to get DDoS settings:', error);
    return null;
  }
}

/**
 * Enable Under Attack Mode
 */
export async function enableUnderAttackMode(): Promise<boolean> {
  try {
    await cloudflareAPI('/settings/security_level', 'PATCH', {
      value: 'under_attack',
    });
    return true;
  } catch (error) {
    console.error('Failed to enable under attack mode:', error);
    return false;
  }
}

/**
 * Disable Under Attack Mode
 */
export async function disableUnderAttackMode(
  level: 'low' | 'medium' | 'high' = 'medium'
): Promise<boolean> {
  try {
    await cloudflareAPI('/settings/security_level', 'PATCH', {
      value: level,
    });
    return true;
  } catch (error) {
    console.error('Failed to disable under attack mode:', error);
    return false;
  }
}

// =============================================================================
// BOT MANAGEMENT
// =============================================================================

export interface BotManagementSettings {
  enabled: boolean;
  fightMode: boolean;
  sbfmDefinitelyAutomated: 'allow' | 'block' | 'managed_challenge';
  sbfmLikelyAutomated: 'allow' | 'block' | 'managed_challenge';
  sbfmVerifiedBots: 'allow' | 'block';
}

/**
 * Get bot management settings
 */
export async function getBotManagementSettings(): Promise<BotManagementSettings | null> {
  try {
    const settings = await cloudflareAPI('/bot_management');
    return {
      enabled: settings.fight_mode || settings.sbfm_definitely_automated !== 'allow',
      fightMode: settings.fight_mode,
      sbfmDefinitelyAutomated: settings.sbfm_definitely_automated,
      sbfmLikelyAutomated: settings.sbfm_likely_automated,
      sbfmVerifiedBots: settings.sbfm_verified_bots,
    };
  } catch (error) {
    console.error('Failed to get bot management settings:', error);
    return null;
  }
}

/**
 * Update bot management settings
 */
export async function updateBotManagement(
  settings: Partial<BotManagementSettings>
): Promise<boolean> {
  try {
    await cloudflareAPI('/bot_management', 'PUT', {
      fight_mode: settings.fightMode,
      sbfm_definitely_automated: settings.sbfmDefinitelyAutomated,
      sbfm_likely_automated: settings.sbfmLikelyAutomated,
      sbfm_verified_bots: settings.sbfmVerifiedBots,
    });
    return true;
  } catch (error) {
    console.error('Failed to update bot management:', error);
    return false;
  }
}

// =============================================================================
// IP ACCESS RULES
// =============================================================================

export interface IPAccessRule {
  id: string;
  mode: 'block' | 'challenge' | 'whitelist' | 'js_challenge' | 'managed_challenge';
  configuration: {
    target: 'ip' | 'ip_range' | 'asn' | 'country';
    value: string;
  };
  notes: string;
  createdOn: Date;
}

/**
 * Get IP access rules
 */
export async function getIPAccessRules(): Promise<IPAccessRule[]> {
  try {
    const rules = await cloudflareAPI('/firewall/access_rules/rules');
    return rules.map((rule: Record<string, unknown>) => ({
      id: rule.id,
      mode: rule.mode,
      configuration: rule.configuration,
      notes: rule.notes,
      createdOn: new Date(rule.created_on as string),
    }));
  } catch (error) {
    console.error('Failed to get IP access rules:', error);
    return [];
  }
}

/**
 * Block IP address
 */
export async function blockIP(ip: string, notes?: string): Promise<IPAccessRule | null> {
  try {
    const rule = await cloudflareAPI('/firewall/access_rules/rules', 'POST', {
      mode: 'block',
      configuration: {
        target: ip.includes('/') ? 'ip_range' : 'ip',
        value: ip,
      },
      notes: notes || `Blocked by Advancia Security at ${new Date().toISOString()}`,
    });

    return {
      id: rule.id,
      mode: rule.mode,
      configuration: rule.configuration,
      notes: rule.notes,
      createdOn: new Date(rule.created_on),
    };
  } catch (error) {
    console.error('Failed to block IP:', error);
    return null;
  }
}

/**
 * Whitelist IP address
 */
export async function whitelistIP(ip: string, notes?: string): Promise<IPAccessRule | null> {
  try {
    const rule = await cloudflareAPI('/firewall/access_rules/rules', 'POST', {
      mode: 'whitelist',
      configuration: {
        target: ip.includes('/') ? 'ip_range' : 'ip',
        value: ip,
      },
      notes: notes || `Whitelisted by Advancia at ${new Date().toISOString()}`,
    });

    return {
      id: rule.id,
      mode: rule.mode,
      configuration: rule.configuration,
      notes: rule.notes,
      createdOn: new Date(rule.created_on),
    };
  } catch (error) {
    console.error('Failed to whitelist IP:', error);
    return null;
  }
}

/**
 * Remove IP access rule
 */
export async function removeIPRule(ruleId: string): Promise<boolean> {
  try {
    await cloudflareAPI(`/firewall/access_rules/rules/${ruleId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Failed to remove IP rule:', error);
    return false;
  }
}

// =============================================================================
// SECURITY ANALYTICS
// =============================================================================

export interface SecurityAnalytics {
  threats: {
    total: number;
    blocked: number;
    challenged: number;
    byCountry: Record<string, number>;
    byType: Record<string, number>;
  };
  requests: {
    total: number;
    cached: number;
    uncached: number;
    encrypted: number;
  };
  bandwidth: {
    total: number;
    cached: number;
    uncached: number;
  };
}

/**
 * Get security analytics
 */
export async function getSecurityAnalytics(
  since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)
): Promise<SecurityAnalytics | null> {
  try {
    const analytics = await cloudflareAPI(
      `/analytics/dashboard?since=${since.toISOString()}&until=${new Date().toISOString()}`
    );

    const totals = analytics.totals;

    return {
      threats: {
        total: totals.threats?.all || 0,
        blocked: totals.threats?.type?.block || 0,
        challenged: totals.threats?.type?.challenge || 0,
        byCountry: totals.threats?.country || {},
        byType: totals.threats?.type || {},
      },
      requests: {
        total: totals.requests?.all || 0,
        cached: totals.requests?.cached || 0,
        uncached: totals.requests?.uncached || 0,
        encrypted: totals.requests?.ssl?.encrypted || 0,
      },
      bandwidth: {
        total: totals.bandwidth?.all || 0,
        cached: totals.bandwidth?.cached || 0,
        uncached: totals.bandwidth?.uncached || 0,
      },
    };
  } catch (error) {
    console.error('Failed to get security analytics:', error);
    return null;
  }
}

// =============================================================================
// SECURITY HEADERS
// =============================================================================

/**
 * Configure security headers via Page Rules or Transform Rules
 */
export async function configureSecurityHeaders(): Promise<boolean> {
  try {
    // Create transform rule for security headers
    await cloudflareAPI('/rules/lists', 'POST', {
      name: 'Security Headers',
      kind: 'http_response_headers_transform',
      phase: 'http_response_headers_transform',
      rules: [
        {
          expression: 'true',
          action: 'rewrite',
          action_parameters: {
            headers: {
              'X-Content-Type-Options': { operation: 'set', value: 'nosniff' },
              'X-Frame-Options': { operation: 'set', value: 'SAMEORIGIN' },
              'X-XSS-Protection': { operation: 'set', value: '1; mode=block' },
              'Referrer-Policy': { operation: 'set', value: 'strict-origin-when-cross-origin' },
              'Permissions-Policy': {
                operation: 'set',
                value: 'camera=(), microphone=(), geolocation=(self)',
              },
              'Content-Security-Policy': {
                operation: 'set',
                value:
                  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
              },
            },
          },
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Failed to configure security headers:', error);
    return false;
  }
}

// =============================================================================
// SSL/TLS SETTINGS
// =============================================================================

export interface SSLSettings {
  mode: 'off' | 'flexible' | 'full' | 'strict';
  minVersion: '1.0' | '1.1' | '1.2' | '1.3';
  earlyHints: boolean;
  alwaysUseHTTPS: boolean;
  automaticHTTPSRewrites: boolean;
}

/**
 * Get SSL/TLS settings
 */
export async function getSSLSettings(): Promise<SSLSettings | null> {
  try {
    const [ssl, minVersion, earlyHints, alwaysHTTPS, autoRewrites] = await Promise.all([
      cloudflareAPI('/settings/ssl'),
      cloudflareAPI('/settings/min_tls_version'),
      cloudflareAPI('/settings/early_hints'),
      cloudflareAPI('/settings/always_use_https'),
      cloudflareAPI('/settings/automatic_https_rewrites'),
    ]);

    return {
      mode: ssl.value,
      minVersion: minVersion.value,
      earlyHints: earlyHints.value === 'on',
      alwaysUseHTTPS: alwaysHTTPS.value === 'on',
      automaticHTTPSRewrites: autoRewrites.value === 'on',
    };
  } catch (error) {
    console.error('Failed to get SSL settings:', error);
    return null;
  }
}

/**
 * Configure optimal SSL settings
 */
export async function configureOptimalSSL(): Promise<boolean> {
  try {
    await Promise.all([
      cloudflareAPI('/settings/ssl', 'PATCH', { value: 'strict' }),
      cloudflareAPI('/settings/min_tls_version', 'PATCH', { value: '1.2' }),
      cloudflareAPI('/settings/always_use_https', 'PATCH', { value: 'on' }),
      cloudflareAPI('/settings/automatic_https_rewrites', 'PATCH', { value: 'on' }),
      cloudflareAPI('/settings/opportunistic_encryption', 'PATCH', { value: 'on' }),
      cloudflareAPI('/settings/tls_1_3', 'PATCH', { value: 'on' }),
    ]);

    return true;
  } catch (error) {
    console.error('Failed to configure SSL:', error);
    return false;
  }
}
