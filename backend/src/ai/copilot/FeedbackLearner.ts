/**
 * FeedbackLearner.ts
 *
 * Monitor task execution, log success/failure, and improve over time.
 */

import prisma from "../../prismaClient";

export interface LearningMetrics {
  totalTasks: number;
  successRate: number;
  averageExecutionTime: number;
  taskTypeStats: Record<string, { count: number; successRate: number }>;
  commonErrors: Array<{ error: string; count: number }>;
}

export class FeedbackLearner {
  async logInteraction(userId: string, sessionId: string, message: string, response: string): Promise<void> {
    await prisma.copilot_interactions.create({
      data: {
        userId,
        sessionId,
        message,
        response,
        timestamp: new Date(),
      },
    });
  }

  async logTaskSuccess(taskId: string, executionTime: number): Promise<void> {
    await prisma.copilot_tasks.update({
      where: { id: taskId },
      data: {
        status: "completed",
        completedAt: new Date(),
        result: JSON.stringify({ executionTime, success: true }),
      },
    });

    console.log(`[FeedbackLearner] Task ${taskId} completed in ${executionTime}ms`);
  }

  async logTaskFailure(taskId: string, error: string): Promise<void> {
    await prisma.copilot_tasks.update({
      where: { id: taskId },
      data: {
        status: "failed",
        error,
        completedAt: new Date(),
      },
    });

    console.error(`[FeedbackLearner] Task ${taskId} failed: ${error}`);
  }

  async logUserFeedback(taskId: string, userId: number, rating: number, comment?: string): Promise<void> {
    await prisma.copilot_feedback.create({
      data: {
        taskId,
        userId,
        rating,
        comment,
        timestamp: new Date(),
      },
    });

    if (rating <= 2) {
      console.warn(`[FeedbackLearner] Low rating (${rating}) for task ${taskId}`);
    }
  }

  async getStatistics(): Promise<LearningMetrics> {
    const tasks = await prisma.copilot_tasks.findMany();

    const totalTasks = tasks.length;
    const successfulTasks = tasks.filter((t) => t.status === "completed").length;
    const successRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0;

    const taskTypeStats: Record<string, { count: number; successRate: number }> = {};
    for (const task of tasks) {
      if (!taskTypeStats[task.type]) {
        taskTypeStats[task.type] = { count: 0, successRate: 0 };
      }
      taskTypeStats[task.type].count++;
      if (task.status === "completed") {
        taskTypeStats[task.type].successRate++;
      }
    }

    for (const type in taskTypeStats) {
      const stats = taskTypeStats[type];
      stats.successRate = (stats.successRate / stats.count) * 100;
    }

    const errorMap = new Map<string, number>();
    for (const task of tasks) {
      if (task.error) {
        const count = errorMap.get(task.error) || 0;
        errorMap.set(task.error, count + 1);
      }
    }

    const commonErrors = Array.from(errorMap.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalTasks,
      successRate,
      averageExecutionTime: 0,
      taskTypeStats,
      commonErrors,
    };
  }
}

export const feedbackLearner = new FeedbackLearner();
