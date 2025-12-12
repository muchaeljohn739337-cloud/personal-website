import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Helper to get auth token
const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress: number;
  visibility: "PRIVATE" | "TEAM" | "PUBLIC";
  metadata?: any;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: any;
  members?: any[];
  _count?: { tasks: number; members: number };
}

export const createProject = async (data: Partial<Project>) => {
  const response = await axios.post(`${API_URL}/api/projects`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getProjects = async (filters?: { status?: string; priority?: string; visibility?: string }) => {
  const params = new URLSearchParams(filters as any);
  const response = await axios.get(`${API_URL}/api/projects?${params}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getProject = async (id: string) => {
  const response = await axios.get(`${API_URL}/api/projects/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateProject = async (id: string, data: Partial<Project>) => {
  const response = await axios.put(`${API_URL}/api/projects/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteProject = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/projects/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getProjectAnalytics = async (id: string) => {
  const response = await axios.get(`${API_URL}/api/projects/${id}/analytics`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export interface Task {
  id: string;
  projectId: string;
  sprintId?: string;
  boardId?: string;
  columnId?: string;
  assigneeId?: string;
  reporterId?: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  completedAt?: string;
  position: number;
  tags?: string[];
  aiGenerated: boolean;
  aiSuggestions?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export const createTask = async (data: Partial<Task>) => {
  const response = await axios.post(`${API_URL}/api/projects/tasks`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getTasks = async (
  projectId: string,
  filters?: { status?: string; priority?: string; assigneeId?: string; sprintId?: string }
) => {
  const params = new URLSearchParams({ projectId, ...(filters as any) });
  const response = await axios.get(`${API_URL}/api/projects/${projectId}/tasks?${params}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getTask = async (id: string) => {
  const response = await axios.get(`${API_URL}/api/projects/tasks/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateTask = async (id: string, data: Partial<Task>) => {
  const response = await axios.put(`${API_URL}/api/projects/tasks/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteTask = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/projects/tasks/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const moveTask = async (taskId: string, columnId: string, position: number) => {
  const response = await axios.post(
    `${API_URL}/api/projects/tasks/${taskId}/move`,
    { columnId, position },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const addTaskComment = async (taskId: string, content: string) => {
  const response = await axios.post(
    `${API_URL}/api/projects/tasks/${taskId}/comments`,
    { content },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const logTime = async (taskId: string, hours: number, description?: string, date?: string) => {
  const response = await axios.post(
    `${API_URL}/api/projects/tasks/${taskId}/time`,
    { hours, description, date },
    { headers: getAuthHeader() }
  );
  return response.data;
};

// ============================================================================
// SPRINT OPERATIONS
// ============================================================================

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  velocity?: number;
  createdAt: string;
  updatedAt: string;
}

export const createSprint = async (data: Partial<Sprint>) => {
  const response = await axios.post(`${API_URL}/api/projects/${data.projectId}/sprints`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getSprints = async (projectId: string, filters?: { status?: string }) => {
  const params = new URLSearchParams(filters as any);
  const response = await axios.get(`${API_URL}/api/projects/${projectId}/sprints?${params}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getActiveSprint = async (projectId: string) => {
  const response = await axios.get(`${API_URL}/api/projects/${projectId}/sprints/active`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateSprint = async (id: string, data: Partial<Sprint>) => {
  const response = await axios.put(`${API_URL}/api/projects/sprints/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteSprint = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/projects/sprints/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// KANBAN BOARD OPERATIONS
// ============================================================================

export interface KanbanBoard {
  id: string;
  projectId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  columns: KanbanColumn[];
  tasksByColumn?: Record<string, Task[]>;
}

export interface KanbanColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  limit?: number;
  color?: string;
}

export const createBoard = async (projectId: string, name: string, columns: { name: string; position: number }[]) => {
  const response = await axios.post(
    `${API_URL}/api/projects/${projectId}/boards`,
    { name, columns },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getBoard = async (boardId: string) => {
  const response = await axios.get(`${API_URL}/api/projects/boards/${boardId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const addColumn = async (boardId: string, name: string, position: number, limit?: number, color?: string) => {
  const response = await axios.post(
    `${API_URL}/api/projects/boards/${boardId}/columns`,
    { name, position, limit, color },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const updateColumn = async (id: string, data: Partial<KanbanColumn>) => {
  const response = await axios.put(`${API_URL}/api/projects/columns/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteColumn = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/projects/columns/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// MEMBER OPERATIONS
// ============================================================================

export const addMember = async (projectId: string, userId: string, role: string) => {
  const response = await axios.post(
    `${API_URL}/api/projects/${projectId}/members`,
    { userId, role },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const removeMember = async (projectId: string, userId: string) => {
  const response = await axios.delete(`${API_URL}/api/projects/${projectId}/members/${userId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// USER STATS
// ============================================================================

export const getUserTaskStats = async (projectId?: string) => {
  const params = projectId ? `?projectId=${projectId}` : "";
  const response = await axios.get(`${API_URL}/api/projects/user/stats${params}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};
