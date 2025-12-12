import OpenAI from "openai";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set. Please configure it in .env file.");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export class ProjectPlannerAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "Project Planner Agent",
      enabled: true,
      schedule: "0 */6 * * *", // Every 6 hours
      retryAttempts: 3,
      timeout: 600000, // 10 minutes
      priority: "medium",
      description: "Automatically generates task suggestions, estimates, and monitors project health",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let errors = 0;

    this.context.logger.info("[ProjectPlannerAgent] Starting project planning analysis...");

    try {
      // 1. Find projects in PLANNING or ACTIVE status
      const projects = await this.context.prisma.project.findMany({
        where: {
          status: {
            in: ["PLANNING", "ACTIVE"],
          },
        },
        include: {
          tasks: {
            include: {
              dependencies: true,
              assignee: true,
            },
          },
          owner: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      this.context.logger.info(`[ProjectPlannerAgent] Found ${projects.length} active/planning projects`);

      for (const project of projects) {
        await this.analyzeProject(project);
        itemsProcessed++;
      }

      // 2. Analyze overdue tasks across all projects
      await this.checkOverdueTasks();

      // 3. Suggest task dependencies based on content analysis
      await this.suggestDependencies();

      this.context.logger.info("[ProjectPlannerAgent] Completed project planning analysis");

      return {
        success: true,
        message: `Analyzed ${itemsProcessed} projects`,
        metrics: {
          duration: Date.now() - startTime,
          itemsProcessed,
          errors,
        },
      };
    } catch (error: any) {
      errors++;
      this.context.logger.error(`[ProjectPlannerAgent] Error: ${error.message}`, error);

      return {
        success: false,
        message: error.message,
        metrics: {
          duration: Date.now() - startTime,
          itemsProcessed,
          errors,
        },
      };
    }
  }

  private async analyzeProject(project: any): Promise<void> {
    this.context.logger.info(`[ProjectPlannerAgent] Analyzing project: ${project.name} (${project.id})`);

    // Check if project has tasks
    if (project.tasks.length === 0 && project.status === "PLANNING") {
      this.context.logger.info(`[ProjectPlannerAgent] Project "${project.name}" has no tasks - generating suggestions`);
      await this.generateTaskSuggestions(project);
      return;
    }

    // Check for blocked tasks
    const blockedTasks = project.tasks.filter((t: any) => t.status === "BLOCKED");
    if (blockedTasks.length > 0) {
      this.context.logger.info(`[ProjectPlannerAgent] Found ${blockedTasks.length} blocked tasks`);
      await this.notifyBlockedTasks(project, blockedTasks);
    }

    // Check for tasks missing estimates
    const missingEstimates = project.tasks.filter((t: any) => !t.estimatedHours && t.status !== "DONE");
    if (missingEstimates.length > 0) {
      this.context.logger.info(`[ProjectPlannerAgent] ${missingEstimates.length} tasks missing time estimates`);
      await this.generateTimeEstimates(project, missingEstimates);
    }

    // Check for unassigned high-priority tasks
    const unassignedHighPriority = project.tasks.filter(
      (t: any) => !t.assigneeId && ["HIGH", "CRITICAL"].includes(t.priority) && t.status !== "DONE"
    );
    if (unassignedHighPriority.length > 0) {
      this.context.logger.info(`[ProjectPlannerAgent] ${unassignedHighPriority.length} unassigned high-priority tasks`);
      await this.notifyUnassignedTasks(project, unassignedHighPriority);
    }

    // Calculate project health score
    const healthScore = this.calculateProjectHealth(project);
    this.context.logger.info(`[ProjectPlannerAgent] Project health score: ${healthScore}/100`);

    if (healthScore < 60) {
      await this.notifyLowProjectHealth(project, healthScore);
    }
  }

  private async generateTaskSuggestions(project: any): Promise<void> {
    try {
      const prompt = `You are a project management AI assistant. Given this project:

Project Name: ${project.name}
Description: ${project.description || "No description provided"}
Priority: ${project.priority}
Start Date: ${project.startDate || "Not set"}
End Date: ${project.endDate || "Not set"}
Budget: ${project.budget ? `$${project.budget}` : "Not set"}

Generate 5-8 initial tasks to kickstart this project. For each task, provide:
1. Title (concise, actionable)
2. Description (brief, 1-2 sentences)
3. Priority (LOW, MEDIUM, HIGH, CRITICAL)
4. Estimated hours

Return as JSON array with format:
[
  {
    "title": "Task title",
    "description": "Task description",
    "priority": "MEDIUM",
    "estimatedHours": 8
  }
]`;

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a project management expert. Always return valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        this.context.logger.warn("[ProjectPlannerAgent] No response from AI for task suggestions");
        return;
      }

      // Parse AI response
      const backtick = String.fromCharCode(96);
      const tripleBacktick = backtick + backtick + backtick;
      let cleanTaskContent = content;
      cleanTaskContent = cleanTaskContent.split(tripleBacktick + "json").join("");
      cleanTaskContent = cleanTaskContent.split(tripleBacktick).join("");
      const tasks = JSON.parse(cleanTaskContent);

      this.context.logger.info(`[ProjectPlannerAgent] AI generated ${tasks.length} task suggestions`);

      // Store suggestions in project metadata or create draft tasks
      for (const taskData of tasks) {
        await this.context.prisma.task.create({
          data: {
            id: require("crypto").randomUUID(),
            projectId: project.id,
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            estimatedHours: taskData.estimatedHours,
            reporterId: project.ownerId,
            status: "TODO",
            aiGenerated: true,
            aiSuggestions: JSON.stringify({
              source: "ProjectPlannerAgent",
              generatedAt: new Date().toISOString(),
            }),
          },
        });
      }

      this.context.logger.info(
        `[ProjectPlannerAgent] Created ${tasks.length} AI-suggested tasks for project "${project.name}"`
      );

      // Emit Socket.IO event
      if (this.context.io) {
        this.context.io.to(`user:${project.ownerId}`).emit("project:tasks-suggested", {
          projectId: project.id,
          projectName: project.name,
          taskCount: tasks.length,
        });
      }
    } catch (error: any) {
      this.context.logger.error(`[ProjectPlannerAgent] Error generating task suggestions: ${error.message}`, error);
    }
  }

  private async generateTimeEstimates(project: any, tasks: any[]): Promise<void> {
    for (const task of tasks.slice(0, 5)) {
      // Limit to 5 tasks per run
      try {
        const prompt = `Estimate time required for this task:

Title: ${task.title}
Description: ${task.description || "No description"}
Priority: ${task.priority}

Provide a realistic time estimate in hours (integer). Consider complexity and priority.
Reply with ONLY a number (e.g., 8)`;

        const response = await getOpenAI().chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 10,
        });

        const estimateStr = response.choices[0]?.message?.content?.trim();
        const estimate = parseInt(estimateStr || "8", 10);

        if (estimate > 0 && estimate <= 200) {
          await this.context.prisma.task.update({
            where: { id: task.id },
            data: {
              estimatedHours: estimate,
              aiSuggestions: JSON.stringify({
                estimateSource: "ProjectPlannerAgent",
                generatedAt: new Date().toISOString(),
              }),
            },
          });

          this.context.logger.info("[ProjectPlannerAgent] Estimated " + estimate + "h for task: " + task.title);
        }
      } catch (error: any) {
        this.context.logger.warn("[ProjectPlannerAgent] Failed to estimate time for task " + task.id + ": " + error.message);
      }
    }
  }

  private async checkOverdueTasks(): Promise<void> {
    const overdueTasks = await this.context.prisma.task.findMany({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ["DONE"],
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (overdueTasks.length > 0) {
      this.context.logger.info("[ProjectPlannerAgent] Found " + overdueTasks.length + " overdue tasks");

      for (const task of overdueTasks) {
        if (this.context.io && task.assignee) {
          this.context.io.to("user:" + task.assignee.id).emit("task:overdue", {
            taskId: task.id,
            title: task.title,
            dueDate: task.dueDate,
            projectName: task.project.name,
          });
        }
      }
    }
  }

  private async suggestDependencies(): Promise<void> {
    // Find tasks in PLANNING/ACTIVE projects that might have implicit dependencies
    const projects = await this.context.prisma.project.findMany({
      where: {
        status: {
          in: ["PLANNING", "ACTIVE"],
        },
      },
      include: {
        tasks: {
          where: {
            status: {
              notIn: ["DONE", "BLOCKED"],
            },
          },
          include: {
            dependencies: true,
          },
        },
      },
    });

    for (const project of projects) {
      if (project.tasks.length < 2) continue;

      // Find tasks with no dependencies
      const independentTasks = project.tasks.filter((t: any) => t.dependencies.length === 0);

      if (independentTasks.length >= 2) {
        try {
          // Ask AI to suggest dependencies
          const taskList = independentTasks.map((t: any) => "- " + t.id + ": " + t.title).join("\n");

          const prompt = "Analyze these project tasks and suggest which tasks should depend on others (blocking relationships):\n\n" +
            taskList +
            "\n\nReply with JSON array of dependencies:\n[\n  {\n    \"taskId\": \"uuid-of-dependent-task\",\n    \"dependsOnTaskId\": \"uuid-of-blocking-task\",\n    \"reason\": \"Brief explanation\"\n  }\n]\n\nOnly suggest dependencies if there's a clear logical sequence. If no dependencies are needed, return empty array [].";

          const response = await getOpenAI().chat.completions.create({
            model: "gpt-4",
            messages: [
              { role: "system", content: "You are a project management expert." },
              { role: "user", content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 800,
          });

          const content = response.choices[0]?.message?.content;
          if (!content) continue;

          const backtick = String.fromCharCode(96);
          const tripleBacktick = backtick + backtick + backtick;
          let cleanContent = content;
          cleanContent = cleanContent.split(tripleBacktick + "json").join("");
          cleanContent = cleanContent.split(tripleBacktick).join("");
          const suggestions = JSON.parse(cleanContent);

          if (suggestions.length > 0) {
            this.context.logger.info(
              "[ProjectPlannerAgent] AI suggested " + suggestions.length + " task dependencies for project '" + project.name + "'"
            );

            // Store suggestions but don't auto-apply (require human approval)
            for (const suggestion of suggestions) {
              await this.context.prisma.task.update({
                where: { id: suggestion.taskId },
                data: {
                  aiSuggestions: JSON.stringify({
                    dependencySuggestion: suggestion,
                    generatedAt: new Date().toISOString(),
                  }),
                },
              });
            }
          }
        } catch (error: any) {
          this.context.logger.warn("[ProjectPlannerAgent] Failed to suggest dependencies: " + error.message);
        }
      }
    }
  }

  private calculateProjectHealth(project: any): number {
    let score = 100;

    // Deduct points for various issues
    const totalTasks = project.tasks.length;
    if (totalTasks === 0) return 0;

    const blockedTasks = project.tasks.filter((t: any) => t.status === "BLOCKED").length;
    const overdueTasks = project.tasks.filter(
      (t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
    ).length;
    const unassignedTasks = project.tasks.filter((t: any) => !t.assigneeId && t.status !== "DONE").length;
    const noEstimateTasks = project.tasks.filter((t: any) => !t.estimatedHours && t.status !== "DONE").length;
    const doneTasks = project.tasks.filter((t: any) => t.status === "DONE").length;

    // Scoring logic
    score -= blockedTasks * 10; // -10 per blocked task
    score -= overdueTasks * 8; // -8 per overdue task
    score -= (unassignedTasks / totalTasks) * 20; // Up to -20 for unassigned tasks
    score -= (noEstimateTasks / totalTasks) * 15; // Up to -15 for missing estimates

    // Bonus for completion
    const completionRate = doneTasks / totalTasks;
    score += completionRate * 20; // Up to +20 for completion progress

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private async notifyBlockedTasks(project: any, blockedTasks: any[]): Promise<void> {
    if (this.context.io) {
      this.context.io.to("user:" + project.ownerId).emit("project:blocked-tasks", {
        projectId: project.id,
        projectName: project.name,
        blockedCount: blockedTasks.length,
        tasks: blockedTasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
        })),
      });
    }
  }

  private async notifyUnassignedTasks(project: any, tasks: any[]): Promise<void> {
    if (this.context.io) {
      this.context.io.to("user:" + project.ownerId).emit("project:unassigned-high-priority", {
        projectId: project.id,
        projectName: project.name,
        taskCount: tasks.length,
        tasks: tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
        })),
      });
    }
  }

  private async notifyLowProjectHealth(project: any, healthScore: number): Promise<void> {
    if (this.context.io) {
      this.context.io.to("user:" + project.ownerId).emit("project:low-health", {
        projectId: project.id,
        projectName: project.name,
        healthScore,
        message: "Project health is at " + healthScore + "/100. Review blocked, overdue, or unassigned tasks.",
      });
    }
  }
}
