// Vector Memory System for AI Agents
// Uses embeddings for semantic search and retrieval

import type { MemoryMatch } from './types';

interface MemoryEntry {
  id: string;
  content: string;
  summary?: string;
  embedding?: number[];
  memoryType: 'conversation' | 'task' | 'knowledge' | 'preference' | 'context';
  tags: string[];
  userId?: string;
  agentType?: string;
  importance: number; // 0-1 scale
  accessCount: number;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt?: Date;
}

// In-memory store (in production, use Supabase pgvector or Pinecone)
const memoryStore: Map<string, MemoryEntry> = new Map();

/**
 * Vector Memory Manager
 * Handles storage and retrieval of agent memories with semantic search
 */
export class VectorMemory {
  private apiKey: string;
  private embeddingModel: string = 'text-embedding-3-small';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Store a new memory
   */
  async store(
    content: string,
    options: {
      memoryType?: MemoryEntry['memoryType'];
      tags?: string[];
      userId?: string;
      agentType?: string;
      importance?: number;
      expiresInDays?: number;
    } = {}
  ): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate embedding if API key available
    let embedding: number[] | undefined;
    if (this.apiKey) {
      embedding = await this.generateEmbedding(content);
    }

    // Generate summary for long content
    const summary = content.length > 500 ? content.substring(0, 200) + '...' : undefined;

    const entry: MemoryEntry = {
      id,
      content,
      summary,
      embedding,
      memoryType: options.memoryType || 'knowledge',
      tags: options.tags || [],
      userId: options.userId,
      agentType: options.agentType,
      importance: options.importance || 0.5,
      accessCount: 0,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      expiresAt: options.expiresInDays
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
    };

    memoryStore.set(id, entry);

    // Also store in database for persistence
    await this.persistToDatabase(entry);

    return id;
  }

  /**
   * Search memories by semantic similarity
   */
  async search(
    query: string,
    options: {
      limit?: number;
      memoryType?: MemoryEntry['memoryType'];
      userId?: string;
      agentType?: string;
      minSimilarity?: number;
    } = {}
  ): Promise<MemoryMatch[]> {
    const limit = options.limit || 10;
    const minSimilarity = options.minSimilarity || 0.7;

    // Generate query embedding
    let queryEmbedding: number[] | undefined;
    if (this.apiKey) {
      queryEmbedding = await this.generateEmbedding(query);
    }

    // Filter and score memories
    const results: Array<MemoryEntry & { similarity: number }> = [];

    for (const entry of memoryStore.values()) {
      // Check expiration
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        memoryStore.delete(entry.id);
        continue;
      }

      // Apply filters
      if (options.memoryType && entry.memoryType !== options.memoryType) continue;
      if (options.userId && entry.userId !== options.userId) continue;
      if (options.agentType && entry.agentType !== options.agentType) continue;

      // Calculate similarity
      let similarity = 0;
      if (queryEmbedding && entry.embedding) {
        similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);
      } else {
        // Fallback to keyword matching
        similarity = this.keywordSimilarity(query, entry.content);
      }

      if (similarity >= minSimilarity) {
        results.push({ ...entry, similarity });
      }
    }

    // Sort by similarity and importance
    results.sort((a, b) => {
      const scoreA = a.similarity * 0.7 + a.importance * 0.3;
      const scoreB = b.similarity * 0.7 + b.importance * 0.3;
      return scoreB - scoreA;
    });

    // Update access counts
    const topResults = results.slice(0, limit);
    for (const result of topResults) {
      const entry = memoryStore.get(result.id);
      if (entry) {
        entry.accessCount++;
        entry.lastAccessedAt = new Date();
      }
    }

    return topResults.map((r) => ({
      id: r.id,
      content: r.content,
      summary: r.summary,
      similarity: r.similarity,
      memoryType: r.memoryType,
      tags: r.tags,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Get memory by ID
   */
  async get(id: string): Promise<MemoryEntry | null> {
    const entry = memoryStore.get(id);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessedAt = new Date();
    }
    return entry || null;
  }

  /**
   * Delete memory
   */
  async delete(id: string): Promise<boolean> {
    return memoryStore.delete(id);
  }

  /**
   * Clear all memories for a user
   */
  async clearUserMemories(userId: string): Promise<number> {
    let count = 0;
    for (const [id, entry] of memoryStore.entries()) {
      if (entry.userId === userId) {
        memoryStore.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalMemories: number;
    byType: Record<string, number>;
    avgImportance: number;
  } {
    const byType: Record<string, number> = {};
    let totalImportance = 0;

    for (const entry of memoryStore.values()) {
      byType[entry.memoryType] = (byType[entry.memoryType] || 0) + 1;
      totalImportance += entry.importance;
    }

    return {
      totalMemories: memoryStore.size,
      byType,
      avgImportance: memoryStore.size > 0 ? totalImportance / memoryStore.size : 0,
    };
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      // Return mock embedding for testing
      return Array(1536)
        .fill(0)
        .map(() => Math.random() - 0.5);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text.substring(0, 8000), // Limit input length
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Return mock embedding on error
      return Array(1536)
        .fill(0)
        .map(() => Math.random() - 0.5);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Simple keyword-based similarity fallback
   */
  private keywordSimilarity(query: string, content: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const contentWords = new Set(content.toLowerCase().split(/\s+/));

    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.has(word)) matches++;
    }

    return queryWords.size > 0 ? matches / queryWords.size : 0;
  }

  /**
   * Persist memory to database
   */
  private async persistToDatabase(entry: MemoryEntry): Promise<void> {
    // In production, save to Supabase with pgvector
    // For now, just log
    console.log(`[Memory] Stored: ${entry.id} (${entry.memoryType})`);
  }
}

// Singleton instance
let memoryInstance: VectorMemory | null = null;

export function getVectorMemory(): VectorMemory {
  if (!memoryInstance) {
    memoryInstance = new VectorMemory();
  }
  return memoryInstance;
}

// Convenience functions
export async function storeMemory(
  content: string,
  options?: Parameters<VectorMemory['store']>[1]
): Promise<string> {
  return getVectorMemory().store(content, options);
}

export async function searchMemory(
  query: string,
  options?: Parameters<VectorMemory['search']>[1]
): Promise<MemoryMatch[]> {
  return getVectorMemory().search(query, options);
}
