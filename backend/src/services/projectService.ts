import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
  status?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  visibility?: string;
  metadata?: any;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  progress?: number;
  visibility?: string;
  metadata?: any;
}

interface CreateTaskInput {
  projectId: string;
  sprintId?: string;
  boardId?: string;
  columnId?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  reporterId: string;
  estimatedHours?: number;
  dueDate?: Date;
  position?: number;
  metadata?: any;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  completedAt?: Date;
  position?: number;
  columnId?: string;
  sprintId?: string;
  metadata?: any;
}

interface CreateSprintInput {
  projectId: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status?: string;
}

interface CreateBoardInput {
  projectId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  columns: Array<{
    name: string;
    position: number;
    limit?: number;
    color?: string;
  }>;
}

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

export async function createProject(input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      id: randomUUID(),
      ...input,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          sprints: true,
          boards: true,
        },
      },
    },
  });

  return {
    ...project,
    metadata: project.metadata ? JSON.parse(project.metadata) : null,
  };
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...input,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          sprints: true,
          boards: true,
        },
      },
    },
  });

  return {
    ...project,
    metadata: project.metadata ? JSON.parse(project.metadata) : null,
  };
}

export async function deleteProject(id: string) {
  await prisma.project.delete({
    where: { id },
  });
  return { success: true };
}

export async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      boards: {
        include: {
          columns: {
            orderBy: { position: "asc" },
          },
        },
      },
      sprints: {
        orderBy: { startDate: "desc" },
        take: 5,
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  if (!project) return null;

  return {
    ...project,
    metadata: project.metadata ? JSON.parse(project.metadata) : null,
  };
}

export async function listProjects(
  userId: string,
  filters?: {
    status?: string;
    priority?: string;
    visibility?: string;
  }
) {
  const where: any = {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };

  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.visibility) where.visibility = filters.visibility;

  const projects = await prisma.project.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          members: true,
          sprints: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return projects.map((p) => ({
    ...p,
    metadata: p.metadata ? JSON.parse(p.metadata) : null,
  }));
}

export async function addProjectMember(projectId: string, userId: string, role: string = "MEMBER") {
  const member = await prisma.projectMember.create({
    data: {
      id: randomUUID(),
      projectId,
      userId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return member;
}

export async function removeProjectMember(projectId: string, userId: string) {
  await prisma.projectMember.deleteMany({
    where: {
      projectId,
      userId,
    },
  });
  return { success: true };
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: string) {
  const member = await prisma.projectMember.updateMany({
    where: {
      projectId,
      userId,
    },
    data: { role },
  });

  return { success: true, updated: member.count };
}

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

export async function createTask(input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      id: randomUUID(),
      ...input,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      reporter: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      sprint: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          comments: true,
          attachments: true,
          dependencies: true,
        },
      },
    },
  });

  return {
    ...task,
    metadata: task.metadata ? JSON.parse(task.metadata) : null,
    aiSuggestions: task.aiSuggestions ? JSON.parse(task.aiSuggestions) : null,
  };
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  // Auto-set completedAt if status changed to DONE
  if (input.status === "DONE" && !input.completedAt) {
    input.completedAt = new Date();
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...input,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      reporter: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      sprint: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          comments: true,
          attachments: true,
          dependencies: true,
        },
      },
    },
  });

  return {
    ...task,
    metadata: task.metadata ? JSON.parse(task.metadata) : null,
    aiSuggestions: task.aiSuggestions ? JSON.parse(task.aiSuggestions) : null,
  };
}

export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id },
  });
  return { success: true };
}

export async function getTask(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      reporter: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      sprint: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      },
      board: {
        select: {
          id: true,
          name: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      dependencies: {
        include: {
          dependsOnTask: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
      dependents: {
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
      tags: true,
      timeEntries: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!task) return null;

  return {
    ...task,
    metadata: task.metadata ? JSON.parse(task.metadata) : null,
    aiSuggestions: task.aiSuggestions ? JSON.parse(task.aiSuggestions) : null,
  };
}

export async function listTasks(
  projectId: string,
  filters?: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    sprintId?: string;
    boardId?: string;
  }
) {
  const where: any = { projectId };

  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters?.sprintId) where.sprintId = filters.sprintId;
  if (filters?.boardId) where.boardId = filters.boardId;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      reporter: {
        select: {
          id: true,
          username: true,
        },
      },
      _count: {
        select: {
          comments: true,
          attachments: true,
        },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  return tasks.map((t) => ({
    ...t,
    metadata: t.metadata ? JSON.parse(t.metadata) : null,
    aiSuggestions: t.aiSuggestions ? JSON.parse(t.aiSuggestions) : null,
  }));
}

export async function addTaskDependency(taskId: string, dependsOnTaskId: string, type: string = "BLOCKS") {
  const dependency = await prisma.taskDependency.create({
    data: {
      id: randomUUID(),
      taskId,
      dependsOnTaskId,
      type,
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
      dependsOnTask: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  return dependency;
}

export async function removeTaskDependency(taskId: string, dependsOnTaskId: string) {
  await prisma.taskDependency.deleteMany({
    where: {
      taskId,
      dependsOnTaskId,
    },
  });
  return { success: true };
}

export async function addTaskComment(taskId: string, userId: string, content: string) {
  const comment = await prisma.taskComment.create({
    data: {
      id: randomUUID(),
      taskId,
      userId,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return comment;
}

export async function addTaskAttachment(
  taskId: string,
  userId: string,
  filename: string,
  fileUrl: string,
  fileSize: number,
  mimeType: string
) {
  const attachment = await prisma.taskAttachment.create({
    data: {
      id: randomUUID(),
      taskId,
      userId,
      filename,
      fileUrl,
      fileSize,
      mimeType,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  return attachment;
}

export async function logTimeEntry(taskId: string, userId: string, hours: number, description?: string, date?: Date) {
  const entry = await prisma.timeEntry.create({
    data: {
      id: randomUUID(),
      taskId,
      userId,
      hours,
      description,
      date: date || new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  // Update task actualHours
  const totalHours = await prisma.timeEntry.aggregate({
    where: { taskId },
    _sum: { hours: true },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { actualHours: totalHours._sum.hours || 0 },
  });

  return entry;
}

// ============================================================================
// SPRINT MANAGEMENT
// ============================================================================

export async function createSprint(input: CreateSprintInput) {
  const sprint = await prisma.sprint.create({
    data: {
      id: randomUUID(),
      ...input,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  return sprint;
}

export async function updateSprint(
  id: string,
  data: {
    name?: string;
    goal?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    velocity?: number;
  }
) {
  const sprint = await prisma.sprint.update({
    where: { id },
    data,
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  return sprint;
}

export async function deleteSprint(id: string) {
  // Set tasks' sprintId to null before deleting
  await prisma.task.updateMany({
    where: { sprintId: id },
    data: { sprintId: null },
  });

  await prisma.sprint.delete({
    where: { id },
  });

  return { success: true };
}

export async function listSprints(
  projectId: string,
  filters?: {
    status?: string;
  }
) {
  const where: any = { projectId };
  if (filters?.status) where.status = filters.status;

  const sprints = await prisma.sprint.findMany({
    where,
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return sprints;
}

export async function getActiveSprint(projectId: string) {
  const sprint = await prisma.sprint.findFirst({
    where: {
      projectId,
      status: "ACTIVE",
    },
    include: {
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  return sprint;
}

// ============================================================================
// KANBAN BOARD MANAGEMENT
// ============================================================================

export async function createKanbanBoard(input: CreateBoardInput) {
  const board = await prisma.kanbanBoard.create({
    data: {
      id: randomUUID(),
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      isDefault: input.isDefault || false,
    },
  });

  // Create columns
  const columns = await Promise.all(
    input.columns.map((col) =>
      prisma.kanbanColumn.create({
        data: {
          id: randomUUID(),
          boardId: board.id,
          name: col.name,
          position: col.position,
          limit: col.limit,
          color: col.color,
        },
      })
    )
  );

  return {
    ...board,
    columns,
  };
}

export async function getKanbanBoard(boardId: string) {
  const board = await prisma.kanbanBoard.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { position: "asc" },
      },
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
          tags: true,
        },
        orderBy: { position: "asc" },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!board) return null;

  // Group tasks by column
  const tasksByColumn: Record<string, any[]> = {};
  board.columns.forEach((col) => {
    tasksByColumn[col.id] = board.tasks
      .filter((t) => t.columnId === col.id)
      .map((t) => ({
        ...t,
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
        aiSuggestions: t.aiSuggestions ? JSON.parse(t.aiSuggestions) : null,
      }));
  });

  return {
    ...board,
    tasksByColumn,
  };
}

export async function moveTaskToColumn(taskId: string, columnId: string, position: number) {
  // Update the task
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      columnId,
      position,
    },
  });

  return task;
}

export async function addKanbanColumn(
  boardId: string,
  name: string,
  position: number,
  options?: {
    limit?: number;
    color?: string;
  }
) {
  const column = await prisma.kanbanColumn.create({
    data: {
      id: randomUUID(),
      boardId,
      name,
      position,
      limit: options?.limit,
      color: options?.color,
    },
  });

  return column;
}

export async function updateKanbanColumn(
  columnId: string,
  data: {
    name?: string;
    position?: number;
    limit?: number;
    color?: string;
  }
) {
  const column = await prisma.kanbanColumn.update({
    where: { id: columnId },
    data,
  });

  return column;
}

export async function deleteKanbanColumn(columnId: string) {
  // Move tasks to null column
  await prisma.task.updateMany({
    where: { columnId },
    data: { columnId: null },
  });

  await prisma.kanbanColumn.delete({
    where: { id: columnId },
  });

  return { success: true };
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export async function getProjectAnalytics(projectId: string) {
  const [project, taskStats, sprintStats, timeStats, memberStats] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        budget: true,
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId },
      _count: true,
    }),
    prisma.sprint.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        status: true,
        velocity: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    }),
    prisma.timeEntry.aggregate({
      where: {
        task: {
          projectId,
        },
      },
      _sum: {
        hours: true,
      },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  return {
    project,
    taskStats,
    sprintStats,
    totalHoursLogged: timeStats._sum.hours || 0,
    memberCount: memberStats.length,
    members: memberStats,
  };
}

export async function getUserTaskStats(userId: string, projectId?: string) {
  const where: any = {
    assigneeId: userId,
  };

  if (projectId) where.projectId = projectId;

  const [tasksByStatus, tasksByPriority, totalHours, overdueCount] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where,
      _count: true,
    }),
    prisma.timeEntry.aggregate({
      where: { userId },
      _sum: { hours: true },
    }),
    prisma.task.count({
      where: {
        ...where,
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ["DONE"],
        },
      },
    }),
  ]);

  return {
    tasksByStatus,
    tasksByPriority,
    totalHoursLogged: totalHours._sum.hours || 0,
    overdueCount,
  };
}
