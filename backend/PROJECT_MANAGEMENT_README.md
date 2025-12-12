# 🗂️ Project Management System

## Overview

Complete project management solution with AI-powered task planning, sprint management, and Kanban boards. Built on
Prisma, Express, and OpenAI GPT-4.

## Features

### 1. **Projects**

- Create, update, delete projects
- Project statuses: PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
- Priority levels: LOW, MEDIUM, HIGH, CRITICAL
- Budget tracking, progress percentage (0-100)
- Visibility control: PRIVATE, TEAM, PUBLIC
- Owner and team member management with roles (OWNER, ADMIN, MEMBER, VIEWER)

### 2. **Tasks**

- Full CRUD operations
- Status workflow: TODO → IN_PROGRESS → IN_REVIEW → DONE (or BLOCKED)
- Priority: LOW, MEDIUM, HIGH, CRITICAL
- Assignee, reporter, due dates
- Time tracking: estimated hours vs actual hours
- Task dependencies (BLOCKS, RELATED_TO)
- Comments, attachments, tags
- AI-generated tasks with suggestions
- Position tracking for ordering

### 3. **Sprints**

- Sprint planning with start/end dates
- Sprint statuses: PLANNED, ACTIVE, COMPLETED, CANCELLED
- Velocity tracking
- Task assignment to sprints
- Active sprint query endpoint

### 4. **Kanban Boards**

- Create custom boards per project
- Configurable columns with WIP limits
- Drag-and-drop task movement (via API)
- Column colors and positions
- Default board support

### 5. **Time Tracking**

- Log time entries on tasks
- Auto-aggregation of actual hours
- Historical time entry records

### 6. **Analytics & Reporting**

- Project health scoring (0-100)
- Task statistics by status/priority
- User task statistics
- Time logged aggregates
- Overdue task tracking

### 7. **AI-Powered Features**

- **Auto Task Generation**: AI suggests initial tasks for new projects
- **Time Estimation**: AI estimates task duration based on description
- **Dependency Suggestions**: AI analyzes task relationships and suggests dependencies
- **Project Health Monitoring**: Automated health checks every 6 hours
- **Smart Alerts**: Socket.IO notifications for blocked tasks, overdue items, low health scores

## Database Schema

### Models (12 total)

1. **Project**: Core project data
2. **ProjectMember**: Team membership with roles
3. **Task**: Task management with full lifecycle
4. **TaskDependency**: Task relationships
5. **Sprint**: Sprint planning and tracking
6. **KanbanBoard**: Board configuration
7. **KanbanColumn**: Column definitions
8. **TaskComment**: Threaded comments on tasks
9. **TaskAttachment**: File attachments
10. **TimeEntry**: Time logging
11. **ProjectTag**: Project categorization
12. **TaskTag**: Task categorization

### Key Relations

- `Project` ← `ProjectMember` (many-to-many via users)
- `Project` → `Task[]`, `Sprint[]`, `KanbanBoard[]`
- `Task` → `TaskDependency[]`, `TaskComment[]`, `TaskAttachment[]`, `TimeEntry[]`
- `Sprint` → `Task[]`
- `KanbanBoard` → `KanbanColumn[]`, `Task[]`

## API Endpoints

### Projects (12 routes)

```
POST   /api/projects                      # Create project
GET    /api/projects                      # List user's projects (with filters)
GET    /api/projects/:id                  # Get single project
PUT    /api/projects/:id                  # Update project
DELETE /api/projects/:id                  # Delete project
GET    /api/projects/:id/analytics        # Get project analytics
POST   /api/projects/:id/members          # Add member
DELETE /api/projects/:id/members/:userId  # Remove member
```

### Tasks (14 routes)

```
POST   /api/projects/tasks                # Create task
GET    /api/projects/:projectId/tasks     # List tasks (with filters)
GET    /api/projects/tasks/:id            # Get single task
PUT    /api/projects/tasks/:id            # Update task
DELETE /api/projects/tasks/:id            # Delete task
POST   /api/projects/tasks/:id/dependencies         # Add dependency
DELETE /api/projects/tasks/:id/dependencies/:depId  # Remove dependency
POST   /api/projects/tasks/:id/comments   # Add comment
POST   /api/projects/tasks/:id/time       # Log time entry
POST   /api/projects/tasks/:id/move       # Move task to column
GET    /api/projects/user/stats           # Get user task stats
```

### Sprints (6 routes)

```
POST   /api/projects/:projectId/sprints        # Create sprint
GET    /api/projects/:projectId/sprints        # List sprints
GET    /api/projects/:projectId/sprints/active # Get active sprint
PUT    /api/projects/sprints/:id               # Update sprint
DELETE /api/projects/sprints/:id               # Delete sprint
```

### Kanban (7 routes)

```
POST   /api/projects/:projectId/boards    # Create board
GET    /api/projects/boards/:id           # Get board with tasks
POST   /api/projects/boards/:id/columns   # Add column
PUT    /api/projects/columns/:id          # Update column
DELETE /api/projects/columns/:id          # Delete column
```

**Total: 39 REST endpoints**

## AI Agent: ProjectPlannerAgent

### Schedule

- **Cron**: `0 */6 * * *` (every 6 hours)

### Capabilities

1. **Task Generation**
   - Analyzes project description, priority, budget
   - Uses GPT-4 to generate 5-8 initial tasks
   - Sets realistic priorities and time estimates
   - Marks tasks as `aiGenerated: true`

2. **Time Estimation**
   - Estimates hours for tasks missing `estimatedHours`
   - Uses GPT-3.5-turbo for cost efficiency
   - Considers task complexity and priority

3. **Dependency Detection**
   - Analyzes task relationships
   - Suggests BLOCKS dependencies with explanations
   - Stores suggestions in `aiSuggestions` field (requires human approval)

4. **Health Monitoring**
   - Calculates project health score (0-100)
   - Factors: blocked tasks (-10 each), overdue tasks (-8 each), unassigned tasks, missing estimates, completion rate
   - Emits Socket.IO alerts if score < 60

5. **Overdue Task Tracking**
   - Checks all tasks with `dueDate < now` and status != DONE
   - Sends real-time notifications to assignees

6. **Blocked Task Alerts**
   - Identifies tasks with status BLOCKED
   - Notifies project owners via Socket.IO

### Socket.IO Events

```typescript
// Emitted by ProjectPlannerAgent
"project:tasks-suggested"; // New AI tasks created
"project:blocked-tasks"; // Blocked tasks detected
"project:unassigned-high-priority"; // High-priority tasks unassigned
"project:low-health"; // Project health < 60
"task:overdue"; // Task past due date
```

## Usage Examples

### 1. Create a Project

```typescript
POST /api/projects
Authorization: Bearer <JWT_TOKEN>

{
  "name": "Website Redesign",
  "description": "Complete overhaul of company website",
  "priority": "HIGH",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-03-31T23:59:59Z",
  "budget": 50000,
  "visibility": "TEAM"
}
```

**Response:**

```json
{
  "id": "uuid-here",
  "name": "Website Redesign",
  "status": "PLANNING",
  "priority": "HIGH",
  "progress": 0,
  "owner": {
    "id": "user-id",
    "email": "admin@advanciapayledger.com",
    "username": "admin"
  },
  "members": [],
  "_count": {
    "tasks": 0,
    "sprints": 0,
    "boards": 0
  }
}
```

### 2. Add Team Member

```typescript
POST /api/projects/{projectId}/members

{
  "userId": "user-uuid",
  "role": "MEMBER"
}
```

### 3. Create Sprint

```typescript
POST /api/projects/{projectId}/sprints

{
  "name": "Sprint 1 - Foundation",
  "goal": "Set up infrastructure and design system",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-14T23:59:59Z",
  "status": "PLANNED"
}
```

### 4. Create Kanban Board

```typescript
POST /api/projects/{projectId}/boards

{
  "name": "Development Board",
  "isDefault": true,
  "columns": [
    { "name": "Backlog", "position": 0 },
    { "name": "To Do", "position": 1, "limit": 5 },
    { "name": "In Progress", "position": 2, "limit": 3 },
    { "name": "Code Review", "position": 3, "limit": 2 },
    { "name": "Done", "position": 4 }
  ]
}
```

### 5. Create Task

```typescript
POST /api/projects/tasks

{
  "projectId": "project-uuid",
  "sprintId": "sprint-uuid",
  "boardId": "board-uuid",
  "columnId": "backlog-column-uuid",
  "title": "Design homepage mockup",
  "description": "Create high-fidelity mockup in Figma",
  "priority": "HIGH",
  "estimatedHours": 16,
  "dueDate": "2025-01-10T17:00:00Z"
}
```

### 6. Add Task Dependency

```typescript
POST /api/projects/tasks/{taskId}/dependencies

{
  "dependsOnTaskId": "blocking-task-uuid",
  "type": "BLOCKS"
}
```

### 7. Move Task to Column (Kanban Drag-Drop)

```typescript
POST /api/projects/tasks/{taskId}/move

{
  "columnId": "in-progress-column-uuid",
  "position": 0
}
```

### 8. Log Time Entry

```typescript
POST /api/projects/tasks/{taskId}/time

{
  "hours": 3.5,
  "description": "Implemented responsive layout",
  "date": "2025-01-05T14:00:00Z"
}
```

### 9. Get Project Analytics

```typescript
GET /api/projects/{projectId}/analytics

Response:
{
  "project": {
    "id": "uuid",
    "name": "Website Redesign",
    "status": "ACTIVE",
    "progress": 35
  },
  "taskStats": [
    { "status": "TODO", "_count": 12 },
    { "status": "IN_PROGRESS", "_count": 5 },
    { "status": "DONE", "_count": 8 }
  ],
  "sprintStats": [...],
  "totalHoursLogged": 127.5,
  "memberCount": 6
}
```

### 10. Get User Task Stats

```typescript
GET /api/projects/user/stats?projectId={projectId}

Response:
{
  "tasksByStatus": [
    { "status": "IN_PROGRESS", "_count": 3 },
    { "status": "TODO", "_count": 7 }
  ],
  "tasksByPriority": [
    { "priority": "HIGH", "_count": 5 },
    { "priority": "MEDIUM", "_count": 5 }
  ],
  "totalHoursLogged": 42.5,
  "overdueCount": 1
}
```

## Integration with Existing Systems

### Authentication

All endpoints require `authenticateToken` middleware (JWT). The `userId` is extracted from the JWT token and used for:

- Project ownership
- Task reporter/assignee
- Time entry logging
- Comment authorship

### Socket.IO

Real-time updates are broadcast to:

- `user:{userId}` rooms for assignees and project owners
- Admin broadcast room for critical alerts

### AI Core

ProjectPlannerAgent integrates with the existing agent scheduler and uses OpenAI for:

- Task generation (GPT-4)
- Time estimation (GPT-3.5-turbo)
- Dependency analysis (GPT-4)

### Prisma

Uses existing Prisma client instance. Migration `20251202125750_add_project_management_models` adds 12 new tables and 7
new relations to `users` model.

## Security & Permissions

### Current Implementation

- All authenticated users can create projects
- Project owners have full control
- Team members can view/edit based on role (TODO: implement granular role checks)

### Recommended Enhancements

1. **Role-based middleware**: Add `requireProjectRole(["OWNER", "ADMIN"])` checks
2. **Visibility enforcement**: Prevent access to PRIVATE projects unless owner/member
3. **Admin override**: Allow ADMIN role users to view all projects
4. **Audit logging**: Track project/task modifications in `activity_logs`

## Performance Considerations

### Indexes

All critical fields have database indexes:

- `projects`: ownerId, status, priority
- `tasks`: projectId, sprintId, boardId, assigneeId, status, priority
- `sprints`: projectId, status
- `time_entries`: taskId, userId, date
- `task_dependencies`: taskId, dependsOnTaskId

### Query Optimization

- Use `include` selectively to avoid over-fetching
- Implement pagination for large task lists (TODO)
- Cache project analytics (TODO)

### AI Cost Management

- GPT-3.5-turbo for time estimates (cheaper)
- GPT-4 for task generation and dependency analysis (higher quality)
- Limit AI calls to 5 tasks per execution
- 6-hour interval for agent reduces API costs

## Testing

### Manual Testing

```bash
# Start server
npm run dev

# Create test project
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Testing PM features",
    "priority": "HIGH"
  }'
```

### Unit Tests (TODO)

- `projectService.ts`: Test all CRUD operations
- `ProjectPlannerAgent.ts`: Mock OpenAI responses
- `project.ts` routes: Test Zod validation

### Integration Tests (TODO)

- Full workflow: Create project → Add members → Create sprint → Create tasks → Move to columns → Log time
- Test AI agent execution with mock projects

## Deployment Checklist

- [x] Prisma migration applied
- [x] Prisma client generated
- [x] Routes mounted in `index.ts`
- [x] Agent registered in `scheduler.ts`
- [x] Environment variables configured (OPENAI_API_KEY)
- [ ] Production database migration (run `npx prisma migrate deploy`)
- [ ] Test JWT authentication with real tokens
- [ ] Verify Socket.IO events
- [ ] Test AI agent with actual OpenAI calls
- [ ] Add role-based permission checks
- [ ] Implement pagination
- [ ] Add rate limiting for AI endpoints

## Future Enhancements

### Phase 1 (Next Sprint)

- [ ] Task templates library
- [ ] Recurring tasks
- [ ] Task checklists (sub-tasks)
- [ ] File upload for attachments (integrate with R2/S3)
- [ ] Markdown editor for task descriptions

### Phase 2 (Q1 2025)

- [ ] Gantt chart view
- [ ] Burndown charts for sprints
- [ ] Time tracking widget (start/stop timer)
- [ ] Email notifications for task assignments
- [ ] Slack/Discord integration
- [ ] CSV/JSON export

### Phase 3 (Q2 2025)

- [ ] Project templates (e.g., "Website Launch", "Product Launch")
- [ ] AI-powered standup report generation
- [ ] Automated sprint retrospectives
- [ ] Resource allocation optimizer
- [ ] Multi-project portfolio view

## Troubleshooting

### Common Issues

**1. "Task not found" error**

- Verify `taskId` is correct UUID
- Check if task belongs to user's accessible projects

**2. AI agent not generating tasks**

- Ensure `OPENAI_API_KEY` is set in `.env`
- Check agent logs: `[ProjectPlannerAgent]` prefix
- Verify project status is `PLANNING` or `ACTIVE`

**3. Socket.IO events not received**

- Confirm user is connected to Socket.IO server
- Check room subscription: `socket.join(`user:${userId}`)`
- Verify `io` instance passed to agent context

**4. Migration fails**

- Check for existing table names conflicts
- Ensure SQLite dev.db has write permissions
- Run `npx prisma migrate reset` (DEV ONLY - destructive)

## Support

For issues, feature requests, or questions:

- Check logs: `[ProjectPlannerAgent]` prefix
- Review Prisma logs: Set `DEBUG=prisma:query`
- Inspect Socket.IO events in browser DevTools

---

**Project Management System v1.0**  
Last Updated: December 2, 2025  
Migration: `20251202125750_add_project_management_models`
