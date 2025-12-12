/**
 * n8n Workflow Manager
 *
 * Integrates with n8n for visual workflow automation.
 * Provides bidirectional sync between the SaaS platform and n8n.
 */

import { PrismaClient } from "@prisma/client";
import axios, { AxiosInstance } from "axios";

const prisma = new PrismaClient();

// n8n Configuration
interface N8NConfig {
  baseUrl: string;
  apiKey: string;
  webhookBaseUrl?: string;
}

// n8n Workflow types
interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: N8NNode[];
  connections: Record<string, any>;
  settings?: Record<string, any>;
  tags?: Array<{ id: string; name: string }>;
}

interface N8NNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

interface N8NExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: "running" | "success" | "error" | "waiting";
  data?: {
    resultData: {
      runData: Record<string, any>;
      error?: { message: string };
    };
  };
}

interface WorkflowTemplate {
  name: string;
  description: string;
  category: "automation" | "data" | "notification" | "integration" | "ai";
  nodes: N8NNode[];
  connections: Record<string, any>;
}

export class N8NWorkflowManager {
  private client: AxiosInstance;
  private config: N8NConfig;
  private webhookBaseUrl: string;

  constructor(config?: Partial<N8NConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.N8N_BASE_URL || "http://localhost:5678",
      apiKey: config?.apiKey || process.env.N8N_API_KEY || "",
      webhookBaseUrl: config?.webhookBaseUrl || process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook",
    };

    this.webhookBaseUrl = this.config.webhookBaseUrl || this.config.baseUrl + "/webhook";

    this.client = axios.create({
      baseURL: this.config.baseUrl + "/api/v1",
      headers: {
        "X-N8N-API-KEY": this.config.apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  // ============================================
  // WORKFLOW MANAGEMENT
  // ============================================

  /**
   * List all workflows from n8n
   */
  async listWorkflows(options?: { active?: boolean; tags?: string[] }): Promise<N8NWorkflow[]> {
    try {
      const response = await this.client.get("/workflows");
      let workflows: N8NWorkflow[] = response.data.data || response.data;

      if (options?.active !== undefined) {
        workflows = workflows.filter((w) => w.active === options.active);
      }

      if (options?.tags?.length) {
        workflows = workflows.filter((w) => w.tags?.some((t) => options.tags!.includes(t.name)));
      }

      return workflows;
    } catch (error) {
      console.error("Failed to list n8n workflows:", error);
      throw new Error("Failed to fetch workflows from n8n");
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8NWorkflow | null> {
    try {
      const response = await this.client.get(`/workflows/${workflowId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new workflow in n8n
   */
  async createWorkflow(
    name: string,
    nodes: N8NNode[],
    connections: Record<string, any>,
    options?: { active?: boolean; tags?: string[] }
  ): Promise<N8NWorkflow> {
    try {
      const response = await this.client.post("/workflows", {
        name,
        nodes,
        connections,
        active: options?.active ?? false,
        settings: {
          executionOrder: "v1",
        },
      });

      const workflow = response.data;

      // Sync to local database
      await this.syncWorkflowToLocal(workflow);

      return workflow;
    } catch (error) {
      console.error("Failed to create n8n workflow:", error);
      throw new Error("Failed to create workflow in n8n");
    }
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<{ name: string; nodes: N8NNode[]; connections: Record<string, any>; active: boolean }>
  ): Promise<N8NWorkflow> {
    try {
      const response = await this.client.patch(`/workflows/${workflowId}`, updates);
      const workflow = response.data;

      // Sync changes to local database
      await this.syncWorkflowToLocal(workflow);

      return workflow;
    } catch (error) {
      console.error("Failed to update n8n workflow:", error);
      throw new Error("Failed to update workflow in n8n");
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await this.client.delete(`/workflows/${workflowId}`);

      // Remove from local tracking
      await prisma.aIWorkflow.updateMany({
        where: { config: { contains: workflowId } },
        data: { enabled: false },
      });
    } catch (error) {
      console.error("Failed to delete n8n workflow:", error);
      throw new Error("Failed to delete workflow from n8n");
    }
  }

  /**
   * Activate or deactivate a workflow
   */
  async setWorkflowActive(workflowId: string, active: boolean): Promise<N8NWorkflow> {
    return this.updateWorkflow(workflowId, { active });
  }

  // ============================================
  // EXECUTION MANAGEMENT
  // ============================================

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(workflowId: string, data?: Record<string, any>): Promise<N8NExecution> {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/execute`, {
        data: data || {},
      });

      const execution = response.data;

      // Log execution in local database
      await this.logExecution(workflowId, execution);

      return execution;
    } catch (error) {
      console.error("Failed to execute n8n workflow:", error);
      throw new Error("Failed to execute workflow");
    }
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<N8NExecution | null> {
    try {
      const response = await this.client.get(`/executions/${executionId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List executions for a workflow
   */
  async listExecutions(
    workflowId?: string,
    options?: { status?: "running" | "success" | "error"; limit?: number }
  ): Promise<N8NExecution[]> {
    try {
      const params: Record<string, any> = {
        limit: options?.limit || 20,
      };
      if (workflowId) params.workflowId = workflowId;
      if (options?.status) params.status = options.status;

      const response = await this.client.get("/executions", { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error("Failed to list executions:", error);
      throw new Error("Failed to fetch executions");
    }
  }

  /**
   * Stop a running execution
   */
  async stopExecution(executionId: string): Promise<void> {
    try {
      await this.client.post(`/executions/${executionId}/stop`);
    } catch (error) {
      console.error("Failed to stop execution:", error);
      throw new Error("Failed to stop execution");
    }
  }

  // ============================================
  // WORKFLOW TEMPLATES
  // ============================================

  /**
   * Create workflow from predefined template
   */
  async createFromTemplate(
    templateName: string,
    customName?: string,
    customParams?: Record<string, any>
  ): Promise<N8NWorkflow> {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Apply custom parameters to nodes
    let nodes = template.nodes;
    if (customParams) {
      nodes = nodes.map((node) => ({
        ...node,
        parameters: { ...node.parameters, ...customParams[node.name] },
      }));
    }

    return this.createWorkflow(customName || template.name, nodes, template.connections);
  }

  /**
   * Get available workflow templates
   */
  getAvailableTemplates(): Array<{ name: string; description: string; category: string }> {
    return Object.entries(WORKFLOW_TEMPLATES).map(([key, template]) => ({
      name: key,
      description: template.description,
      category: template.category,
    }));
  }

  private getTemplate(name: string): WorkflowTemplate | null {
    return WORKFLOW_TEMPLATES[name] || null;
  }

  // ============================================
  // WEBHOOK INTEGRATION
  // ============================================

  /**
   * Create a webhook-triggered workflow
   */
  async createWebhookWorkflow(
    name: string,
    webhookPath: string,
    processingNodes: N8NNode[]
  ): Promise<{ workflow: N8NWorkflow; webhookUrl: string }> {
    const webhookNode: N8NNode = {
      id: "webhook_1",
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      position: [250, 300],
      parameters: {
        path: webhookPath,
        httpMethod: "POST",
        responseMode: "onReceived",
        responseData: "allEntries",
      },
    };

    const nodes = [webhookNode, ...processingNodes];
    const connections: Record<string, any> = {
      Webhook: {
        main: [[{ node: processingNodes[0]?.name || "End", type: "main", index: 0 }]],
      },
    };

    // Chain processing nodes
    for (let i = 0; i < processingNodes.length - 1; i++) {
      connections[processingNodes[i].name] = {
        main: [[{ node: processingNodes[i + 1].name, type: "main", index: 0 }]],
      };
    }

    const workflow = await this.createWorkflow(name, nodes, connections, { active: true });

    return {
      workflow,
      webhookUrl: `${this.webhookBaseUrl}/${webhookPath}`,
    };
  }

  /**
   * Trigger a webhook workflow
   */
  async triggerWebhook(webhookPath: string, data: Record<string, any>): Promise<any> {
    try {
      const response = await axios.post(`${this.webhookBaseUrl}/${webhookPath}`, data, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error("Failed to trigger webhook:", error);
      throw new Error("Failed to trigger webhook workflow");
    }
  }

  // ============================================
  // SYNC & MONITORING
  // ============================================

  /**
   * Sync all n8n workflows to local database
   */
  async syncAllWorkflows(): Promise<{ synced: number; failed: number }> {
    const workflows = await this.listWorkflows();
    let synced = 0;
    let failed = 0;

    for (const workflow of workflows) {
      try {
        await this.syncWorkflowToLocal(workflow);
        synced++;
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Sync single workflow to local database
   */
  private async syncWorkflowToLocal(n8nWorkflow: N8NWorkflow): Promise<void> {
    const config = JSON.stringify({
      n8nId: n8nWorkflow.id,
      nodes: n8nWorkflow.nodes.map((n) => ({ name: n.name, type: n.type })),
      syncedAt: new Date().toISOString(),
    });

    try {
      await prisma.aIWorkflow.upsert({
        where: { name: `n8n:${n8nWorkflow.name}` },
        update: {
          enabled: n8nWorkflow.active,
          config,
          updatedAt: new Date(),
        },
        create: {
          name: `n8n:${n8nWorkflow.name}`,
          description: `Synced from n8n workflow ${n8nWorkflow.id}`,
          category: "automation",
          triggerType: "event",
          enabled: n8nWorkflow.active,
          requiresApproval: false,
          riskLevel: "low",
          aiModel: "gpt-4",
          config,
        },
      });
    } catch (error) {
      console.error("Failed to sync workflow to local DB:", error);
    }
  }

  /**
   * Log execution to local database
   */
  private async logExecution(workflowId: string, execution: N8NExecution): Promise<void> {
    try {
      // Find local workflow
      const localWorkflow = await prisma.aIWorkflow.findFirst({
        where: { config: { contains: workflowId } },
      });

      if (localWorkflow) {
        await prisma.aIWorkflowExecution.create({
          data: {
            workflowId: localWorkflow.id,
            status: execution.status === "success" ? "completed" : execution.status === "error" ? "failed" : "running",
            triggeredBy: `n8n:${execution.id}`,
            triggerData: JSON.stringify({ n8nExecutionId: execution.id, resultData: execution.data?.resultData }),
            startedAt: new Date(execution.startedAt),
            completedAt: execution.stoppedAt ? new Date(execution.stoppedAt) : undefined,
            error: execution.data?.resultData?.error?.message,
          },
        });
      }
    } catch (error) {
      console.error("Failed to log execution:", error);
    }
  }

  /**
   * Get workflow health status
   */
  async getHealthStatus(): Promise<{
    connected: boolean;
    activeWorkflows: number;
    runningExecutions: number;
    recentErrors: number;
  }> {
    try {
      const [workflows, executions] = await Promise.all([
        this.listWorkflows({ active: true }),
        this.listExecutions(undefined, { limit: 50 }),
      ]);

      const runningExecutions = executions.filter((e) => e.status === "running").length;
      const recentErrors = executions.filter((e) => e.status === "error").length;

      return {
        connected: true,
        activeWorkflows: workflows.length,
        runningExecutions,
        recentErrors,
      };
    } catch {
      return {
        connected: false,
        activeWorkflows: 0,
        runningExecutions: 0,
        recentErrors: 0,
      };
    }
  }
}

// ============================================
// PREDEFINED WORKFLOW TEMPLATES
// ============================================

const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  "slack-notification": {
    name: "Slack Notification",
    description: "Send notifications to a Slack channel",
    category: "notification",
    nodes: [
      {
        id: "slack_1",
        name: "Send Slack Message",
        type: "n8n-nodes-base.slack",
        position: [450, 300],
        parameters: {
          operation: "post",
          channel: "{{ $parameter.channel }}",
          text: "{{ $parameter.message }}",
        },
      },
    ],
    connections: {},
  },

  "email-alert": {
    name: "Email Alert",
    description: "Send email alerts on trigger",
    category: "notification",
    nodes: [
      {
        id: "email_1",
        name: "Send Email",
        type: "n8n-nodes-base.emailSend",
        position: [450, 300],
        parameters: {
          fromEmail: "{{ $parameter.fromEmail }}",
          toEmail: "{{ $parameter.toEmail }}",
          subject: "{{ $parameter.subject }}",
          text: "{{ $parameter.body }}",
        },
      },
    ],
    connections: {},
  },

  "data-sync": {
    name: "Database Sync",
    description: "Sync data between databases",
    category: "data",
    nodes: [
      {
        id: "postgres_read",
        name: "Read Source",
        type: "n8n-nodes-base.postgres",
        position: [250, 300],
        parameters: {
          operation: "executeQuery",
          query: "{{ $parameter.sourceQuery }}",
        },
      },
      {
        id: "postgres_write",
        name: "Write Target",
        type: "n8n-nodes-base.postgres",
        position: [550, 300],
        parameters: {
          operation: "insert",
          table: "{{ $parameter.targetTable }}",
        },
      },
    ],
    connections: {
      "Read Source": {
        main: [[{ node: "Write Target", type: "main", index: 0 }]],
      },
    },
  },

  "ai-content-generator": {
    name: "AI Content Generator",
    description: "Generate content using AI models",
    category: "ai",
    nodes: [
      {
        id: "openai_1",
        name: "Generate Content",
        type: "n8n-nodes-base.openAi",
        position: [450, 300],
        parameters: {
          resource: "chat",
          operation: "complete",
          model: "gpt-4",
          messages: {
            values: [
              {
                role: "user",
                content: "{{ $parameter.prompt }}",
              },
            ],
          },
        },
      },
    ],
    connections: {},
  },

  "scheduled-report": {
    name: "Scheduled Report",
    description: "Generate and send reports on schedule",
    category: "automation",
    nodes: [
      {
        id: "schedule_1",
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: {
          rule: {
            interval: [{ field: "cronExpression", expression: "0 9 * * *" }],
          },
        },
      },
      {
        id: "query_1",
        name: "Query Data",
        type: "n8n-nodes-base.postgres",
        position: [450, 300],
        parameters: {
          operation: "executeQuery",
          query: "{{ $parameter.reportQuery }}",
        },
      },
      {
        id: "email_1",
        name: "Send Report",
        type: "n8n-nodes-base.emailSend",
        position: [650, 300],
        parameters: {
          toEmail: "{{ $parameter.recipientEmail }}",
          subject: "Daily Report",
          text: "{{ JSON.stringify($input.all()) }}",
        },
      },
    ],
    connections: {
      "Schedule Trigger": {
        main: [[{ node: "Query Data", type: "main", index: 0 }]],
      },
      "Query Data": {
        main: [[{ node: "Send Report", type: "main", index: 0 }]],
      },
    },
  },

  "api-integration": {
    name: "REST API Integration",
    description: "Connect to external REST APIs",
    category: "integration",
    nodes: [
      {
        id: "http_1",
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        position: [450, 300],
        parameters: {
          method: "GET",
          url: "{{ $parameter.apiUrl }}",
          authentication: "genericCredentialType",
          genericAuthType: "httpHeaderAuth",
        },
      },
    ],
    connections: {},
  },
};

// Export singleton instance
export const n8nManager = new N8NWorkflowManager();

export default N8NWorkflowManager;
