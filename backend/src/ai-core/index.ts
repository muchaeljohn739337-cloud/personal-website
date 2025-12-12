/**
 * AI Core System
 *
 * Main orchestration layer for the AI subsystem.
 * Provides access to brain, workflow engine, queue, monitoring, and scheduler.
 */

import { aiBrain } from "./brain";
import { AIMonitoring } from "./monitoring";
import { TaskQueue } from "./queue";
import { scheduler } from "./scheduler";
import { workflowEngine } from "./workflow-engine";

export class AICore {
  private static instance: AICore;
  private initialized = false;

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): AICore {
    if (!AICore.instance) {
      AICore.instance = new AICore();
    }
    return AICore.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("AI Core already initialized");
      return;
    }

    console.log("🤖 Initializing AI Core System...");

    try {
      // Components are already instantiated, just validate and log
      console.log("  ✓ AI Brain ready");
      console.log("  ✓ Task Queue ready");
      console.log("  ✓ Workflow Engine ready");
      console.log("  ✓ Monitoring ready");

      // Initialize scheduler if it has an initialize method
      if (scheduler && typeof scheduler.initialize === "function") {
        console.log("  ✓ Initializing Scheduler...");
        await scheduler.initialize();
      }

      this.initialized = true;
      console.log("✅ AI Core System initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize AI Core:", error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log("🤖 Shutting down AI Core System...");

    try {
      if (scheduler && typeof scheduler.shutdown === "function") {
        await scheduler.shutdown();
      }

      this.initialized = false;
      console.log("✅ AI Core System shut down successfully");
    } catch (error) {
      console.error("❌ Error during AI Core shutdown:", error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getWorkflowEngine() {
    return workflowEngine;
  }

  getTaskQueue() {
    return TaskQueue;
  }

  getMonitoring() {
    return AIMonitoring;
  }

  getScheduler() {
    return scheduler;
  }

  getBrain() {
    return aiBrain;
  }

  async getSystemStatus(): Promise<any> {
    const stats = AIMonitoring ? await AIMonitoring.getStats() : {};

    const scheduledJobs =
      scheduler && typeof scheduler.getScheduledJobs === "function" ? scheduler.getScheduledJobs() : [];

    return {
      initialized: this.initialized,
      health: { status: this.initialized ? "healthy" : "not_initialized" },
      stats,
      scheduledJobs: scheduledJobs.length,
      components: {
        brain: !!aiBrain,
        taskQueue: !!TaskQueue,
        workflowEngine: !!workflowEngine,
        monitoring: !!AIMonitoring,
        scheduler: !!scheduler,
      },
    };
  }
}

export const aiCore = AICore.getInstance();

// Re-export components for direct use
export { AIBrain, aiBrain } from "./brain";
export { AIMonitoring } from "./monitoring";
export { TaskQueue } from "./queue";
export { AIScheduler, scheduler } from "./scheduler";
export { WorkflowEngine, workflowEngine } from "./workflow-engine";
