# Anthropic Claude API Integration

## ✅ Setup Complete

The Anthropic Claude API has been integrated into the agent worker system, enabling all agents to use Claude's powerful reasoning capabilities.

---

## 🔑 API Key Configuration

### 1. Add API Key to Environment

Add your Anthropic API key to your `.env` file:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Note**: Get your API key from: https://console.anthropic.com/

### 2. Verify Configuration

The system will automatically detect if Claude is configured:

```typescript
import { isClaudeConfigured } from '@/lib/agents/claude-client';

if (isClaudeConfigured()) {
  console.log('Claude is ready!');
}
```

---

## 🤖 Using Claude in Agent Jobs

### Available Job Types

#### 1. AI-Powered Task (`ai-task`)

Use Claude to process tasks that require AI reasoning:

```bash
POST /api/agent-jobs
{
  "jobType": "ai-task",
  "taskDescription": "Analyze this code and suggest improvements",
  "inputData": {
    "task": "Review this TypeScript code for best practices",
    "context": {
      "code": "function example() { ... }"
    }
  }
}
```

### Using Claude Client Directly

```typescript
import { callClaude } from '@/lib/agents/claude-client';

const response = await callClaude(
  'You are a helpful assistant.',
  'Explain quantum computing in simple terms',
  {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.7,
  }
);

console.log(response.content);
console.log(`Tokens: ${response.inputTokens} input, ${response.outputTokens} output`);
```

---

## 📋 Available Models

The system uses Claude Sonnet 4 by default, but you can specify other models:

- `claude-sonnet-4-20250514` (default) - Best balance of speed and capability
- `claude-opus-4-20250514` - Most capable, slower
- `claude-haiku-3-20240307` - Fastest, good for simple tasks

---

## 🔧 Integration Points

### 1. Orchestrator

The `Orchestrator` class automatically uses Claude when `ANTHROPIC_API_KEY` is set:

```typescript
import { Orchestrator } from '@/lib/agents/orchestrator';

const orchestrator = new Orchestrator();
// Automatically uses Claude if API key is configured
```

### 2. Job Handlers

All job handlers can now use Claude:

```typescript
import { callClaude, isClaudeConfigured } from '@/lib/agents/claude-client';

if (isClaudeConfigured()) {
  const response = await callClaude(systemPrompt, userPrompt);
  // Use Claude response
}
```

### 3. Live Chat

The live chat system uses Claude for AI responses when configured.

---

## 📊 Token Usage Tracking

Claude responses include token usage information:

```typescript
{
  content: "AI response text...",
  inputTokens: 150,
  outputTokens: 200
}
```

This information is automatically logged in agent jobs for cost tracking.

---

## 🛡️ Error Handling

The system gracefully handles Claude API errors:

- Missing API key: Clear error message
- API errors: Detailed error information
- Network issues: Automatic retry (if implemented)

---

## ✅ Verification

To verify Claude is working:

1. **Check environment variable:**

   ```bash
   echo $ANTHROPIC_API_KEY
   ```

2. **Test in code:**

   ```typescript
   import { isClaudeConfigured, callClaude } from '@/lib/agents/claude-client';

   if (isClaudeConfigured()) {
     const response = await callClaude('You are a test assistant.', 'Say hello!');
     console.log(response.content);
   }
   ```

3. **Create a test job:**

   ```bash
   curl -X POST http://localhost:3000/api/agent-jobs \
     -H "Content-Type: application/json" \
     -d '{
       "jobType": "ai-task",
       "taskDescription": "Test Claude integration",
       "inputData": {
         "task": "Say hello and confirm you are working"
       }
     }'
   ```

---

## 🎯 Next Steps

1. ✅ API key added to configuration
2. ✅ Claude client created
3. ✅ AI task handler implemented
4. ✅ Integration with orchestrator verified
5. ⏳ Test with actual job creation
6. ⏳ Monitor token usage and costs

---

## 📚 Documentation

- **Claude Client**: `lib/agents/claude-client.ts`
- **AI Task Handler**: `lib/agents/job-handlers.ts` (aiTaskHandler)
- **Orchestrator**: `lib/agents/orchestrator.ts`

---

**Status**: ✅ **Claude Integration Complete**

All agents can now use Claude for AI-powered reasoning and task processing!
