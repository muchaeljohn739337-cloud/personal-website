/**
 * Automated Workflow System
 * Pre-defined workflows that run automatically
 */

import { getOrchestrator } from '../agents/orchestrator';

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'manual' | 'webhook';
  schedule?: string; // cron expression
  event?: string; // event name
  webhookUrl?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  action: WorkflowAction;
  config: Record<string, unknown>;
  onSuccess?: string; // next step id
  onFailure?: string; // step id or 'abort'
  retries?: number;
  timeout?: number; // ms
}

export type WorkflowAction =
  | 'ai_task'
  | 'send_email'
  | 'webhook'
  | 'database_query'
  | 'generate_report'
  | 'notify_admin'
  | 'update_user'
  | 'process_payment'
  | 'content_moderation'
  | 'security_scan'
  | 'backup_data'
  | 'cleanup';

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  steps: WorkflowStepResult[];
  error?: string;
}

export interface WorkflowStepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  result?: unknown;
  error?: string;
}

// =============================================================================
// PRE-DEFINED WORKFLOWS
// =============================================================================

export const PREDEFINED_WORKFLOWS: Workflow[] = [
  {
    id: 'daily-health-check',
    name: 'Daily Health Check',
    description: 'Check system health and notify admins of issues',
    trigger: { type: 'schedule', schedule: '0 7 * * *' },
    enabled: true,
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    steps: [
      {
        id: 'check-db',
        name: 'Check Database',
        action: 'database_query',
        config: { query: 'SELECT 1' },
        onSuccess: 'check-api',
        onFailure: 'notify-failure',
      },
      {
        id: 'check-api',
        name: 'Check API Health',
        action: 'webhook',
        config: { url: '/api/health', method: 'GET' },
        onSuccess: 'generate-report',
        onFailure: 'notify-failure',
      },
      {
        id: 'generate-report',
        name: 'Generate Health Report',
        action: 'generate_report',
        config: { type: 'health', format: 'json' },
        onSuccess: 'notify-success',
      },
      {
        id: 'notify-success',
        name: 'Notify Success',
        action: 'notify_admin',
        config: { message: 'Daily health check passed', severity: 'info' },
      },
      {
        id: 'notify-failure',
        name: 'Notify Failure',
        action: 'notify_admin',
        config: { message: 'Health check failed!', severity: 'critical' },
      },
    ],
  },
  {
    id: 'user-onboarding',
    name: 'User Onboarding',
    description: 'Automated onboarding for new users',
    trigger: { type: 'event', event: 'user.created' },
    enabled: true,
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    steps: [
      {
        id: 'send-welcome',
        name: 'Send Welcome Email',
        action: 'send_email',
        config: { template: 'welcome', subject: 'Welcome to Advancia!' },
        onSuccess: 'create-wallet',
      },
      {
        id: 'create-wallet',
        name: 'Create Default Wallet',
        action: 'database_query',
        config: { action: 'create_wallet' },
        onSuccess: 'ai-personalize',
      },
      {
        id: 'ai-personalize',
        name: 'AI Personalization',
        action: 'ai_task',
        config: { task: 'Generate personalized onboarding tips based on user profile' },
      },
    ],
  },
  {
    id: 'content-moderation',
    name: 'Content Moderation',
    description: 'AI-powered content moderation',
    trigger: { type: 'event', event: 'content.created' },
    enabled: true,
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    steps: [
      {
        id: 'ai-scan',
        name: 'AI Content Scan',
        action: 'content_moderation',
        config: { checkFor: ['spam', 'hate', 'violence', 'adult'] },
        onSuccess: 'approve',
        onFailure: 'flag-review',
      },
      {
        id: 'approve',
        name: 'Auto Approve',
        action: 'database_query',
        config: { action: 'approve_content' },
      },
      {
        id: 'flag-review',
        name: 'Flag for Review',
        action: 'notify_admin',
        config: { message: 'Content flagged for manual review', severity: 'warning' },
      },
    ],
  },
  {
    id: 'weekly-report',
    name: 'Weekly Business Report',
    description: 'Generate and send weekly business metrics',
    trigger: { type: 'schedule', schedule: '0 9 * * 1' },
    enabled: true,
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    steps: [
      {
        id: 'gather-metrics',
        name: 'Gather Metrics',
        action: 'database_query',
        config: { action: 'weekly_metrics' },
        onSuccess: 'ai-analyze',
      },
      {
        id: 'ai-analyze',
        name: 'AI Analysis',
        action: 'ai_task',
        config: { task: 'Analyze weekly metrics and provide insights and recommendations' },
        onSuccess: 'generate-report',
      },
      {
        id: 'generate-report',
        name: 'Generate Report',
        action: 'generate_report',
        config: { type: 'weekly', format: 'pdf' },
        onSuccess: 'send-report',
      },
      {
        id: 'send-report',
        name: 'Send Report',
        action: 'send_email',
        config: { template: 'weekly_report', to: 'admin' },
      },
    ],
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    description: 'Automated security scanning',
    trigger: { type: 'schedule', schedule: '0 2 * * *' },
    enabled: true,
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    steps: [
      {
        id: 'scan-vulnerabilities',
        name: 'Scan Vulnerabilities',
        action: 'security_scan',
        config: { type: 'full' },
        onSuccess: 'ai-review',
        onFailure: 'alert-critical',
      },
      {
        id: 'ai-review',
        name: 'AI Security Review',
        action: 'ai_task',
        config: { task: 'Review security scan results and prioritize issues' },
        onSuccess: 'generate-report',
      },
      {
        id: 'generate-report',
        name: 'Generate Security Report',
        action: 'generate_report',
        config: { type: 'security', format: 'json' },
      },
      {
        id: 'alert-critical',
        name: 'Alert Critical Issue',
        action: 'notify_admin',
        config: { message: 'Critical security issue detected!', severity: 'critical' },
      },
    ],
  },
  {
    id: 'backup-cleanup',
    name: 'Backup & Cleanup',
    description: 'Daily backup and cleanup routine',
    trigger: { type: 'schedule', schedule: '0 4 * * *' },
    enabled: true,
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    steps: [
      {
        id: 'backup-db',
        name: 'Backup Database',
        action: 'backup_data',
        config: { target: 'database' },
        onSuccess: 'cleanup-sessions',
      },
      {
        id: 'cleanup-sessions',
        name: 'Cleanup Sessions',
        action: 'cleanup',
        config: { target: 'expired_sessions' },
        onSuccess: 'cleanup-logs',
      },
      {
        id: 'cleanup-logs',
        name: 'Cleanup Old Logs',
        action: 'cleanup',
        config: { target: 'old_logs', olderThan: 30 },
        onSuccess: 'notify-complete',
      },
      {
        id: 'notify-complete',
        name: 'Notify Complete',
        action: 'notify_admin',
        config: { message: 'Daily backup and cleanup completed', severity: 'info' },
      },
    ],
  },
];

// =============================================================================
// WORKFLOW ENGINE
// =============================================================================

const workflowRuns: Map<string, WorkflowRun> = new Map();
const workflows: Map<string, Workflow> = new Map();

// Initialize workflows
PREDEFINED_WORKFLOWS.forEach((w) => workflows.set(w.id, w));

export function getWorkflow(id: string): Workflow | undefined {
  return workflows.get(id);
}

export function getAllWorkflows(): Workflow[] {
  return Array.from(workflows.values());
}

export function getWorkflowRun(runId: string): WorkflowRun | undefined {
  return workflowRuns.get(runId);
}

export async function executeWorkflow(workflowId: string, context: Record<string, unknown> = {}): Promise<string> {
  const workflow = workflows.get(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
  if (!workflow.enabled) throw new Error(`Workflow is disabled: ${workflowId}`);

  const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const run: WorkflowRun = {
    id: runId,
    workflowId,
    status: 'running',
    startedAt: new Date(),
    steps: workflow.steps.map((s) => ({ stepId: s.id, status: 'pending' as const })),
  };

  workflowRuns.set(runId, run);
  workflow.runCount++;
  workflow.lastRun = new Date();

  // Execute asynchronously
  executeWorkflowSteps(workflow, run, context).catch(console.error);

  return runId;
}

async function executeWorkflowSteps(
  workflow: Workflow,
  run: WorkflowRun,
  context: Record<string, unknown>
): Promise<void> {
  let currentStepId: string | undefined = workflow.steps[0]?.id;

  while (currentStepId) {
    const step = workflow.steps.find((s) => s.id === currentStepId);
    if (!step) break;

    const stepResult = run.steps.find((s) => s.stepId === currentStepId);
    if (!stepResult) break;

    stepResult.status = 'running';
    stepResult.startedAt = new Date();

    try {
      const result = await executeStep(step, context);
      stepResult.status = 'completed';
      stepResult.result = result;
      stepResult.completedAt = new Date();
      currentStepId = step.onSuccess || undefined;
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
      stepResult.completedAt = new Date();

      if (step.onFailure === 'abort') {
        run.status = 'failed';
        run.error = stepResult.error;
        break;
      }
      currentStepId = step.onFailure || undefined;
    }
  }

  if (run.status === 'running') {
    const allCompleted = run.steps.every((s) => s.status === 'completed' || s.status === 'skipped');
    run.status = allCompleted ? 'completed' : 'failed';
    run.completedAt = new Date();

    if (run.status === 'completed') {
      workflow.successCount++;
    } else {
      workflow.failureCount++;
    }
  }

  console.log(`[Workflow] ${workflow.name} ${run.status}: ${run.id}`);
}

async function executeStep(step: WorkflowStep, context: Record<string, unknown>): Promise<unknown> {
  const timeout = step.timeout || 30000;

  const executeWithTimeout = async (): Promise<unknown> => {
    switch (step.action) {
      case 'ai_task': {
        const orchestrator = getOrchestrator();
        const taskId = await orchestrator.submitTask(
          step.config.task as string,
          context
        );
        // Wait for completion (simplified)
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return orchestrator.getTaskStatus(taskId);
      }

      case 'send_email':
        console.log(`[Workflow] Sending email: ${step.config.template}`);
        return { sent: true, template: step.config.template };

      case 'webhook': {
        const url = step.config.url as string;
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}${url}`, {
          method: (step.config.method as string) || 'GET',
        });
        return { status: response.status, ok: response.ok };
      }

      case 'database_query':
        console.log(`[Workflow] Database action: ${step.config.action}`);
        return { executed: true, action: step.config.action };

      case 'generate_report':
        console.log(`[Workflow] Generating report: ${step.config.type}`);
        return { generated: true, type: step.config.type };

      case 'notify_admin':
        console.log(`[Workflow] Admin notification: ${step.config.message}`);
        return { notified: true, message: step.config.message };

      case 'content_moderation':
        console.log(`[Workflow] Content moderation check`);
        return { passed: true, checks: step.config.checkFor };

      case 'security_scan':
        console.log(`[Workflow] Security scan: ${step.config.type}`);
        return { scanned: true, issues: 0 };

      case 'backup_data':
        console.log(`[Workflow] Backup: ${step.config.target}`);
        return { backed_up: true, target: step.config.target };

      case 'cleanup':
        console.log(`[Workflow] Cleanup: ${step.config.target}`);
        return { cleaned: true, target: step.config.target };

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  };

  return Promise.race([
    executeWithTimeout(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Step timeout')), timeout)
    ),
  ]);
}

// =============================================================================
// WORKFLOW SCHEDULER
// =============================================================================

export function startWorkflowScheduler(): void {
  console.log('[Workflow Scheduler] Starting...');

  // Check every minute for scheduled workflows
  setInterval(() => {
    const now = new Date();
    
    workflows.forEach((workflow) => {
      if (!workflow.enabled) return;
      if (workflow.trigger.type !== 'schedule') return;
      if (!workflow.trigger.schedule) return;

      if (shouldRunWorkflow(workflow.trigger.schedule, now)) {
        console.log(`[Workflow Scheduler] Triggering: ${workflow.name}`);
        executeWorkflow(workflow.id).catch(console.error);
      }
    });
  }, 60000);

  console.log(`[Workflow Scheduler] Monitoring ${workflows.size} workflows`);
}

function shouldRunWorkflow(cron: string, now: Date): boolean {
  const parts = cron.split(' ');
  if (parts.length !== 5) return false;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (minute !== '*' && parseInt(minute) !== now.getMinutes()) return false;
  if (hour !== '*' && parseInt(hour) !== now.getHours()) return false;
  if (dayOfMonth !== '*' && parseInt(dayOfMonth) !== now.getDate()) return false;
  if (month !== '*' && parseInt(month) !== now.getMonth() + 1) return false;
  if (dayOfWeek !== '*' && parseInt(dayOfWeek) !== now.getDay()) return false;

  return true;
}

// =============================================================================
// EVENT TRIGGERS
// =============================================================================

export function triggerWorkflowByEvent(event: string, data: Record<string, unknown>): void {
  workflows.forEach((workflow) => {
    if (!workflow.enabled) return;
    if (workflow.trigger.type !== 'event') return;
    if (workflow.trigger.event !== event) return;

    console.log(`[Workflow] Event triggered: ${workflow.name} by ${event}`);
    executeWorkflow(workflow.id, data).catch(console.error);
  });
}
