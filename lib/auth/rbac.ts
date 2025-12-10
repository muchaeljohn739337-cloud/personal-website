/**
 * Role-Based Access Control (RBAC)
 * Strict separation between Admin and User access
 */

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

// =============================================================================
// PERMISSION DEFINITIONS
// =============================================================================

export const PERMISSIONS = {
  // User Management
  'users:view': ['ADMIN', 'SUPER_ADMIN'],
  'users:create': ['ADMIN', 'SUPER_ADMIN'],
  'users:update': ['ADMIN', 'SUPER_ADMIN'],
  'users:delete': ['SUPER_ADMIN'],
  'users:suspend': ['ADMIN', 'SUPER_ADMIN'],
  'users:change-role': ['SUPER_ADMIN'],

  // System Management
  'system:view-logs': ['ADMIN', 'SUPER_ADMIN'],
  'system:view-health': ['ADMIN', 'SUPER_ADMIN'],
  'system:manage-api-limits': ['SUPER_ADMIN'],
  'system:reset-tokens': ['ADMIN', 'SUPER_ADMIN'],
  'system:maintenance-mode': ['SUPER_ADMIN'],

  // Billing Control
  'billing:view-all': ['ADMIN', 'SUPER_ADMIN'],
  'billing:override-subscription': ['SUPER_ADMIN'],
  'billing:apply-discount': ['ADMIN', 'SUPER_ADMIN'],
  'billing:refund': ['SUPER_ADMIN'],
  'billing:view-stripe-logs': ['ADMIN', 'SUPER_ADMIN'],

  // Feature Control
  'features:toggle-global': ['SUPER_ADMIN'],
  'features:manage-beta': ['ADMIN', 'SUPER_ADMIN'],
  'features:push-updates': ['SUPER_ADMIN'],
  'features:manage-ai-models': ['SUPER_ADMIN'],

  // Content Moderation
  'content:moderate': ['ADMIN', 'SUPER_ADMIN'],
  'content:view-flagged': ['ADMIN', 'SUPER_ADMIN'],
  'content:delete-any': ['SUPER_ADMIN'],

  // Automation & Jobs
  'jobs:view': ['ADMIN', 'SUPER_ADMIN'],
  'jobs:restart': ['SUPER_ADMIN'],
  'jobs:manage-cron': ['SUPER_ADMIN'],

  // Security
  'security:view-login-attempts': ['ADMIN', 'SUPER_ADMIN'],
  'security:manage-ip-whitelist': ['SUPER_ADMIN'],
  'security:manage-firewall': ['SUPER_ADMIN'],
  'security:view-api-logs': ['ADMIN', 'SUPER_ADMIN'],

  // Debug & Logs
  'debug:view-exceptions': ['ADMIN', 'SUPER_ADMIN'],
  'debug:view-frontend-errors': ['ADMIN', 'SUPER_ADMIN'],
  'debug:view-slow-queries': ['SUPER_ADMIN'],
  'debug:view-worker-stats': ['SUPER_ADMIN'],

  // Workspace Management
  'workspace:view-all': ['ADMIN', 'SUPER_ADMIN'],
  'workspace:reassign-ownership': ['SUPER_ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// =============================================================================
// ROUTE PROTECTION
// =============================================================================

// Routes that require ADMIN or SUPER_ADMIN
export const ADMIN_ROUTES = ['/admin', '/api/admin', '/dashboard/users', '/dashboard/system'];

// Routes that require SUPER_ADMIN only
export const SUPER_ADMIN_ROUTES = [
  '/admin/settings/dangerous',
  '/api/admin/users/delete',
  '/api/admin/billing/refund',
  '/api/admin/system/maintenance',
];

// Routes accessible by normal users
export const USER_ROUTES = [
  '/dashboard',
  '/dashboard/analytics',
  '/dashboard/billing',
  '/dashboard/settings',
  '/dashboard/team',
  '/dashboard/crm',
  '/dashboard/files',
  '/dashboard/health',
  '/dashboard/medbed',
  '/dashboard/passwords',
  '/dashboard/rewards',
  '/dashboard/tokens',
  '/dashboard/support',
  '/dashboard/verification',
  '/dashboard/automations',
  '/dashboard/agents',
  '/dashboard/communications',
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(userRole);
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(userRole, p));
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(userRole, p));
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

export function canAccessRoute(userRole: UserRole, path: string): boolean {
  // Super admin can access everything
  if (userRole === 'SUPER_ADMIN') return true;

  // Check super admin only routes
  if (SUPER_ADMIN_ROUTES.some((route) => path.startsWith(route))) {
    return false;
  }

  // Admin can access admin routes
  if (userRole === 'ADMIN') {
    if (ADMIN_ROUTES.some((route) => path.startsWith(route))) return true;
    if (USER_ROUTES.some((route) => path.startsWith(route))) return true;
    return false;
  }

  // Regular users can only access user routes
  if (userRole === 'USER') {
    // Block admin routes
    if (ADMIN_ROUTES.some((route) => path.startsWith(route))) return false;
    // Allow user routes
    if (USER_ROUTES.some((route) => path.startsWith(route))) return true;
  }

  return false;
}

// =============================================================================
// SENSITIVE DATA FILTERING
// =============================================================================

// Fields that should NEVER be exposed to regular users
export const ADMIN_ONLY_FIELDS = [
  'stripeCustomerId',
  'stripeSubscriptionId',
  'passwordHash',
  'twoFactorSecret',
  'apiKeys',
  'internalNotes',
  'suspensionReason',
  'ipAddress',
  'loginAttempts',
];

// Filter sensitive fields from response based on role
export function filterSensitiveData<T extends Record<string, unknown>>(
  data: T,
  userRole: UserRole
): Partial<T> {
  if (isAdmin(userRole)) return data;

  const filtered = { ...data };
  for (const field of ADMIN_ONLY_FIELDS) {
    delete filtered[field];
  }
  return filtered;
}
