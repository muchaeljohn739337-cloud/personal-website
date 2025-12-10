/**
 * AI Agent Safety & Content Filtering System
 * Prevents AI agents from being tricked into providing illegal/harmful information
 * Detects pentesting attempts and social engineering attacks
 */

import { auditLog, AuditEventType, AuditSeverity } from './audit-log';

// =============================================================================
// CONFIGURATION
// =============================================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SECURITY_WEBHOOK = process.env.SECURITY_WEBHOOK_URL;

// =============================================================================
// THREAT PATTERNS
// =============================================================================

/**
 * Patterns that indicate pentesting or security testing attempts
 */
const PENTESTING_PATTERNS = [
  // Direct pentesting mentions
  /pentest(er|ing)?/i,
  /penetration\s*test/i,
  /security\s*(test|audit|assessment)/i,
  /vulnerability\s*(scan|test|assessment)/i,
  /bug\s*bounty/i,
  /ethical\s*hack/i,
  /white\s*hat/i,
  /red\s*team/i,
  /blue\s*team/i,

  // SQL Injection attempts
  /('|"|;|--|\|\|)/,
  /union\s+(all\s+)?select/i,
  /select\s+.*\s+from\s+/i,
  /insert\s+into/i,
  /drop\s+(table|database)/i,
  /delete\s+from/i,
  /update\s+.*\s+set/i,
  /exec(\s+|\()/i,
  /xp_cmdshell/i,

  // XSS attempts
  /<script[\s>]/i,
  /javascript:/i,
  /on(error|load|click|mouse)/i,
  /eval\s*\(/i,
  /document\.(cookie|location|write)/i,

  // Path traversal
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e/i,
  /%252e/i,

  // Command injection
  /;\s*(ls|cat|pwd|whoami|id|uname)/i,
  /\|\s*(ls|cat|pwd|whoami|id|uname)/i,
  /`.*`/,
  /\$\(.*\)/,

  // LDAP injection
  /\)\s*\(/,
  /\*\)\s*\(/,
];

/**
 * Patterns that indicate requests for illegal/harmful information
 */
const ILLEGAL_CONTENT_PATTERNS = [
  // Hacking requests
  /how\s+to\s+hack/i,
  /bypass\s+(security|authentication|password)/i,
  /crack\s+(password|encryption)/i,
  /exploit\s+(vulnerability|system)/i,
  /backdoor/i,
  /rootkit/i,
  /keylogger/i,
  /malware/i,
  /ransomware/i,
  /phishing\s+(kit|page|template)/i,

  // Data theft
  /steal\s+(data|information|credentials)/i,
  /dump\s+(database|credentials|passwords)/i,
  /exfiltrate/i,
  /scrape\s+(emails|data|users)/i,

  // Financial fraud
  /credit\s*card\s*(generator|fraud)/i,
  /money\s*launder/i,
  /fake\s*(id|identity|document)/i,
  /counterfeit/i,

  // Illegal activities
  /illegal\s+(drugs|weapons|activities)/i,
  /dark\s*web/i,
  /tor\s*browser.*anonymous/i,

  // System compromise
  /admin\s*password/i,
  /root\s*access/i,
  /privilege\s*escalation/i,
  /sudo\s*without\s*password/i,
];

/**
 * Social engineering patterns
 */
const SOCIAL_ENGINEERING_PATTERNS = [
  // Impersonation
  /i('m|\s+am)\s+(the\s+)?(admin|administrator|owner|developer|ceo|cto)/i,
  /pretend\s+(you('re|\s+are)|i('m|\s+am))/i,
  /act\s+as\s+(if|though)/i,
  /ignore\s+(previous|all)\s+(instructions|rules)/i,
  /forget\s+(everything|your\s+training)/i,

  // Urgency/Authority
  /this\s+is\s+(urgent|emergency|critical)/i,
  /i\s+need\s+this\s+(now|immediately|asap)/i,
  /my\s+boss\s+(needs|wants|asked)/i,
  /legal\s+(requirement|obligation)/i,

  // Manipulation
  /just\s+this\s+once/i,
  /no\s+one\s+will\s+know/i,
  /between\s+us/i,
  /off\s+the\s+record/i,
  /don't\s+tell\s+anyone/i,

  // Testing claims
  /just\s+testing/i,
  /for\s+testing\s+purposes/i,
  /test\s+account/i,
  /demo\s+mode/i,
  /sandbox/i,

  // Jailbreak attempts
  /dan\s*mode/i,
  /developer\s*mode/i,
  /jailbreak/i,
  /unlock\s+restrictions/i,
  /remove\s+filters/i,
  /disable\s+safety/i,
];

// =============================================================================
// THREAT DETECTION
// =============================================================================

export interface ThreatAnalysis {
  isThreat: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  threatTypes: string[];
  matchedPatterns: string[];
  recommendation: 'allow' | 'warn' | 'block' | 'alert_admin' | 'lockdown';
  safeResponse?: string;
}

/**
 * Analyze input for security threats
 */
export function analyzeInput(input: string): ThreatAnalysis {
  const threatTypes: string[] = [];
  const matchedPatterns: string[] = [];

  // Check for pentesting attempts
  for (const pattern of PENTESTING_PATTERNS) {
    if (pattern.test(input)) {
      threatTypes.push('pentesting_attempt');
      matchedPatterns.push(pattern.source);
    }
  }

  // Check for illegal content requests
  for (const pattern of ILLEGAL_CONTENT_PATTERNS) {
    if (pattern.test(input)) {
      threatTypes.push('illegal_content_request');
      matchedPatterns.push(pattern.source);
    }
  }

  // Check for social engineering
  for (const pattern of SOCIAL_ENGINEERING_PATTERNS) {
    if (pattern.test(input)) {
      threatTypes.push('social_engineering');
      matchedPatterns.push(pattern.source);
    }
  }

  // Determine threat level
  const uniqueTypes = [...new Set(threatTypes)];
  let threatLevel: ThreatAnalysis['threatLevel'] = 'none';
  let recommendation: ThreatAnalysis['recommendation'] = 'allow';
  let safeResponse: string | undefined;

  if (uniqueTypes.length === 0) {
    threatLevel = 'none';
    recommendation = 'allow';
  } else if (uniqueTypes.includes('pentesting_attempt')) {
    threatLevel = 'critical';
    recommendation = 'alert_admin';
    safeResponse = generateSafeResponse('pentesting');
  } else if (uniqueTypes.includes('illegal_content_request')) {
    threatLevel = 'high';
    recommendation = 'block';
    safeResponse = generateSafeResponse('illegal');
  } else if (uniqueTypes.includes('social_engineering')) {
    threatLevel = 'medium';
    recommendation = 'warn';
    safeResponse = generateSafeResponse('social_engineering');
  } else if (matchedPatterns.length >= 3) {
    threatLevel = 'high';
    recommendation = 'block';
  } else if (matchedPatterns.length >= 1) {
    threatLevel = 'low';
    recommendation = 'warn';
  }

  return {
    isThreat: threatLevel !== 'none',
    threatLevel,
    threatTypes: uniqueTypes,
    matchedPatterns: [...new Set(matchedPatterns)],
    recommendation,
    safeResponse,
  };
}

/**
 * Generate safe response for blocked requests
 */
function generateSafeResponse(type: string): string {
  const responses: Record<string, string> = {
    pentesting: `I cannot assist with security testing or penetration testing requests. 
If you are a legitimate security researcher, please contact our security team at security@advanciapayledger.com with proper authorization documentation. 
Unauthorized testing attempts are logged and may be reported to appropriate authorities.`,

    illegal: `I cannot provide information or assistance with activities that may be illegal, harmful, or unethical. 
This request has been logged. If you believe this is an error, please contact support.`,

    social_engineering: `I've detected patterns in your request that suggest an attempt to bypass security protocols. 
I cannot ignore my safety guidelines or pretend to be something I'm not. 
If you have a legitimate request, please rephrase it clearly and directly.`,

    default: `I cannot process this request as it appears to violate our security policies. 
If you believe this is an error, please contact support with details about what you were trying to accomplish.`,
  };

  return responses[type] || responses.default;
}

// =============================================================================
// AI AGENT SAFETY WRAPPER
// =============================================================================

export interface SafeAgentConfig {
  agentId: string;
  agentName: string;
  allowedTopics: string[];
  blockedTopics: string[];
  maxResponseLength: number;
  requireApprovalFor: string[];
  autoReportThreshold: ThreatAnalysis['threatLevel'];
}

const DEFAULT_AGENT_CONFIG: SafeAgentConfig = {
  agentId: 'default',
  agentName: 'Advancia Assistant',
  allowedTopics: ['account_help', 'billing', 'features', 'technical_support', 'general_inquiry'],
  blockedTopics: ['hacking', 'illegal_activities', 'security_bypass', 'data_theft', 'fraud'],
  maxResponseLength: 4000,
  requireApprovalFor: ['refunds', 'account_deletion', 'data_export'],
  autoReportThreshold: 'medium',
};

/**
 * Safe AI Agent wrapper that filters inputs and outputs
 */
export class SafeAIAgent {
  private config: SafeAgentConfig;
  private sessionId: string;
  private userId?: string;
  private ipAddress: string;
  private threatCount: number = 0;
  private isLocked: boolean = false;

  constructor(
    config: Partial<SafeAgentConfig> = {},
    sessionId: string,
    ipAddress: string,
    userId?: string
  ) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.sessionId = sessionId;
    this.ipAddress = ipAddress;
    this.userId = userId;
  }

  /**
   * Process user input safely
   */
  async processInput(input: string): Promise<{
    allowed: boolean;
    sanitizedInput?: string;
    response?: string;
    threatAnalysis: ThreatAnalysis;
  }> {
    // Check if agent is locked
    if (this.isLocked) {
      return {
        allowed: false,
        response: 'This session has been locked due to security concerns. Please contact support.',
        threatAnalysis: {
          isThreat: true,
          threatLevel: 'critical',
          threatTypes: ['session_locked'],
          matchedPatterns: [],
          recommendation: 'lockdown',
        },
      };
    }

    // Analyze input for threats
    const analysis = analyzeInput(input);

    // Log threat if detected
    if (analysis.isThreat) {
      this.threatCount++;

      await auditLog({
        eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
        severity: this.mapThreatToSeverity(analysis.threatLevel),
        userId: this.userId,
        ipAddress: this.ipAddress,
        details: { message: `AI Agent threat detected: ${analysis.threatTypes.join(', ')}` },
        metadata: {
          sessionId: this.sessionId,
          agentId: this.config.agentId,
          input: input.substring(0, 500),
          threatAnalysis: analysis,
        },
      });

      // Lock session after multiple threats
      if (this.threatCount >= 3) {
        this.isLocked = true;
        await this.alertAdmin('session_locked', analysis);
      }

      // Alert admin for high threats
      if (analysis.threatLevel === 'critical' || analysis.threatLevel === 'high') {
        await this.alertAdmin('high_threat', analysis);
      }
    }

    // Determine response
    switch (analysis.recommendation) {
      case 'lockdown':
        this.isLocked = true;
        return {
          allowed: false,
          response: analysis.safeResponse,
          threatAnalysis: analysis,
        };

      case 'alert_admin':
      case 'block':
        return {
          allowed: false,
          response: analysis.safeResponse,
          threatAnalysis: analysis,
        };

      case 'warn':
        // Allow but with warning
        return {
          allowed: true,
          sanitizedInput: this.sanitizeInput(input),
          threatAnalysis: analysis,
        };

      default:
        return {
          allowed: true,
          sanitizedInput: this.sanitizeInput(input),
          threatAnalysis: analysis,
        };
    }
  }

  /**
   * Sanitize input by removing potentially dangerous content
   */
  private sanitizeInput(input: string): string {
    let sanitized = input;

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Remove SQL keywords in suspicious contexts
    sanitized = sanitized.replace(
      /(\b)(union|select|insert|update|delete|drop|exec|execute)(\b)/gi,
      '$1[FILTERED]$3'
    );

    // Remove path traversal
    sanitized = sanitized.replace(/\.\.\//g, '');
    sanitized = sanitized.replace(/\.\.\\/g, '');

    // Limit length
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000) + '...';
    }

    return sanitized;
  }

  /**
   * Filter AI response before sending to user
   */
  filterOutput(response: string): string {
    let filtered = response;

    // Remove any accidentally leaked sensitive patterns
    const sensitivePatterns = [
      /api[_-]?key[:\s]*[a-zA-Z0-9_-]{20,}/gi,
      /password[:\s]*[^\s]{8,}/gi,
      /secret[:\s]*[a-zA-Z0-9_-]{20,}/gi,
      /token[:\s]*[a-zA-Z0-9_.-]{20,}/gi,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails (optional)
    ];

    for (const pattern of sensitivePatterns) {
      filtered = filtered.replace(pattern, '[REDACTED]');
    }

    // Enforce max length
    if (filtered.length > this.config.maxResponseLength) {
      filtered = filtered.substring(0, this.config.maxResponseLength) + '...';
    }

    return filtered;
  }

  /**
   * Alert admin about security event
   */
  private async alertAdmin(eventType: string, analysis: ThreatAnalysis): Promise<void> {
    const alertData = {
      eventType,
      sessionId: this.sessionId,
      userId: this.userId,
      ipAddress: this.ipAddress,
      agentId: this.config.agentId,
      threatAnalysis: analysis,
      timestamp: new Date().toISOString(),
    };

    // Log to audit
    await auditLog({
      eventType: 'ADMIN_ACTION',
      severity: 'CRITICAL',
      userId: this.userId,
      ipAddress: this.ipAddress,
      details: { message: `Admin alert: ${eventType}` },
      metadata: alertData,
    });

    // Send webhook if configured
    if (SECURITY_WEBHOOK) {
      try {
        await fetch(SECURITY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ai_agent_security_alert',
            ...alertData,
          }),
        });
      } catch (error) {
        console.error('Failed to send security webhook:', error);
      }
    }

    // Send email alert if configured
    if (ADMIN_EMAIL) {
      // This would integrate with your email system
      console.log(`[SECURITY ALERT] Email would be sent to ${ADMIN_EMAIL}:`, alertData);
    }
  }

  /**
   * Map threat level to audit severity
   */
  private mapThreatToSeverity(level: ThreatAnalysis['threatLevel']): AuditSeverity {
    const mapping: Record<ThreatAnalysis['threatLevel'], AuditSeverity> = {
      none: AuditSeverity.INFO,
      low: AuditSeverity.INFO,
      medium: AuditSeverity.WARNING,
      high: AuditSeverity.ERROR,
      critical: AuditSeverity.CRITICAL,
    };
    return mapping[level];
  }

  /**
   * Get session security status
   */
  getSecurityStatus(): {
    isLocked: boolean;
    threatCount: number;
    sessionId: string;
  } {
    return {
      isLocked: this.isLocked,
      threatCount: this.threatCount,
      sessionId: this.sessionId,
    };
  }
}

// =============================================================================
// EMAIL WORKER SAFETY
// =============================================================================

/**
 * Safe email content filter for email workers
 */
export function filterEmailContent(content: string): {
  safe: boolean;
  filtered: string;
  issues: string[];
} {
  const issues: string[] = [];
  let filtered = content;

  // Check for phishing indicators
  const phishingPatterns = [
    { pattern: /verify\s+your\s+account/i, issue: 'Phishing: verify account' },
    { pattern: /click\s+here\s+immediately/i, issue: 'Phishing: urgency' },
    { pattern: /your\s+account\s+will\s+be\s+(suspended|closed)/i, issue: 'Phishing: threat' },
    { pattern: /confirm\s+your\s+(password|credentials)/i, issue: 'Phishing: credential request' },
  ];

  for (const { pattern, issue } of phishingPatterns) {
    if (pattern.test(content)) {
      issues.push(issue);
    }
  }

  // Check for sensitive data
  const sensitivePatterns = [
    { pattern: /\b\d{16}\b/, issue: 'Contains credit card number' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/, issue: 'Contains SSN' },
    { pattern: /password[:\s]+\S+/i, issue: 'Contains password' },
  ];

  for (const { pattern, issue } of sensitivePatterns) {
    if (pattern.test(content)) {
      issues.push(issue);
      filtered = filtered.replace(pattern, '[REDACTED]');
    }
  }

  return {
    safe: issues.length === 0,
    filtered,
    issues,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { PENTESTING_PATTERNS, ILLEGAL_CONTENT_PATTERNS, SOCIAL_ENGINEERING_PATTERNS };
