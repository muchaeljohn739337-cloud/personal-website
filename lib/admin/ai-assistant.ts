/**
 * Admin AI Assistant with Claude Integration
 * Personal guidance and instructor for order agents
 * Admin can instruct the AI to follow tasks, and it will execute them
 */

import { Orchestrator } from '../agents/orchestrator';
import { prisma } from '../prismaClient';

export interface AdminTask {
  id: string;
  instruction: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  adminId: string;
  priority: number;
  context?: Record<string, unknown>;
}

export interface AIAssistantResponse {
  success: boolean;
  taskId: string;
  message: string;
  status: AdminTask['status'];
  result?: string;
}

class AdminAIAssistant {
  private orchestrator: Orchestrator;
  private tasks: Map<string, AdminTask> = new Map();

  constructor() {
    this.orchestrator = new Orchestrator();
  }

  /**
   * Admin instructs AI to execute a task
   */
  async executeAdminInstruction(
    adminId: string,
    instruction: string,
    priority: number = 5,
    context?: Record<string, unknown>
  ): Promise<AIAssistantResponse> {
    try {
      // Verify admin access
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true },
      });

      if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
        return {
          success: false,
          taskId: '',
          message: 'Unauthorized - Admin access required',
          status: 'FAILED',
        };
      }

      // Create task
      const task: AdminTask = {
        id: `admin_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        instruction,
        status: 'PENDING',
        createdAt: new Date(),
        adminId,
        priority,
        context: context || {},
      };

      this.tasks.set(task.id, task);

      // Submit to orchestrator
      const orchestratorTaskId = await this.orchestrator.submitTask(
        instruction,
        {
          ...context,
          adminId,
          taskType: 'admin_instruction',
        },
        adminId,
        priority
      );

      // Update task with orchestrator ID
      task.status = 'RUNNING';
      task.context = { ...task.context, orchestratorTaskId };

      // Monitor task execution
      this.monitorTask(task.id, orchestratorTaskId).catch((error) => {
        console.error(`[AdminAI] Task monitoring error for ${task.id}:`, error);
        task.status = 'FAILED';
        task.error = error instanceof Error ? error.message : 'Unknown error';
      });

      return {
        success: true,
        taskId: task.id,
        message: 'Task submitted successfully. AI assistant will execute the instruction.',
        status: 'RUNNING',
      };
    } catch (error) {
      return {
        success: false,
        taskId: '',
        message: error instanceof Error ? error.message : 'Failed to execute instruction',
        status: 'FAILED',
      };
    }
  }

  /**
   * Monitor task execution
   */
  private async monitorTask(taskId: string, orchestratorTaskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Poll for task completion
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const status = this.orchestrator.getTaskStatus(orchestratorTaskId);

        if (status.status === 'COMPLETED' && 'result' in status) {
          task.status = 'COMPLETED';
          task.result = JSON.stringify(status.result);
          task.completedAt = new Date();
          clearInterval(pollInterval);

          // Log admin action
          try {
            const { logAdminAction } = await import('../admin');
            await logAdminAction(task.adminId, {
              action: 'AI_TASK_EXECUTED',
              description: `AI executed: ${task.instruction}`,
              metadata: {
                taskId,
                result: status.result,
              },
            });
          } catch (error) {
            // Log to console if logging fails
            console.log(`[AdminAI] Task ${taskId} completed: ${task.instruction}`);
          }
        } else if (status.status === 'FAILED' && 'error' in status) {
          task.status = 'FAILED';
          task.error = status.error;
          task.completedAt = new Date();
          clearInterval(pollInterval);
        }

        if (attempts >= maxAttempts) {
          task.status = 'FAILED';
          task.error = 'Task timeout - exceeded maximum wait time';
          task.completedAt = new Date();
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error(`[AdminAI] Error monitoring task ${taskId}:`, error);
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): AdminTask | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get all tasks for admin
   */
  getAdminTasks(adminId: string): AdminTask[] {
    return Array.from(this.tasks.values())
      .filter((task) => task.adminId === adminId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string, adminId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.adminId !== adminId) {
      return false;
    }

    if (task.status === 'PENDING' || task.status === 'RUNNING') {
      task.status = 'FAILED';
      task.error = 'Cancelled by admin';
      task.completedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * Get AI assistant capabilities
   */
  getCapabilities(): string[] {
    return [
      'Execute admin instructions',
      'Process user requests',
      'Monitor system health',
      'Handle payment issues',
      'Manage user accounts',
      'Generate reports',
      'Send notifications',
      'Update configurations',
      'Troubleshoot problems',
      'Coordinate with other agents',
    ];
  }
}

// Singleton instance
let assistantInstance: AdminAIAssistant | null = null;

export function getAdminAIAssistant(): AdminAIAssistant {
  if (!assistantInstance) {
    assistantInstance = new AdminAIAssistant();
  }
  return assistantInstance;
}
