// Test Project Management API
// Run with: node test-project-api.js

const axios = require("axios");

const BASE_URL = "http://localhost:4000";
let token = "";
let projectId = "";
let taskId = "";
let sprintId = "";
let boardId = "";

async function login() {
  console.log("\n1️⃣  Logging in...");
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: "admin@advanciapayledger.com",
    password: "Admin123!",
  });
  token = response.data.token;
  console.log("✅ Logged in successfully");
  console.log(`Token: ${token.substring(0, 30)}...`);
}

async function createProject() {
  console.log("\n2️⃣  Creating project...");
  const response = await axios.post(
    `${BASE_URL}/api/projects`,
    {
      name: "Test Project - PM System",
      description: "Testing the new Project Management features",
      priority: "HIGH",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      budget: 50000,
      visibility: "TEAM",
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  projectId = response.data.id;
  console.log("✅ Project created:");
  console.log(`   ID: ${projectId}`);
  console.log(`   Name: ${response.data.name}`);
  console.log(`   Status: ${response.data.status}`);
  console.log(`   Priority: ${response.data.priority}`);
}

async function createSprint() {
  console.log("\n3️⃣  Creating sprint...");
  const response = await axios.post(
    `${BASE_URL}/api/projects/${projectId}/sprints`,
    {
      name: "Sprint 1 - Setup",
      goal: "Initialize project infrastructure",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
      status: "PLANNED",
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  sprintId = response.data.id;
  console.log("✅ Sprint created:");
  console.log(`   ID: ${sprintId}`);
  console.log(`   Name: ${response.data.name}`);
  console.log(`   Status: ${response.data.status}`);
}

async function createKanbanBoard() {
  console.log("\n4️⃣  Creating Kanban board...");
  const response = await axios.post(
    `${BASE_URL}/api/projects/${projectId}/boards`,
    {
      name: "Development Board",
      isDefault: true,
      columns: [
        { name: "Backlog", position: 0 },
        { name: "To Do", position: 1, limit: 5 },
        { name: "In Progress", position: 2, limit: 3 },
        { name: "Done", position: 3 },
      ],
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  boardId = response.data.id;
  console.log("✅ Kanban board created:");
  console.log(`   ID: ${boardId}`);
  console.log(`   Name: ${response.data.name}`);
  console.log(`   Columns: ${response.data.columns.length}`);
}

async function createTask() {
  console.log("\n5️⃣  Creating task...");
  const response = await axios.post(
    `${BASE_URL}/api/projects/tasks`,
    {
      projectId,
      sprintId,
      boardId,
      title: "Set up database schema",
      description: "Design and implement initial database schema using Prisma",
      priority: "HIGH",
      status: "TODO",
      estimatedHours: 8,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  taskId = response.data.id;
  console.log("✅ Task created:");
  console.log(`   ID: ${taskId}`);
  console.log(`   Title: ${response.data.title}`);
  console.log(`   Status: ${response.data.status}`);
  console.log(`   Priority: ${response.data.priority}`);
}

async function addTaskComment() {
  console.log("\n6️⃣  Adding task comment...");
  const response = await axios.post(
    `${BASE_URL}/api/projects/tasks/${taskId}/comments`,
    {
      content: "This task is critical for the project foundation. Let's prioritize it.",
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  console.log("✅ Comment added:");
  console.log(`   Comment ID: ${response.data.id}`);
  console.log(`   Content: ${response.data.content}`);
}

async function logTime() {
  console.log("\n7️⃣  Logging time entry...");
  const response = await axios.post(
    `${BASE_URL}/api/projects/tasks/${taskId}/time`,
    {
      hours: 3.5,
      description: "Initial schema design and research",
      date: new Date().toISOString(),
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  console.log("✅ Time logged:");
  console.log(`   Hours: ${response.data.hours}`);
  console.log(`   Description: ${response.data.description}`);
}

async function getProjectAnalytics() {
  console.log("\n8️⃣  Fetching project analytics...");
  const response = await axios.get(`${BASE_URL}/api/projects/${projectId}/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("✅ Project analytics:");
  console.log(`   Project: ${response.data.project.name}`);
  console.log(`   Status: ${response.data.project.status}`);
  console.log(`   Progress: ${response.data.project.progress}%`);
  console.log(`   Total hours logged: ${response.data.totalHoursLogged}`);
  console.log(`   Task stats:`, response.data.taskStats);
}

async function listProjects() {
  console.log("\n9️⃣  Listing all projects...");
  const response = await axios.get(`${BASE_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`✅ Found ${response.data.length} projects`);
  response.data.forEach((project) => {
    console.log(`   - ${project.name} (${project.status})`);
  });
}

async function getUserTaskStats() {
  console.log("\n🔟 Fetching user task stats...");
  const response = await axios.get(`${BASE_URL}/api/projects/user/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("✅ User task stats:");
  console.log(`   Tasks by status:`, response.data.tasksByStatus);
  console.log(`   Tasks by priority:`, response.data.tasksByPriority);
  console.log(`   Total hours logged: ${response.data.totalHoursLogged}`);
  console.log(`   Overdue count: ${response.data.overdueCount}`);
}

async function runTests() {
  console.log("🚀 Starting Project Management API Tests\n");
  console.log("=".repeat(60));

  try {
    await login();
    await createProject();
    await createSprint();
    await createKanbanBoard();
    await createTask();
    await addTaskComment();
    await logTime();
    await getProjectAnalytics();
    await listProjects();
    await getUserTaskStats();

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED!");
    console.log("\n📋 Summary:");
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Sprint ID: ${sprintId}`);
    console.log(`   Board ID: ${boardId}`);
    console.log(`   Task ID: ${taskId}`);
    console.log("\n🎉 Project Management System is working correctly!");
  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error:`, error.response.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.error("\n💡 Make sure the server is running on port 4000");
    console.error("   Run: npm run dev");
  }
}

runTests();
