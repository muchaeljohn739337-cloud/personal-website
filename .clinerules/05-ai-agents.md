# AI Agent System

## Brief Overview

Claude-powered autonomous task system in `lib/agents/` for handling complex operations.

## Architecture

```
Orchestrator → Worker → Job Handlers → Claude API
     ↓            ↓           ↓
 Task Queue   Checkpoints   Logs (Sentry)
```

## Key Components

- `orchestrator.ts` - `Orchestrator.submitTask(task, context)` queues and processes tasks
- `worker.ts` - `AgentWorker` polls for pending jobs, creates checkpoints for approvals
- `claude-client.ts` - `callClaude(systemPrompt, userPrompt, options)` wraps Anthropic API
- `job-handlers.ts` - Define handlers with checkpoint creation for code gen, data processing

## Adding a Job Handler

```typescript
// lib/agents/job-handlers.ts
export const myHandler: JobHandler = async (context) => {
  const { createLog, createCheckpoint, waitForCheckpoint, inputData } = context;

  await createLog('thinking', 'Processing request', inputData);

  // Create approval checkpoint before destructive actions
  const checkpointId = await createCheckpoint(
    CheckpointType.APPROVAL_REQUIRED,
    'Review before proceeding',
    { preview: data }
  );

  const approved = await waitForCheckpoint(checkpointId);
  if (!approved) throw new Error('Rejected');

  return { success: true };
};
```

## Environment Requirements

- Requires `ANTHROPIC_API_KEY` in `.env`
- Logs to Sentry for monitoring
- Uses checkpoints for human-in-the-loop approval
