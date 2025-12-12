/**
 * Agent Configuration System
 * Defines permission levels, risk classifications, and safety constraints
 * for the autonomous AI deployment system
 */

export enum AgentPermissionLevel {
  /**
   * Level 1: AUTO_EXECUTE
   * Agents can execute without any approval
   * Used for: Read-only operations, monitoring, logging, reporting
   */
  AUTO_EXECUTE = "AUTO_EXECUTE",

  /**
   * Level 2: AUTO_FIX
   * Agents can execute and notify admin after action
   * Used for: Low-risk fixes, restarts, patches, minor config changes
   */
  AUTO_FIX = "AUTO_FIX",

  /**
   * Level 3: ADMIN_APPROVAL
   * Agents must wait for admin approval before executing
   * 5-minute veto window before auto-execution
   * Used for: Deployments, scaling, migrations, schema changes
   */
  ADMIN_APPROVAL = "ADMIN_APPROVAL",

  /**
   * Level 4: ADMIN_ONLY
   * Agents cannot execute, requires manual admin intervention
   * Used for: Data deletion, security disable, system shutdown
   */
  ADMIN_ONLY = "ADMIN_ONLY",
}

export enum RiskLevel {
  /** Low risk: Auto-execute, no approval needed */
  LOW = "LOW",

  /** Medium risk: Auto-fix with notification after */
  MEDIUM = "MEDIUM",

  /** High risk: Requires approval with veto window */
  HIGH = "HIGH",

  /** Critical risk: Admin-only, no automation */
  CRITICAL = "CRITICAL",
}

export interface AgentAction {
  id: string;
  name: string;
  description: string;
  permissionLevel: AgentPermissionLevel;
  riskLevel: RiskLevel;
  category: string;
  estimatedDuration?: string;
  rollbackPossible: boolean;
  requiresBackup: boolean;
}

/**
 * Safety constraints for agent operations
 */
export interface SafetyConstraints {
  /** Cooldown period after same fix (minutes) */
  sameFixCooldown: number;

  /** Cooldown period after similar fix (minutes) */
  similarFixCooldown: number;

  /** Cooldown period after same component fix (minutes) */
  sameComponentCooldown: number;

  /** Maximum fixes per hour */
  maxFixesPerHour: number;

  /** Maximum deployments per day */
  maxDeploymentsPerDay: number;

  /** Maximum service restarts per hour */
  maxRestartsPerHour: number;

  /** Error rate threshold for auto-rollback (percentage) */
  errorRateThreshold: number;

  /** Response time threshold for auto-rollback (multiplier of baseline) */
  responseTimeThreshold: number;

  /** Health check interval (seconds) */
  healthCheckInterval: number;

  /** Approval timeout (minutes) - auto-reject if no response */
  approvalTimeout: number;

  /** Veto window for AUTO_APPROVAL actions (minutes) */
  vetoWindow: number;
}

/**
 * Default safety constraints
 */
export const DEFAULT_SAFETY_CONSTRAINTS: SafetyConstraints = {
  sameFixCooldown: 30, // 30 minutes before retrying exact same fix
  similarFixCooldown: 15, // 15 minutes before trying similar fix
  sameComponentCooldown: 10, // 10 minutes before touching same component
  maxFixesPerHour: 10,
  maxDeploymentsPerDay: 5,
  maxRestartsPerHour: 3,
  errorRateThreshold: 5, // 5% error rate triggers rollback
  responseTimeThreshold: 2, // 2x baseline response time triggers alert
  healthCheckInterval: 30, // Check health every 30 seconds
  approvalTimeout: 30, // 30 minutes to approve
  vetoWindow: 5, // 5 minutes to veto high-risk actions
};

/**
 * Predefined agent actions with risk classifications
 */
export const AGENT_ACTIONS: Record<string, AgentAction> = {
  // Level 1: AUTO_EXECUTE (Low Risk)
  READ_LOGS: {
    id: "read_logs",
    name: "Read Application Logs",
    description: "Read and analyze application logs for monitoring",
    permissionLevel: AgentPermissionLevel.AUTO_EXECUTE,
    riskLevel: RiskLevel.LOW,
    category: "monitoring",
    estimatedDuration: "1-2 minutes",
    rollbackPossible: true,
    requiresBackup: false,
  },

  GENERATE_REPORT: {
    id: "generate_report",
    name: "Generate System Report",
    description: "Create performance and health reports",
    permissionLevel: AgentPermissionLevel.AUTO_EXECUTE,
    riskLevel: RiskLevel.LOW,
    category: "reporting",
    estimatedDuration: "2-5 minutes",
    rollbackPossible: true,
    requiresBackup: false,
  },

  CHECK_HEALTH: {
    id: "check_health",
    name: "Check System Health",
    description: "Perform health checks on all services",
    permissionLevel: AgentPermissionLevel.AUTO_EXECUTE,
    riskLevel: RiskLevel.LOW,
    category: "monitoring",
    estimatedDuration: "30 seconds",
    rollbackPossible: true,
    requiresBackup: false,
  },

  // Level 2: AUTO_FIX (Medium Risk)
  RESTART_SERVICE: {
    id: "restart_service",
    name: "Restart Service",
    description: "Restart a crashed or unresponsive service",
    permissionLevel: AgentPermissionLevel.AUTO_FIX,
    riskLevel: RiskLevel.MEDIUM,
    category: "maintenance",
    estimatedDuration: "1-3 minutes",
    rollbackPossible: false,
    requiresBackup: false,
  },

  CLEAR_CACHE: {
    id: "clear_cache",
    name: "Clear Application Cache",
    description: "Clear Redis or in-memory cache",
    permissionLevel: AgentPermissionLevel.AUTO_FIX,
    riskLevel: RiskLevel.MEDIUM,
    category: "maintenance",
    estimatedDuration: "30 seconds",
    rollbackPossible: false,
    requiresBackup: false,
  },

  APPLY_PATCH: {
    id: "apply_patch",
    name: "Apply Security Patch",
    description: "Apply minor security or bug fix patch",
    permissionLevel: AgentPermissionLevel.AUTO_FIX,
    riskLevel: RiskLevel.MEDIUM,
    category: "security",
    estimatedDuration: "5-10 minutes",
    rollbackPossible: true,
    requiresBackup: true,
  },

  UPDATE_CONFIG: {
    id: "update_config",
    name: "Update Configuration",
    description: "Update non-critical configuration settings",
    permissionLevel: AgentPermissionLevel.AUTO_FIX,
    riskLevel: RiskLevel.MEDIUM,
    category: "configuration",
    estimatedDuration: "2-5 minutes",
    rollbackPossible: true,
    requiresBackup: true,
  },

  // Level 3: ADMIN_APPROVAL (High Risk)
  DEPLOY_CODE: {
    id: "deploy_code",
    name: "Deploy Code Changes",
    description: "Deploy new code to production",
    permissionLevel: AgentPermissionLevel.ADMIN_APPROVAL,
    riskLevel: RiskLevel.HIGH,
    category: "deployment",
    estimatedDuration: "10-20 minutes",
    rollbackPossible: true,
    requiresBackup: true,
  },

  SCALE_RESOURCES: {
    id: "scale_resources",
    name: "Scale Resources",
    description: "Scale up or down infrastructure resources",
    permissionLevel: AgentPermissionLevel.ADMIN_APPROVAL,
    riskLevel: RiskLevel.HIGH,
    category: "infrastructure",
    estimatedDuration: "5-15 minutes",
    rollbackPossible: true,
    requiresBackup: false,
  },

  RUN_MIGRATION: {
    id: "run_migration",
    name: "Run Database Migration",
    description: "Execute database schema migration",
    permissionLevel: AgentPermissionLevel.ADMIN_APPROVAL,
    riskLevel: RiskLevel.HIGH,
    category: "database",
    estimatedDuration: "5-30 minutes",
    rollbackPossible: true,
    requiresBackup: true,
  },

  MODIFY_SECURITY: {
    id: "modify_security",
    name: "Modify Security Settings",
    description: "Change security configurations or rules",
    permissionLevel: AgentPermissionLevel.ADMIN_APPROVAL,
    riskLevel: RiskLevel.HIGH,
    category: "security",
    estimatedDuration: "5-10 minutes",
    rollbackPossible: true,
    requiresBackup: true,
  },

  // Level 4: ADMIN_ONLY (Critical Risk)
  DELETE_DATA: {
    id: "delete_data",
    name: "Delete User Data",
    description: "Permanently delete user or system data",
    permissionLevel: AgentPermissionLevel.ADMIN_ONLY,
    riskLevel: RiskLevel.CRITICAL,
    category: "data",
    estimatedDuration: "varies",
    rollbackPossible: false,
    requiresBackup: true,
  },

  DISABLE_SECURITY: {
    id: "disable_security",
    name: "Disable Security Feature",
    description: "Temporarily disable security mechanisms",
    permissionLevel: AgentPermissionLevel.ADMIN_ONLY,
    riskLevel: RiskLevel.CRITICAL,
    category: "security",
    estimatedDuration: "instant",
    rollbackPossible: true,
    requiresBackup: false,
  },

  SHUTDOWN_SYSTEM: {
    id: "shutdown_system",
    name: "Shutdown System",
    description: "Shutdown entire system or critical service",
    permissionLevel: AgentPermissionLevel.ADMIN_ONLY,
    riskLevel: RiskLevel.CRITICAL,
    category: "infrastructure",
    estimatedDuration: "instant",
    rollbackPossible: false,
    requiresBackup: false,
  },

  MODIFY_PAYMENT: {
    id: "modify_payment",
    name: "Modify Payment Settings",
    description: "Change payment processing or pricing",
    permissionLevel: AgentPermissionLevel.ADMIN_ONLY,
    riskLevel: RiskLevel.CRITICAL,
    category: "payment",
    estimatedDuration: "5-10 minutes",
    rollbackPossible: true,
    requiresBackup: true,
  },
};

/**
 * Risk classification rules
 */
export interface RiskClassificationRule {
  condition: (action: Partial<AgentAction>, context?: any) => boolean;
  riskLevel: RiskLevel;
  reason: string;
}

export const RISK_CLASSIFICATION_RULES: RiskClassificationRule[] = [
  // Critical risk rules
  {
    condition: (action, context) => action.category === "data" && action.name?.toLowerCase().includes("delete"),
    riskLevel: RiskLevel.CRITICAL,
    reason: "Data deletion is irreversible",
  },
  {
    condition: (action, context) => action.category === "security" && action.name?.toLowerCase().includes("disable"),
    riskLevel: RiskLevel.CRITICAL,
    reason: "Disabling security is extremely dangerous",
  },
  {
    condition: (action, context) => action.category === "payment",
    riskLevel: RiskLevel.CRITICAL,
    reason: "Payment modifications affect revenue",
  },

  // High risk rules
  {
    condition: (action, context) => action.category === "deployment",
    riskLevel: RiskLevel.HIGH,
    reason: "Deployments can break production",
  },
  {
    condition: (action, context) => action.category === "database" && action.name?.toLowerCase().includes("migration"),
    riskLevel: RiskLevel.HIGH,
    reason: "Database migrations are complex and risky",
  },
  {
    condition: (action, context) =>
      action.category === "infrastructure" && action.name?.toLowerCase().includes("scale"),
    riskLevel: RiskLevel.HIGH,
    reason: "Scaling affects cost and performance",
  },

  // Medium risk rules
  {
    condition: (action, context) => action.name?.toLowerCase().includes("restart"),
    riskLevel: RiskLevel.MEDIUM,
    reason: "Service restarts cause brief downtime",
  },
  {
    condition: (action, context) =>
      action.name?.toLowerCase().includes("patch") || action.name?.toLowerCase().includes("update"),
    riskLevel: RiskLevel.MEDIUM,
    reason: "Updates can introduce bugs",
  },

  // Low risk (default)
  {
    condition: (action, context) => action.category === "monitoring" || action.category === "reporting",
    riskLevel: RiskLevel.LOW,
    reason: "Read-only operations are safe",
  },
];

/**
 * Classify risk level for an action
 */
export function classifyRisk(action: Partial<AgentAction>, context?: any): { riskLevel: RiskLevel; reason: string } {
  // Check explicit risk level first
  if (action.riskLevel) {
    return {
      riskLevel: action.riskLevel,
      reason: "Explicitly defined risk level",
    };
  }

  // Apply risk classification rules
  for (const rule of RISK_CLASSIFICATION_RULES) {
    if (rule.condition(action, context)) {
      return {
        riskLevel: rule.riskLevel,
        reason: rule.reason,
      };
    }
  }

  // Default to HIGH risk if uncertain
  return {
    riskLevel: RiskLevel.HIGH,
    reason: "Unknown action type, defaulting to high risk",
  };
}

/**
 * Determine required permission level based on risk
 */
export function getRequiredPermissionLevel(riskLevel: RiskLevel): AgentPermissionLevel {
  switch (riskLevel) {
    case RiskLevel.LOW:
      return AgentPermissionLevel.AUTO_EXECUTE;
    case RiskLevel.MEDIUM:
      return AgentPermissionLevel.AUTO_FIX;
    case RiskLevel.HIGH:
      return AgentPermissionLevel.ADMIN_APPROVAL;
    case RiskLevel.CRITICAL:
      return AgentPermissionLevel.ADMIN_ONLY;
    default:
      return AgentPermissionLevel.ADMIN_ONLY;
  }
}

/**
 * Check if action can be executed by agent
 */
export function canAgentExecute(
  action: AgentAction,
  hasAdminApproval: boolean = false
): { allowed: boolean; reason: string } {
  const { permissionLevel } = action;

  switch (permissionLevel) {
    case AgentPermissionLevel.AUTO_EXECUTE:
    case AgentPermissionLevel.AUTO_FIX:
      return { allowed: true, reason: "Auto-execution permitted" };

    case AgentPermissionLevel.ADMIN_APPROVAL:
      if (hasAdminApproval) {
        return { allowed: true, reason: "Admin approval granted" };
      }
      return { allowed: false, reason: "Requires admin approval" };

    case AgentPermissionLevel.ADMIN_ONLY:
      return { allowed: false, reason: "Admin-only action, agent cannot execute" };

    default:
      return { allowed: false, reason: "Unknown permission level" };
  }
}

/**
 * Agent configuration export
 */
export const agentConfig = {
  permissionLevels: AgentPermissionLevel,
  riskLevels: RiskLevel,
  actions: AGENT_ACTIONS,
  safetyConstraints: DEFAULT_SAFETY_CONSTRAINTS,
  classifyRisk,
  getRequiredPermissionLevel,
  canAgentExecute,
};

export default agentConfig;
