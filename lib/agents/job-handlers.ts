/**
 * Agent Job Handlers
 * Sample job handlers demonstrating checkpoint creation
 */

import { CheckpointType, Prisma } from '@prisma/client';

import { callClaude, isClaudeConfigured } from './claude-client';

export interface JobHandlerContext {
  jobId: string;
  jobType: string;
  inputData: Prisma.JsonValue;
  userId?: string;
  createLog: (action: string, message: string, metadata?: Prisma.JsonValue) => Promise<void>;
  createCheckpoint: (
    type: CheckpointType,
    message: string,
    data?: Prisma.JsonValue,
    metadata?: Prisma.JsonValue
  ) => Promise<string>;
  waitForCheckpoint: (checkpointId: string) => Promise<boolean>;
}

export type JobHandler = (context: JobHandlerContext) => Promise<Prisma.JsonValue>;

/**
 * Code generation handler - creates checkpoint before file writes
 */
export const codeGenerationHandler: JobHandler = async (context) => {
  const { createLog, createCheckpoint, waitForCheckpoint, inputData } = context;

  await createLog('thinking', 'Analyzing code generation request', inputData);

  // Parse input
  const input = inputData as {
    files?: Array<{ path: string; content: string }>;
    description?: string;
  };

  if (!input.files || input.files.length === 0) {
    throw new Error('No files specified for code generation');
  }

  // Create checkpoint before writing files
  const checkpointId = await createCheckpoint(
    CheckpointType.APPROVAL_REQUIRED,
    `Ready to create/modify ${input.files.length} file(s). Review the changes before proceeding.`,
    {
      files: input.files.map((f) => ({
        path: f.path,
        contentPreview: f.content.substring(0, 200),
        size: f.content.length,
      })),
      totalFiles: input.files.length,
    },
    {
      handler: 'code-generation',
      requiresApproval: true,
    }
  );

  await createLog('checkpoint', `Created checkpoint ${checkpointId} for file review`);

  // Wait for approval
  const approved = await waitForCheckpoint(checkpointId);
  if (!approved) {
    throw new Error('Code generation checkpoint was rejected');
  }

  await createLog('executing', 'Writing files to filesystem');

  // Simulate file writes (in real implementation, this would write actual files)
  const results = input.files.map((file) => ({
    path: file.path,
    status: 'created',
    size: file.content.length,
  }));

  await createLog('completed', `Successfully created ${results.length} file(s)`);

  return {
    success: true,
    filesCreated: results,
    checkpointId,
  };
};

/**
 * Data processing handler - creates multiple checkpoints
 */
export const dataProcessingHandler: JobHandler = async (context) => {
  const { createLog, createCheckpoint, waitForCheckpoint, inputData } = context;

  await createLog('thinking', 'Starting data processing', inputData);

  const input = inputData as {
    operation?: string;
    data?: unknown[];
    transform?: string;
  };

  // Checkpoint 1: Review input data
  const checkpoint1Id = await createCheckpoint(
    CheckpointType.APPROVAL_REQUIRED,
    `Review input data before processing. ${input.data?.length || 0} items to process.`,
    {
      itemCount: input.data?.length || 0,
      operation: input.operation,
    },
    { stage: 'input_review' }
  );

  const approved1 = await waitForCheckpoint(checkpoint1Id);
  if (!approved1) {
    throw new Error('Data processing checkpoint 1 was rejected');
  }

  await createLog('processing', 'Processing data items');

  // Simulate processing
  const processed = (input.data || []).map((item, index) => ({
    index,
    processed: true,
    timestamp: new Date().toISOString(),
  }));

  // Checkpoint 2: Review processed results
  const checkpoint2Id = await createCheckpoint(
    CheckpointType.APPROVAL_REQUIRED,
    `Review processed results. ${processed.length} items processed.`,
    {
      processedCount: processed.length,
      sample: processed.slice(0, 5),
    },
    { stage: 'output_review' }
  );

  const approved2 = await waitForCheckpoint(checkpoint2Id);
  if (!approved2) {
    throw new Error('Data processing checkpoint 2 was rejected');
  }

  await createLog('completed', `Successfully processed ${processed.length} items`);

  return {
    success: true,
    processedCount: processed.length,
    checkpoints: [checkpoint1Id, checkpoint2Id],
  };
};

/**
 * Simple task handler - creates info checkpoint (non-blocking)
 */
export const simpleTaskHandler: JobHandler = async (context) => {
  const { createLog, createCheckpoint, inputData } = context;

  await createLog('thinking', 'Executing simple task', inputData);

  // Create info checkpoint (doesn't block execution)
  await createCheckpoint(
    CheckpointType.INFO,
    'Task execution started',
    { input: inputData },
    { handler: 'simple-task' }
  );

  await createLog('executing', 'Processing task');

  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await createLog('completed', 'Task completed successfully');

  return {
    success: true,
    result: 'Task completed',
  };
};

/**
 * AI-powered task handler using Claude
 * Uses Claude to process tasks that require AI reasoning
 */
export const aiTaskHandler: JobHandler = async (context) => {
  const { createLog, createCheckpoint, waitForCheckpoint, inputData } = context;

  await createLog('thinking', 'Starting AI-powered task', inputData);

  if (!isClaudeConfigured()) {
    throw new Error(
      'Claude API key not configured. Please set ANTHROPIC_API_KEY in your .env file.'
    );
  }

  const input = inputData as {
    task?: string;
    prompt?: string;
    context?: Record<string, unknown>;
    useClaude?: boolean;
  };

  const taskDescription = input.task || input.prompt || 'Process this task using AI';
  const contextData = input.context || {};

  await createLog('ai-thinking', `Using Claude to process: ${taskDescription.substring(0, 100)}`);

  // Create checkpoint before AI processing
  const checkpointId = await createCheckpoint(
    CheckpointType.APPROVAL_REQUIRED,
    `AI task ready for processing. Review the task before Claude processes it.`,
    {
      task: taskDescription,
      context: contextData as Prisma.JsonValue,
      aiModel: 'claude-sonnet-4-20250514',
    } as Prisma.JsonValue,
    {
      handler: 'ai-task',
      requiresApproval: true,
    } as Prisma.JsonValue
  );

  await createLog('checkpoint', `Created checkpoint ${checkpointId} for AI task review`);

  // Wait for approval
  const approved = await waitForCheckpoint(checkpointId);
  if (!approved) {
    throw new Error('AI task checkpoint was rejected');
  }

  await createLog('ai-processing', 'Calling Claude API');

  try {
    // Call Claude with the task
    const systemPrompt = `You are a helpful AI assistant. Process the user's task carefully and provide a detailed response.`;

    const claudeResponse = await callClaude(systemPrompt, taskDescription, {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      temperature: 0.7,
    });

    await createLog(
      'ai-completed',
      `Claude processed task (${claudeResponse.inputTokens} input, ${claudeResponse.outputTokens} output tokens)`
    );

    // Create info checkpoint with results
    await createCheckpoint(
      CheckpointType.INFO,
      'AI task completed successfully',
      {
        response: claudeResponse.content.substring(0, 500), // Preview
        fullResponse: claudeResponse.content,
        tokens: {
          input: claudeResponse.inputTokens,
          output: claudeResponse.outputTokens,
        },
      },
      {
        handler: 'ai-task',
        stage: 'completed',
      }
    );

    return {
      success: true,
      result: claudeResponse.content,
      tokens: {
        input: claudeResponse.inputTokens,
        output: claudeResponse.outputTokens,
      },
      checkpointId,
    };
  } catch (error) {
    await createLog(
      'error',
      `Claude API error: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
};

/**
 * Registry of job handlers
 */
export const jobHandlers: Record<string, JobHandler> = {
  'code-generation': codeGenerationHandler,
  'data-processing': dataProcessingHandler,
  'simple-task': simpleTaskHandler,
  'ai-task': aiTaskHandler,
};

/**
 * Get a job handler by type
 */
export function getJobHandler(jobType: string): JobHandler | null {
  return jobHandlers[jobType] || null;
}
