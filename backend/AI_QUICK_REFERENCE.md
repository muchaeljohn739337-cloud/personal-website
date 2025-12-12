# Test email service

npm run ts-node src/scripts/test-email-service.ts

# Test Stripe integration

npm run ts-node src/scripts/test-stripe-integration.ts

# Check detailed health

curl http://localhost:4000/api/health/detailed | jq

# Test payment webhook (with Stripe CLI)

stripe listen --forward-to localhost:4000/api/payments/webhook# 🚀 AI Advanced Features - Quick Reference

## Installation & Setup

```bash
# 1. Setup (already done - dependencies installed)
npm install

# 2. Configure
npm run ai:setup

# 3. Start
npm run dev
```

---

## Core Modules

### 1. Explainability Engine

```typescript
import { ExplainabilityEngine } from "./ai-core/explainability";

const engine = new ExplainabilityEngine({
  openaiApiKey: process.env.OPENAI_API_KEY,
});

const result = await engine.explainDecision("decision-name", { context: "data" });
// Returns: reasoning, factors, alternatives, confidence
```

### 2. Distributed Tracing

```typescript
import { initializeTracing, getTracing } from "./ai-core/tracing";

initializeTracing({ serviceName: "ai-agents", environment: "dev" });

const tracing = getTracing();
await tracing.traceAgentExecution({ agentId: "1", agentName: "TestAgent" }, "operation", async () => {
  /* work */
});
```

### 3. AI Dashboard

```bash
# REST
GET /api/ai-dashboard/overview
GET /api/ai-dashboard/agents
GET /api/ai-dashboard/tasks/recent

# WebSocket
ws://localhost:4000/ai-dashboard
# Events: agents:update, task:completed, task:failed
```

### 4. Anomaly Detection

```typescript
import { initializeAnomalyDetection, getAnomalyDetector } from "./ai-core/anomaly-detection";

const detector = initializeAnomalyDetection();

detector.addPattern({
  timestamp: new Date(),
  agentName: "Agent1",
  taskType: "task",
  duration: 1000,
  requestCount: 10,
  errorCount: 0,
});

const anomaly = await detector.detectAnomaly(newPattern);
```

### 5. Reinforcement Learning

```typescript
import { initializeReinforcementLearning, getReinforcementLearning } from "./ai-core/reinforcement-learning";

const rl = initializeReinforcementLearning({ openaiApiKey: KEY });

await rl.recordFeedback({
  taskId: "task-1",
  decision: "deploy",
  approved: true,
  context: { tests: "passed" },
  timestamp: new Date(),
});

const prediction = await rl.predictApproval("deploy", context);
```

### 6. Local LLM Fallback

```typescript
import { initializeLocalLLM, getLocalLLM } from "./ai-core/local-llm";

const llm = initializeLocalLLM({ ollamaUrl: "http://localhost:11434" });
llm.initializeProviders(OPENAI_KEY, ANTHROPIC_KEY);

const response = await llm.process({
  prompt: "Analyze this...",
  model: "gpt-4",
  requirePrivacy: false,
});
```

### 7. Predictive Maintenance

```typescript
import { initializePredictiveMaintenance, getPredictiveMaintenance } from "./ai-core/predictive-maintenance";

const pm = initializePredictiveMaintenance();

pm.recordMetrics({
  timestamp: new Date(),
  cpuUsage: 70,
  memoryUsage: 65,
  taskQueueSize: 200,
  activeAgents: 10,
  requestRate: 100,
  avgResponseTime: 1200,
  errorRate: 0.02,
});

const predictions = pm.getAllPredictions();
const health = pm.getHealthScore();
```

### 8. Agent Analytics

```typescript
import { initializeAgentAnalytics, getAgentAnalytics } from "./ai-core/analytics";

const analytics = initializeAgentAnalytics();

const dashboard = await analytics.analyzeAllAgents();
// Returns: overview, topPerformers, bottlenecks, optimizations, trends

const agentDetails = await analytics.getAgentAnalytics("AgentName");
```

---

## Environment Variables

```bash
# Enable/Disable Features
AI_EXPLAINABILITY_ENABLED=true
AI_TRACING_ENABLED=true
AI_ANOMALY_DETECTION_ENABLED=true
AI_REINFORCEMENT_LEARNING_ENABLED=true
AI_LOCAL_LLM_ENABLED=false
AI_PREDICTIVE_MAINTENANCE_ENABLED=true
AI_ANALYTICS_ENABLED=true

# OpenTelemetry
OTEL_EXPORTER_URL=http://localhost:4318/v1/traces

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Thresholds
ANOMALY_CONTAMINATION=0.1
ANOMALY_THRESHOLD=-0.5
PM_CPU_THRESHOLD=80
PM_MEMORY_THRESHOLD=85
```

---

## NPM Scripts

```bash
# Setup
npm run ai:setup              # Interactive setup wizard

# Validation
npm run ai:validate           # Validate AI system
npm run ai:health             # Health check

# Monitoring
npm run ai:dashboard          # Show dashboard URL
npm run ai:tracing            # Show Jaeger URL
npm run ai:analytics          # Run analytics

# Agents
npm run agent:status          # Check agent status
npm run agent:execute         # Execute agent
npm run agent:test            # Test agents
```

---

## Common Patterns

### Initialize All Features

```typescript
// In src/index.ts
import { initializeTracing } from "./ai-core/tracing";
import { initializeAnomalyDetection } from "./ai-core/anomaly-detection";
import { initializeReinforcementLearning } from "./ai-core/reinforcement-learning";
import { initializeLocalLLM } from "./ai-core/local-llm";
import { initializePredictiveMaintenance } from "./ai-core/predictive-maintenance";
import { initializeAgentAnalytics } from "./ai-core/analytics";

if (process.env.AI_TRACING_ENABLED === "true") {
  initializeTracing({ serviceName: "ai-agents", environment: process.env.NODE_ENV });
}

if (process.env.AI_ANOMALY_DETECTION_ENABLED === "true") {
  initializeAnomalyDetection();
}

// ... etc
```

### Trace an Agent Operation

```typescript
import { getTracing } from "./ai-core/tracing";

const tracing = getTracing();

await tracing.traceAgentExecution(
  { agentId: "agent-1", agentName: "MyAgent", taskId: "task-1" },
  "processTask",
  async () => {
    // Your agent logic
    const result = await processTask();
    return result;
  }
);
```

### Record and Learn from Feedback

```typescript
import { getReinforcementLearning } from "./ai-core/reinforcement-learning";

const rl = getReinforcementLearning();

// After human approves/rejects
await rl.recordFeedback({
  taskId: task.id,
  decision: task.type,
  approved: wasApproved,
  context: task.context,
  timestamp: new Date(),
});

// Before asking for approval
const prediction = await rl.predictApproval(task.type, task.context);
if (prediction.approvalProbability < 0.5) {
  console.log("Low approval probability:", prediction.reasoning);
}
```

### Detect and Handle Anomalies

```typescript
import { getAnomalyDetector } from "./ai-core/anomaly-detection";

const detector = getAnomalyDetector();

detector.addPattern({
  timestamp: new Date(),
  agentName: agent.name,
  taskType: task.type,
  duration: task.duration,
  requestCount: metrics.requests,
  errorCount: metrics.errors,
});

const anomaly = await detector.detectAnomaly(currentPattern);

if (anomaly && anomaly.severity === "critical") {
  // Alert team
  sendAlert({
    message: anomaly.reason,
    recommendation: anomaly.recommendation,
  });
}
```

---

## Dashboard Endpoints

```bash
# Overview
curl http://localhost:4000/api/ai-dashboard/overview

# All agents
curl http://localhost:4000/api/ai-dashboard/agents

# Specific agent
curl http://localhost:4000/api/ai-dashboard/agents/ProjectPlannerAgent

# Recent tasks
curl http://localhost:4000/api/ai-dashboard/tasks/recent?limit=10

# Active workflows
curl http://localhost:4000/api/ai-dashboard/workflows/active

# Slow operations (>5s)
curl http://localhost:4000/api/ai-dashboard/performance/slow?threshold=5000

# Timeline (last 24h)
curl http://localhost:4000/api/ai-dashboard/stats/timeline?hours=24
```

---

## Troubleshooting

### Tracing not working

```bash
# Check if initialized
# Error: "Tracing not initialized"
# Fix: Call initializeTracing() first

# Check Jaeger
docker ps | grep jaeger

# Start Jaeger
docker run -d --name jaeger -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one
```

### Anomaly detection not triggering

```typescript
// Need 100+ patterns for training
const stats = detector.getStatistics();
console.log("Total patterns:", stats.totalPatterns); // Should be >= 100

// Force retrain
await detector.retrain();
```

### Ollama not connecting

```bash
# Check if running
curl http://localhost:11434/api/tags

# Windows: Start from Start Menu
# Mac/Linux: ollama serve

# List models
ollama list

# Pull model
ollama pull llama2
```

### RL not learning

```typescript
// Check feedback count
const stats = rl.getStatistics();
console.log("Total feedback:", stats.totalFeedback); // Need 10+

// Export for analysis
const history = rl.exportFeedback();
console.log(JSON.stringify(history, null, 2));
```

---

## Performance Tips

1. **Tracing**: Set `exporterUrl` only in production
2. **Anomaly Detection**: Adjust `contamination` based on your data
3. **RLHF**: Start with `minSamples: 10`, increase for stability
4. **Local LLM**: Use for non-critical tasks to save costs
5. **Predictive Maintenance**: Set thresholds based on your infra
6. **Analytics**: Run `analyzeAllAgents()` periodically, not on every request

---

## Integration Checklist

- [ ] Add initialization code to `src/index.ts`
- [ ] Configure environment variables in `.env`
- [ ] Add dashboard routes to Express app
- [ ] Initialize Socket.IO for real-time updates
- [ ] Test each feature individually
- [ ] Run `npm run ai:validate`
- [ ] Check Sentry for errors
- [ ] Monitor dashboard for agent activity

---

## Need Help?

- 📚 Full docs: `AI_ADVANCED_FEATURES.md`
- 📋 Summary: `AI_IMPLEMENTATION_SUMMARY.md`
- 🔧 Setup: `npm run ai:setup`
- 🏥 Health: `npm run ai:health`

---

**Quick Start:** `npm run ai:setup && npm run dev`
