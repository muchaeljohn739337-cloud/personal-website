/**
 * Email Routing & Forwarding System
 * Enterprise-grade email management with Cloudflare Email Routing
 */

import { prisma } from '@/lib/prismaClient';

// Email routing configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const PRIMARY_DOMAIN = process.env.PRIMARY_DOMAIN || 'advanciapayledger.com';

// =============================================================================
// EMAIL ROUTING TYPES
// =============================================================================

export interface EmailRoute {
  id: string;
  name: string;
  pattern: string; // e.g., "support@domain.com" or "*@domain.com"
  destination: string; // Forward to this address
  enabled: boolean;
  priority: number;
  actions: EmailAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAction {
  type: 'forward' | 'drop' | 'worker' | 'mailbox';
  value?: string;
}

export interface EmailForwarder {
  id: string;
  sourceEmail: string;
  destinationEmail: string;
  enabled: boolean;
  verified: boolean;
  createdAt: Date;
}

export interface EmailAlias {
  id: string;
  alias: string;
  targetEmail: string;
  userId?: string;
  enabled: boolean;
  description?: string;
}

// =============================================================================
// CLOUDFLARE EMAIL ROUTING API
// =============================================================================

async function cloudflareRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: Record<string, unknown>
) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    throw new Error('Cloudflare API credentials not configured');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}${endpoint}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Cloudflare API error');
  }

  return data.result;
}

// =============================================================================
// EMAIL ROUTING FUNCTIONS
// =============================================================================

/**
 * Get all email routing rules
 */
export async function getEmailRoutes(): Promise<EmailRoute[]> {
  try {
    const rules = await cloudflareRequest('/email/routing/rules');
    return rules.map((rule: Record<string, unknown>) => ({
      id: rule.id,
      name: rule.name,
      pattern: rule.matchers?.[0]?.value || '',
      destination: rule.actions?.[0]?.value?.[0] || '',
      enabled: rule.enabled,
      priority: rule.priority,
      actions: rule.actions,
      createdAt: new Date(rule.created as string),
      updatedAt: new Date(rule.modified as string),
    }));
  } catch (error) {
    console.error('Failed to get email routes:', error);
    return [];
  }
}

/**
 * Create email routing rule
 */
export async function createEmailRoute(
  pattern: string,
  destination: string,
  options: {
    name?: string;
    enabled?: boolean;
    priority?: number;
  } = {}
): Promise<EmailRoute | null> {
  try {
    const rule = await cloudflareRequest('/email/routing/rules', 'POST', {
      name: options.name || `Route: ${pattern}`,
      enabled: options.enabled ?? true,
      priority: options.priority || 0,
      matchers: [
        {
          type: 'literal',
          field: 'to',
          value: pattern,
        },
      ],
      actions: [
        {
          type: 'forward',
          value: [destination],
        },
      ],
    });

    // Log to database
    await prisma.emailRoute?.create({
      data: {
        externalId: rule.id,
        pattern,
        destination,
        enabled: options.enabled ?? true,
        priority: options.priority || 0,
      },
    });

    return {
      id: rule.id,
      name: rule.name,
      pattern,
      destination,
      enabled: rule.enabled,
      priority: rule.priority,
      actions: rule.actions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to create email route:', error);
    return null;
  }
}

/**
 * Update email routing rule
 */
export async function updateEmailRoute(
  ruleId: string,
  updates: Partial<{
    pattern: string;
    destination: string;
    enabled: boolean;
    priority: number;
  }>
): Promise<boolean> {
  try {
    await cloudflareRequest(`/email/routing/rules/${ruleId}`, 'PUT', {
      enabled: updates.enabled,
      priority: updates.priority,
      matchers: updates.pattern
        ? [{ type: 'literal', field: 'to', value: updates.pattern }]
        : undefined,
      actions: updates.destination
        ? [{ type: 'forward', value: [updates.destination] }]
        : undefined,
    });

    return true;
  } catch (error) {
    console.error('Failed to update email route:', error);
    return false;
  }
}

/**
 * Delete email routing rule
 */
export async function deleteEmailRoute(ruleId: string): Promise<boolean> {
  try {
    await cloudflareRequest(`/email/routing/rules/${ruleId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Failed to delete email route:', error);
    return false;
  }
}

// =============================================================================
// EMAIL FORWARDERS
// =============================================================================

/**
 * Get all email forwarders (destination addresses)
 */
export async function getEmailForwarders(): Promise<EmailForwarder[]> {
  try {
    const addresses = await cloudflareRequest('/email/routing/addresses');
    return addresses.map((addr: Record<string, unknown>) => ({
      id: addr.id,
      sourceEmail: addr.email,
      destinationEmail: addr.email,
      enabled: addr.verified,
      verified: addr.verified,
      createdAt: new Date(addr.created as string),
    }));
  } catch (error) {
    console.error('Failed to get email forwarders:', error);
    return [];
  }
}

/**
 * Add destination email address
 */
export async function addEmailForwarder(email: string): Promise<{
  success: boolean;
  message: string;
  id?: string;
}> {
  try {
    const result = await cloudflareRequest('/email/routing/addresses', 'POST', {
      email,
    });

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      id: result.id,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add forwarder',
    };
  }
}

/**
 * Delete destination email address
 */
export async function deleteEmailForwarder(addressId: string): Promise<boolean> {
  try {
    await cloudflareRequest(`/email/routing/addresses/${addressId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Failed to delete email forwarder:', error);
    return false;
  }
}

// =============================================================================
// EMAIL ALIASES (Application Level)
// =============================================================================

/**
 * Create email alias for user
 */
export async function createEmailAlias(
  alias: string,
  targetEmail: string,
  userId?: string,
  description?: string
): Promise<EmailAlias | null> {
  // Validate alias format
  if (!alias.includes('@')) {
    alias = `${alias}@${PRIMARY_DOMAIN}`;
  }

  // Check if alias already exists
  const existing = await prisma.emailAlias?.findUnique({
    where: { alias },
  });

  if (existing) {
    throw new Error('Email alias already exists');
  }

  // Create Cloudflare routing rule
  const route = await createEmailRoute(alias, targetEmail, {
    name: `Alias: ${alias}`,
    enabled: true,
  });

  if (!route) {
    throw new Error('Failed to create email route');
  }

  // Store in database
  const emailAlias = await prisma.emailAlias?.create({
    data: {
      alias,
      targetEmail,
      userId,
      description,
      enabled: true,
      cloudflareRuleId: route.id,
    },
  });

  return {
    id: emailAlias.id,
    alias,
    targetEmail,
    userId,
    enabled: true,
    description,
  };
}

/**
 * Get user's email aliases
 */
export async function getUserEmailAliases(userId: string): Promise<EmailAlias[]> {
  const aliases = await prisma.emailAlias?.findMany({
    where: { userId },
  });

  return aliases.map((a: Record<string, unknown>) => ({
    id: a.id as string,
    alias: a.alias as string,
    targetEmail: a.targetEmail as string,
    userId: a.userId as string,
    enabled: a.enabled as boolean,
    description: a.description as string | undefined,
  }));
}

/**
 * Delete email alias
 */
export async function deleteEmailAlias(aliasId: string, userId?: string): Promise<boolean> {
  const alias = await prisma.emailAlias?.findUnique({
    where: { id: aliasId },
  });

  if (!alias) {
    throw new Error('Alias not found');
  }

  // Check ownership if userId provided
  if (userId && alias.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Delete Cloudflare rule
  if (alias.cloudflareRuleId) {
    await deleteEmailRoute(alias.cloudflareRuleId);
  }

  // Delete from database
  await prisma.emailAlias?.delete({
    where: { id: aliasId },
  });

  return true;
}

// =============================================================================
// CATCH-ALL ROUTING
// =============================================================================

/**
 * Setup catch-all email routing
 */
export async function setupCatchAll(destinationEmail: string): Promise<boolean> {
  try {
    await createEmailRoute(`*@${PRIMARY_DOMAIN}`, destinationEmail, {
      name: 'Catch-All',
      priority: 100, // Low priority
      enabled: true,
    });
    return true;
  } catch (error) {
    console.error('Failed to setup catch-all:', error);
    return false;
  }
}

/**
 * Get email routing status
 */
export async function getEmailRoutingStatus(): Promise<{
  enabled: boolean;
  catchAllEnabled: boolean;
  totalRoutes: number;
  totalForwarders: number;
}> {
  try {
    const [routes, forwarders] = await Promise.all([getEmailRoutes(), getEmailForwarders()]);

    const catchAllRoute = routes.find((r) => r.pattern.startsWith('*@'));

    return {
      enabled: routes.length > 0,
      catchAllEnabled: !!catchAllRoute?.enabled,
      totalRoutes: routes.length,
      totalForwarders: forwarders.length,
    };
  } catch {
    return {
      enabled: false,
      catchAllEnabled: false,
      totalRoutes: 0,
      totalForwarders: 0,
    };
  }
}

// =============================================================================
// DEPARTMENT EMAIL ROUTING
// =============================================================================

const DEPARTMENT_EMAILS = {
  support: 'support@',
  sales: 'sales@',
  billing: 'billing@',
  security: 'security@',
  legal: 'legal@',
  hr: 'hr@',
  admin: 'admin@',
  info: 'info@',
  noreply: 'noreply@',
};

/**
 * Setup department email routing
 */
export async function setupDepartmentEmails(
  destinations: Record<keyof typeof DEPARTMENT_EMAILS, string>
): Promise<{ success: boolean; created: string[]; failed: string[] }> {
  const created: string[] = [];
  const failed: string[] = [];

  for (const [dept, prefix] of Object.entries(DEPARTMENT_EMAILS)) {
    const destination = destinations[dept as keyof typeof DEPARTMENT_EMAILS];
    if (!destination) continue;

    const pattern = `${prefix}${PRIMARY_DOMAIN}`;
    try {
      await createEmailRoute(pattern, destination, {
        name: `Department: ${dept}`,
        enabled: true,
      });
      created.push(dept);
    } catch {
      failed.push(dept);
    }
  }

  return { success: failed.length === 0, created, failed };
}
