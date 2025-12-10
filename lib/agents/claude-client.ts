/**
 * Claude (Anthropic) API Client
 * Helper utilities for using Claude in agent jobs
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Call Claude API with a prompt
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    messages?: ClaudeMessage[];
  } = {}
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please set it in your .env file.');
  }

  const {
    model = 'claude-sonnet-4-20250514',
    maxTokens = 4096,
    temperature = 0.7,
    messages = [],
  } = options;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: messages.length > 0 ? messages : [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || '',
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to call Claude API: ${String(error)}`);
  }
}

/**
 * Check if Claude API key is configured
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Get Claude API key (for internal use)
 */
export function getClaudeApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}
