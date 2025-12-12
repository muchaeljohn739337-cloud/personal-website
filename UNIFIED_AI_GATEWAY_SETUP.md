cd /home/mucha/
m-odular-saas-platform/backend && npm run build 2>&1 | tail -40cd /home/mucha/
m-odular-saas-platform/backend && npm run build 2>&1 | tail -4# 🚀 Unified AI Gateway - Complete Setup Guide

Access **7 AI providers** from one unified interface!

## 🎯 Supported Providers

1. **Claude** (Anthropic) - claude-3-5-sonnet, claude-3-opus, claude-3-haiku
2. **GPT** (OpenAI) - gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
3. **DeepSeek** - deepseek-chat, deepseek-coder
4. **Gemini** (Google) - gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash
5. **Llama 3** (Ollama) - llama3.2:1b, llama3.2:3b, llama3.1:8b
6. **Command R+** (Cohere) - command-r-plus, command-r
7. **Cloudflare AI Workers** - llama-3.1-8b, llama-3.1-70b, mistral-7b

## 📦 Installation

### 1. Install Required Dependencies

```bash
cd backend
npm install @anthropic-ai/sdk @google/generative-ai openai
```

### 2. Environment Variables

Add to your `backend/.env`:

```bash
# OpenAI (GPT)
OPENAI_API_KEY=sk-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# DeepSeek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_ENDPOINT=https://api.deepseek.com

# Google Gemini
GEMINI_API_KEY=...

# Ollama (Local - Already Running!)
OLLAMA_ENDPOINT=http://127.0.0.1:11434

# Cohere
COHERE_API_KEY=...

# Cloudflare AI Workers
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

### 3. Register Route in `backend/src/index.ts`

Add this import:
```typescript
import aiGatewayRouter from "./routes/ai-gateway";
```

Add this route (around line 200):
```typescript
app.use("/api/ai-gateway", aiGatewayRouter); // Unified AI Gateway
```

### 4. Start the Backend

```bash
cd backend
npm run dev
```

## 🔥 Quick Start

### Example 1: Simple Chat Request

```bash
curl -X POST http://localhost:4000/api/ai-gateway/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "provider": "ollama",
    "model": "llama3.2:1b"
  }'
```

### Example 2: Auto-Select Best Provider

```bash
curl -X POST http://localhost:4000/api/ai-gateway/best \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a Python function to calculate fibonacci",
    "criteria": "cost"
  }'
```

### Example 3: Compare Multiple Providers

```bash
curl -X POST http://localhost:4000/api/ai-gateway/compare \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the capital of France?",
    "providers": ["ollama", "gemini", "openai"]
  }'
```

### Example 4: List Available Providers

```bash
curl http://localhost:4000/api/ai-gateway/providers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 5: Get Models for a Provider

```bash
curl http://localhost:4000/api/ai-gateway/models/anthropic \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 API Endpoints

### 1. `POST /api/ai-gateway/chat`
Send a chat request to any AI provider

**Request:**
```json
{
  "prompt": "Your question here",
  "systemPrompt": "Optional system prompt",
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "maxTokens": 4000,
  "temperature": 0.7,
  "cache": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "AI response...",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "tokens": {
      "prompt": 15,
      "completion": 250,
      "total": 265
    },
    "cost": 0.0000795,
    "latency": 1250,
    "cached": false
  }
}
```

### 2. `GET /api/ai-gateway/providers`
List all available providers

### 3. `GET /api/ai-gateway/models/:provider`
List models for a specific provider

### 4. `GET /api/ai-gateway/stats`
Get usage statistics

### 5. `POST /api/ai-gateway/compare`
Compare responses from multiple providers

### 6. `POST /api/ai-gateway/best`
Auto-select best provider based on criteria

### 7. `POST /api/ai-gateway/cache/clear`
Clear response cache

## 💰 Cost Comparison (per 1M tokens)

| Provider | Model | Cost |
|----------|-------|------|
| **Gemini** | gemini-2.0-flash-exp | **FREE** |
| **Ollama** | llama3.2:1b (local) | **FREE** |
| **Cloudflare** | llama-3.1-8b | **FREE** |
| DeepSeek | deepseek-chat | $0.14 |
| OpenAI | gpt-4o-mini | $0.15 |
| Anthropic | claude-3-haiku | $0.25 |
| Anthropic | claude-3-5-sonnet | $3.00 |
| OpenAI | gpt-4o | $5.00 |
| Anthropic | claude-3-opus | $15.00 |

## 🚀 Features

✅ **7 AI Providers** - Access all major AI models  
✅ **Automatic Failover** - Switches to backup if primary fails  
✅ **Cost Optimization** - Choose cheapest or free models  
✅ **Response Caching** - Avoid duplicate requests  
✅ **Usage Tracking** - Monitor API usage per provider  
✅ **Load Balancing** - Distribute requests efficiently  
✅ **Model Comparison** - Test multiple models simultaneously  

## 🔧 Advanced Usage

### TypeScript Example

```typescript
import { aiGateway } from "./services/UnifiedAIGateway";

// Use Claude
const claudeResponse = await aiGateway.chat({
  prompt: "Explain machine learning",
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 2000,
  temperature: 0.7,
});

// Use local Llama (FREE!)
const llamaResponse = await aiGateway.chat({
  prompt: "Write a haiku about coding",
  provider: "ollama",
  model: "llama3.2:1b",
});

// Auto-select best provider
const bestResponse = await aiGateway.chat({
  prompt: "Summarize this article...",
  cache: true, // Enable caching
});

console.log(bestResponse.content);
console.log(`Cost: $${bestResponse.cost.toFixed(4)}`);
console.log(`Latency: ${bestResponse.latency}ms`);
```

### Integration with Your Agents

```typescript
// In your agent code
import { aiGateway } from "../services/UnifiedAIGateway";

export class SmartAgent extends BaseAgent {
  async execute(): Promise<AgentResult> {
    const response = await aiGateway.chat({
      prompt: "Analyze this data...",
      provider: "gemini", // Use free Gemini
      systemPrompt: "You are a data analyst",
      cache: true,
    });

    return {
      success: true,
      message: response.content,
      data: {
        cost: response.cost,
        tokens: response.tokens.total,
      },
    };
  }
}
```

## 📝 Getting API Keys

### 1. **OpenAI (GPT)**
- Go to: https://platform.openai.com/api-keys
- Create new secret key
- Add to `.env` as `OPENAI_API_KEY`

### 2. **Anthropic (Claude)**
- Go to: https://console.anthropic.com/settings/keys
- Create new API key
- Add to `.env` as `ANTHROPIC_API_KEY`

### 3. **DeepSeek**
- Go to: https://platform.deepseek.com/api_keys
- Generate new key
- Add to `.env` as `DEEPSEEK_API_KEY`

### 4. **Google Gemini**
- Go to: https://aistudio.google.com/app/apikey
- Create API key
- Add to `.env` as `GEMINI_API_KEY`

### 5. **Cohere**
- Go to: https://dashboard.cohere.com/api-keys
- Create new key
- Add to `.env` as `COHERE_API_KEY`

### 6. **Cloudflare**
- Go to: https://dash.cloudflare.com/
- Get Account ID and API Token
- Add to `.env` as `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`

### 7. **Ollama**
- Already installed and running on your system!
- Uses local endpoint: `http://127.0.0.1:11434`

## 🎯 Recommended Strategy

**For Development:**
- Use **Ollama** (llama3.2:1b) - FREE, fast, local

**For Production (Cost-Effective):**
- Primary: **Gemini** (gemini-2.0-flash-exp) - FREE
- Backup: **DeepSeek** - $0.14 per 1M tokens

**For High Quality:**
- Primary: **Claude** (claude-3-5-sonnet) - Best reasoning
- Backup: **GPT-4o** - Great all-rounder

## 🔒 Security Notes

- All API keys stored in environment variables
- JWT authentication required for all endpoints
- Rate limiting applied via existing middleware
- Response caching to reduce costs

## 📊 Monitor Usage

```bash
curl http://localhost:4000/api/ai-gateway/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "ollama": 45,
    "gemini": 23,
    "openai": 12,
    "anthropic": 8
  }
}
```

## 🎉 You're Ready!

Your SaaS platform now has access to **all major AI models** from one unified interface!

**Next Steps:**
1. Get API keys for providers you want to use
2. Add them to `.env`
3. Restart backend: `npm run dev`
4. Test with the examples above

Questions? Check the code in:
- `backend/src/services/UnifiedAIGateway.ts`
- `backend/src/routes/ai-gateway.ts`
