// Fix AI-core specific delegate names that weren't in the first pass
const fs = require("fs");
const path = require("path");

const aiCoreDelegateMap = {
  "prisma.aIMonitoringRule": "prisma.ai_monitoring_rules",
  "prisma.aITask": "prisma.ai_tasks",
  "prisma.aIAlert": "prisma.ai_alerts",
  "prisma.aIWorkflow": "prisma.ai_workflows",
  "prisma.aIWorkflowExecution": "prisma.ai_workflow_executions",
  "prisma.aILearning": "prisma.ai_learning",
  "prisma.aIGeneration": "prisma.ai_generations",
  "prisma.aIUsageMetrics": "prisma.ai_usage_metrics",
};

function fixFileContent(content) {
  let fixed = content;
  let changeCount = 0;

  for (const [wrong, correct] of Object.entries(aiCoreDelegateMap)) {
    // Create a regex that matches the delegate name but not parts of other words
    const regex = new RegExp(wrong.replace(/\./g, "\\.") + "(?=\\.|\\s)", "g");
    const matches = (fixed.match(regex) || []).length;

    if (matches > 0) {
      fixed = fixed.replace(regex, correct);
      changeCount += matches;
      console.log(`  Replaced ${matches}x: ${wrong} → ${correct}`);
    }
  }

  return { fixed, changeCount };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const { fixed, changeCount } = fixFileContent(content);

    if (changeCount > 0) {
      fs.writeFileSync(filePath, fixed, "utf8");
      console.log(`✓ Fixed ${filePath} (${changeCount} changes)`);
      return changeCount;
    }
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function main() {
  console.log("🔧 Fixing AI-core delegate names...\n");

  const srcDir = path.join(__dirname, "..", "src");
  const files = [
    path.join(srcDir, "ai-core", "monitoring.ts"),
    path.join(srcDir, "ai-core", "queue.ts"),
    path.join(srcDir, "ai-core", "scheduler.ts"),
    path.join(srcDir, "ai-core", "workflow-engine.ts"),
    path.join(srcDir, "ai-engine", "generator.ts"),
  ];

  let totalChanges = 0;
  let filesModified = 0;

  for (const file of files) {
    if (fs.existsSync(file)) {
      const changes = processFile(file);
      if (changes > 0) {
        totalChanges += changes;
        filesModified++;
      }
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total changes: ${totalChanges}`);
}

main();
