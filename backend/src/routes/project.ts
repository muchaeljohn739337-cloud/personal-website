import { Request, Response, Router } from "express";
import { z } from "zod";
import { authenticateToken } from "../middleware/auth";
import * as projectService from "../services/projectService";

const router = Router();

// Zod schemas for validation
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).default("PLANNING"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  visibility: z.enum(["PRIVATE", "TEAM", "PUBLIC"]).default("PRIVATE"),
  metadata: z.any().optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  progress: z.number().min(0).max(100).optional(),
  visibility: z.enum(["PRIVATE", "TEAM", "PUBLIC"]).optional(),
  metadata: z.any().optional(),
});

const CreateTaskSchema = z.object({
  projectId: z.string().uuid(),
  sprintId: z.string().uuid().optional(),
  boardId: z.string().uuid().optional(),
  columnId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  assigneeId: z.string().uuid().optional(),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  position: z.number().int().default(0),
  metadata: z.any().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional(),
  position: z.number().int().optional(),
  columnId: z.string().uuid().optional().nullable(),
  sprintId: z.string().uuid().optional().nullable(),
  metadata: z.any().optional(),
});

const CreateSprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  goal: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]).default("PLANNED"),
});

const CreateBoardSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  columns: z.array(
    z.object({
      name: z.string().min(1),
      position: z.number().int(),
      limit: z.number().int().positive().optional(),
      color: z.string().optional(),
    })
  ),
});

const MoveTaskSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int(),
});

const AddMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

const AddDependencySchema = z.object({
  dependsOnTaskId: z.string().uuid(),
  type: z.enum(["BLOCKS", "RELATED_TO"]).default("BLOCKS"),
});

const AddCommentSchema = z.object({
  content: z.string().min(1),
});

const LogTimeSchema = z.object({
  hours: z.number().positive(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
});

// ============================================================================
// PROJECT ROUTES
// ============================================================================

// Create project
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = CreateProjectSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const project = await projectService.createProject({
      ...validated,
      ownerId: userId,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    });

    res.status(201).json(project);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Create project error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// List user's projects
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { status, priority, visibility } = req.query;

    const projects = await projectService.listProjects(userId, {
      status: status as string,
      priority: priority as string,
      visibility: visibility as string,
    });

    res.json(projects);
  } catch (error: any) {
    console.error("List projects error:", error);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// Get single project
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const project = await projectService.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error: any) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Failed to get project" });
  }
});

// Update project
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = UpdateProjectSchema.parse(req.body);

    const project = await projectService.updateProject(req.params.id, {
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    });

    res.json(project);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Get project analytics
router.get("/:id/analytics", authenticateToken, async (req: Request, res: Response) => {
  try {
    const analytics = await projectService.getProjectAnalytics(req.params.id);
    res.json(analytics);
  } catch (error: any) {
    console.error("Get project analytics error:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// Add project member
router.post("/:id/members", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = AddMemberSchema.parse(req.body);
    const member = await projectService.addProjectMember(req.params.id, validated.userId, validated.role);
    res.status(201).json(member);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Add member error:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Remove project member
router.delete("/:id/members/:userId", authenticateToken, async (req: Request, res: Response) => {
  try {
    await projectService.removeProjectMember(req.params.id, req.params.userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// ============================================================================
// TASK ROUTES
// ============================================================================

// Create task
router.post("/tasks", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = CreateTaskSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const task = await projectService.createTask({
      ...validated,
      reporterId: userId,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
    });

    res.status(201).json(task);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// List tasks for a project
router.get("/:projectId/tasks", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, priority, assigneeId, sprintId, boardId } = req.query;

    const tasks = await projectService.listTasks(req.params.projectId, {
      status: status as string,
      priority: priority as string,
      assigneeId: assigneeId as string,
      sprintId: sprintId as string,
      boardId: boardId as string,
    });

    res.json(tasks);
  } catch (error: any) {
    console.error("List tasks error:", error);
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

// Get single task
router.get("/tasks/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const task = await projectService.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error: any) {
    console.error("Get task error:", error);
    res.status(500).json({ error: "Failed to get task" });
  }
});

// Update task
router.put("/tasks/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = UpdateTaskSchema.parse(req.body);

    const task = await projectService.updateTask(req.params.id, {
      ...validated,
      dueDate: validated.dueDate === null ? undefined : validated.dueDate ? new Date(validated.dueDate) : undefined,
      completedAt: validated.completedAt ? new Date(validated.completedAt) : undefined,
    });

    res.json(task);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete task
router.delete("/tasks/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await projectService.deleteTask(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Add task dependency
router.post("/tasks/:id/dependencies", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = AddDependencySchema.parse(req.body);
    const dependency = await projectService.addTaskDependency(req.params.id, validated.dependsOnTaskId, validated.type);
    res.status(201).json(dependency);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Add dependency error:", error);
    res.status(500).json({ error: "Failed to add dependency" });
  }
});

// Remove task dependency
router.delete("/tasks/:id/dependencies/:dependsOnId", authenticateToken, async (req: Request, res: Response) => {
  try {
    await projectService.removeTaskDependency(req.params.id, req.params.dependsOnId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Remove dependency error:", error);
    res.status(500).json({ error: "Failed to remove dependency" });
  }
});

// Add task comment
router.post("/tasks/:id/comments", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = AddCommentSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const comment = await projectService.addTaskComment(req.params.id, userId, validated.content);

    res.status(201).json(comment);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Log time entry
router.post("/tasks/:id/time", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = LogTimeSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const entry = await projectService.logTimeEntry(
      req.params.id,
      userId,
      validated.hours,
      validated.description,
      validated.date ? new Date(validated.date) : undefined
    );

    res.status(201).json(entry);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Log time error:", error);
    res.status(500).json({ error: "Failed to log time" });
  }
});

// Get user task stats
router.get("/user/stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { projectId } = req.query;

    const stats = await projectService.getUserTaskStats(userId, projectId as string);
    res.json(stats);
  } catch (error: any) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Failed to get user stats" });
  }
});

// ============================================================================
// SPRINT ROUTES
// ============================================================================

// Create sprint
router.post("/:projectId/sprints", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = CreateSprintSchema.parse({ ...req.body, projectId: req.params.projectId });

    const sprint = await projectService.createSprint({
      ...validated,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
    });

    res.status(201).json(sprint);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Create sprint error:", error);
    res.status(500).json({ error: "Failed to create sprint" });
  }
});

// List sprints
router.get("/:projectId/sprints", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const sprints = await projectService.listSprints(req.params.projectId, {
      status: status as string,
    });
    res.json(sprints);
  } catch (error: any) {
    console.error("List sprints error:", error);
    res.status(500).json({ error: "Failed to list sprints" });
  }
});

// Get active sprint
router.get("/:projectId/sprints/active", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sprint = await projectService.getActiveSprint(req.params.projectId);
    if (!sprint) {
      return res.status(404).json({ error: "No active sprint found" });
    }
    res.json(sprint);
  } catch (error: any) {
    console.error("Get active sprint error:", error);
    res.status(500).json({ error: "Failed to get active sprint" });
  }
});

// Update sprint
router.put("/sprints/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sprint = await projectService.updateSprint(req.params.id, {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    });
    res.json(sprint);
  } catch (error: any) {
    console.error("Update sprint error:", error);
    res.status(500).json({ error: "Failed to update sprint" });
  }
});

// Delete sprint
router.delete("/sprints/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await projectService.deleteSprint(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete sprint error:", error);
    res.status(500).json({ error: "Failed to delete sprint" });
  }
});

// ============================================================================
// KANBAN BOARD ROUTES
// ============================================================================

// Create kanban board
router.post("/:projectId/boards", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = CreateBoardSchema.parse({ ...req.body, projectId: req.params.projectId });
    const board = await projectService.createKanbanBoard(validated);
    res.status(201).json(board);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Create board error:", error);
    res.status(500).json({ error: "Failed to create board" });
  }
});

// Get kanban board
router.get("/boards/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const board = await projectService.getKanbanBoard(req.params.id);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.json(board);
  } catch (error: any) {
    console.error("Get board error:", error);
    res.status(500).json({ error: "Failed to get board" });
  }
});

// Move task to column
router.post("/tasks/:id/move", authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = MoveTaskSchema.parse(req.body);
    const task = await projectService.moveTaskToColumn(req.params.id, validated.columnId, validated.position);
    res.json(task);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Move task error:", error);
    res.status(500).json({ error: "Failed to move task" });
  }
});

// Add column to board
router.post("/boards/:id/columns", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, position, limit, color } = req.body;
    const column = await projectService.addKanbanColumn(req.params.id, name, position, {
      limit,
      color,
    });
    res.status(201).json(column);
  } catch (error: any) {
    console.error("Add column error:", error);
    res.status(500).json({ error: "Failed to add column" });
  }
});

// Update column
router.put("/columns/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const column = await projectService.updateKanbanColumn(req.params.id, req.body);
    res.json(column);
  } catch (error: any) {
    console.error("Update column error:", error);
    res.status(500).json({ error: "Failed to update column" });
  }
});

// Delete column
router.delete("/columns/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await projectService.deleteKanbanColumn(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete column error:", error);
    res.status(500).json({ error: "Failed to delete column" });
  }
});

export default router;
