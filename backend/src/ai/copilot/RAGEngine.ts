/**
 * RAGEngine.ts
 *
 * Vector database integration for semantic code search.
 * Indexes codebase files into embeddings for context retrieval.
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { ChromaClient } from "chromadb";
import OpenAI from "openai";
import { vaultService } from "../../services/VaultService";

interface CodeChunk {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  embedding?: number[];
}

interface SearchResult {
  filePath: string;
  content: string;
  score: number;
  startLine: number;
  endLine: number;
}

interface RAGConfig {
  vectorDB: "pinecone" | "chromadb";
  indexName: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

export class RAGEngine {
  private openai: OpenAI | null = null;
  private pinecone: Pinecone | null = null;
  private chroma: ChromaClient | null = null;
  private config: RAGConfig;
  private indexedFiles: Map<string, Date> = new Map();

  constructor() {
    this.config = {
      vectorDB:
        (process.env.COPILOT_VECTOR_DB as "pinecone" | "chromadb") ||
        "chromadb",
      indexName: process.env.COPILOT_INDEX_NAME || "advancia-codebase",
      embeddingModel:
        process.env.COPILOT_EMBEDDING_MODEL || "text-embedding-ada-002",
      chunkSize: parseInt(process.env.COPILOT_CHUNK_SIZE || "512"),
      chunkOverlap: parseInt(process.env.COPILOT_CHUNK_OVERLAP || "50"),
      topK: parseInt(process.env.COPILOT_TOP_K || "5"),
    };
  }

  async initialize(): Promise<void> {
    console.log("[RAGEngine] Initializing...");

    const openaiKey =
      (await vaultService.getSecret("OPENAI_API_KEY").catch(() => null)) ||
      process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn("[RAGEngine] OpenAI API key not found, RAG disabled");
      return;
    }

    this.openai = new OpenAI({ apiKey: openaiKey });

    if (this.config.vectorDB === "pinecone") {
      await this.initializePinecone();
    } else {
      await this.initializeChroma();
    }

    console.log(`[RAGEngine] Initialized with ${this.config.vectorDB}`);
  }

  private async initializePinecone(): Promise<void> {
    const pineconeKey =
      (await vaultService.getSecret("PINECONE_API_KEY").catch(() => null)) ||
      process.env.PINECONE_API_KEY;
    if (!pineconeKey) {
      throw new Error("Pinecone API key not found");
    }

    this.pinecone = new Pinecone({ apiKey: pineconeKey });

    try {
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(
        (idx) => idx.name === this.config.indexName
      );

      if (!indexExists) {
        console.log(
          `[RAGEngine] Creating Pinecone index: ${this.config.indexName}`
        );
        await this.pinecone.createIndex({
          name: this.config.indexName,
          dimension: 1536,
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });
      }
    } catch (error) {
      console.error("[RAGEngine] Pinecone initialization error:", error);
      throw error;
    }
  }

  private async initializeChroma(): Promise<void> {
    const chromaPath = process.env.COPILOT_CHROMA_PATH || "./data/chromadb";

    this.chroma = new ChromaClient({ path: chromaPath });

    try {
      await this.chroma.getCollection({ name: this.config.indexName });
      console.log(
        `[RAGEngine] ChromaDB collection exists: ${this.config.indexName}`
      );
    } catch {
      console.log(
        `[RAGEngine] Creating ChromaDB collection: ${this.config.indexName}`
      );
      await this.chroma.createCollection({
        name: this.config.indexName,
        metadata: { "hnsw:space": "cosine" },
      });
    }
  }

  async searchSimilar(query: string, topK?: number): Promise<SearchResult[]> {
    if (!this.openai) {
      console.warn(
        "[RAGEngine] OpenAI not initialized, returning empty results"
      );
      return [];
    }

    const k = topK || this.config.topK;

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.embeddingModel,
        input: [query],
      });

      const queryEmbedding = response.data[0].embedding;

      if (this.config.vectorDB === "pinecone" && this.pinecone) {
        return await this.searchPinecone(queryEmbedding, k);
      } else if (this.chroma) {
        return await this.searchChroma(queryEmbedding, k);
      }
    } catch (error) {
      console.error("[RAGEngine] Search failed:", error);
    }

    return [];
  }

  private async searchPinecone(
    embedding: number[],
    topK: number
  ): Promise<SearchResult[]> {
    if (!this.pinecone) return [];

    const index = this.pinecone.index(this.config.indexName);
    const results = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    return (
      results.matches?.map((match) => ({
        filePath: match.metadata?.filePath as string,
        content: match.metadata?.content as string,
        score: match.score || 0,
        startLine: match.metadata?.startLine as number,
        endLine: match.metadata?.endLine as number,
      })) || []
    );
  }

  private async searchChroma(
    embedding: number[],
    topK: number
  ): Promise<SearchResult[]> {
    if (!this.chroma) return [];

    const collection = await this.chroma.getCollection({
      name: this.config.indexName,
    });
    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: topK,
    });

    const matches: SearchResult[] = [];
    for (let i = 0; i < results.ids[0].length; i++) {
      matches.push({
        filePath: results.metadatas[0][i].filePath as string,
        content: results.documents[0][i] as string,
        score: 1 - (results.distances?.[0][i] || 0),
        startLine: results.metadatas[0][i].startLine as number,
        endLine: results.metadatas[0][i].endLine as number,
      });
    }

    return matches;
  }

  getStatistics() {
    return {
      indexedFiles: this.indexedFiles.size,
      vectorDB: this.config.vectorDB,
      indexName: this.config.indexName,
      embeddingModel: this.config.embeddingModel,
    };
  }
}

export const ragEngine = new RAGEngine();
