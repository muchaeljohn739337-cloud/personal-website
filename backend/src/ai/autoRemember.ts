/**
 * Auto-Remember System
 *
 * Purpose: Continuous learning and memory storage for AI systems
 * Stores all AI decisions, fixes, optimizations for future reference
 */

import * as fs from "fs";
import * as path from "path";
import prisma from "../prismaClient";

interface MemoryEntry {
  category: string;
  data: any;
  timestamp?: string;
}

interface MemoryQuery {
  category?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

class AutoRememberSystem {
  private memoryPath: string;
  private memoryCache: Map<string, MemoryEntry[]> = new Map();

  constructor() {
    this.memoryPath = path.join(__dirname, "../../../memory");
    this.ensureMemoryDirectory();
    console.log("🧠 Auto-Remember System initialized");
  }

  private ensureMemoryDirectory(): void {
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
  }

  /**
   * Store a memory entry
   */
  async store(entry: MemoryEntry): Promise<void> {
    try {
      const timestamp = entry.timestamp || new Date().toISOString();
      const fullEntry: MemoryEntry = {
        ...entry,
        timestamp,
      };

      // Add to cache
      if (!this.memoryCache.has(entry.category)) {
        this.memoryCache.set(entry.category, []);
      }
      this.memoryCache.get(entry.category)!.push(fullEntry);

      // Store to file system (append mode)
      const categoryFile = path.join(this.memoryPath, `${entry.category}.jsonl`);
      fs.appendFileSync(categoryFile, JSON.stringify(fullEntry) + "\n");

      // Also store in database if AuditLog model exists
      try {
        await prisma.audit_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId: "system",
            action: `auto_remember_${entry.category}`,
            ipAddress: "internal",
            userAgent: "Auto-Remember System",
            metadata: fullEntry.data,
            resourceType: "system",
            resourceId: "auto-remember",
          },
        });
      } catch (dbError) {
        // Database might not be available, continue with file storage
        console.log("Auto-Remember: Database storage unavailable, using file system only");
      }
    } catch (error) {
      console.error("Failed to store memory:", error);
    }
  }

  /**
   * Query stored memories
   */
  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    try {
      const results: MemoryEntry[] = [];

      // If category specified, query that file
      if (query.category) {
        const categoryFile = path.join(this.memoryPath, `${query.category}.jsonl`);

        if (fs.existsSync(categoryFile)) {
          const lines = fs
            .readFileSync(categoryFile, "utf-8")
            .split("\n")
            .filter((l) => l.trim());

          for (const line of lines) {
            try {
              const entry = JSON.parse(line);

              // Filter by date if specified
              if (query.fromDate && new Date(entry.timestamp) < query.fromDate) continue;
              if (query.toDate && new Date(entry.timestamp) > query.toDate) continue;

              results.push(entry);
            } catch (parseError) {
              // Skip invalid JSON lines
            }
          }
        }
      } else {
        // Query all categories
        const files = fs.readdirSync(this.memoryPath).filter((f) => f.endsWith(".jsonl"));

        for (const file of files) {
          const filePath = path.join(this.memoryPath, file);
          const lines = fs
            .readFileSync(filePath, "utf-8")
            .split("\n")
            .filter((l) => l.trim());

          for (const line of lines) {
            try {
              const entry = JSON.parse(line);

              // Filter by date if specified
              if (query.fromDate && new Date(entry.timestamp) < query.fromDate) continue;
              if (query.toDate && new Date(entry.timestamp) > query.toDate) continue;

              results.push(entry);
            } catch (parseError) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Apply limit
      if (query.limit) {
        return results.slice(-query.limit);
      }

      return results;
    } catch (error) {
      console.error("Failed to query memories:", error);
      return [];
    }
  }

  /**
   * Get statistics about stored memories
   */
  async getStatistics(): Promise<{
    categories: string[];
    totalEntries: number;
    oldestEntry: string;
    newestEntry: string;
    categoryCounts: Record<string, number>;
  }> {
    try {
      const files = fs.readdirSync(this.memoryPath).filter((f) => f.endsWith(".jsonl"));
      const categories = files.map((f) => f.replace(".jsonl", ""));
      const categoryCounts: Record<string, number> = {};

      let totalEntries = 0;
      let oldestEntry = new Date().toISOString();
      let newestEntry = new Date(0).toISOString();

      for (const file of files) {
        const category = file.replace(".jsonl", "");
        const filePath = path.join(this.memoryPath, file);
        const lines = fs
          .readFileSync(filePath, "utf-8")
          .split("\n")
          .filter((l) => l.trim());

        categoryCounts[category] = lines.length;
        totalEntries += lines.length;

        // Check timestamps
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.timestamp < oldestEntry) oldestEntry = entry.timestamp;
            if (entry.timestamp > newestEntry) newestEntry = entry.timestamp;
          } catch (parseError) {
            // Skip invalid entries
          }
        }
      }

      return {
        categories,
        totalEntries,
        oldestEntry,
        newestEntry,
        categoryCounts,
      };
    } catch (error) {
      console.error("Failed to get statistics:", error);
      return {
        categories: [],
        totalEntries: 0,
        oldestEntry: "",
        newestEntry: "",
        categoryCounts: {},
      };
    }
  }

  /**
   * Clear old memories (retention policy)
   */
  async clearOldMemories(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;

      const files = fs.readdirSync(this.memoryPath).filter((f) => f.endsWith(".jsonl"));

      for (const file of files) {
        const filePath = path.join(this.memoryPath, file);
        const lines = fs
          .readFileSync(filePath, "utf-8")
          .split("\n")
          .filter((l) => l.trim());
        const kept: string[] = [];

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (new Date(entry.timestamp) >= cutoffDate) {
              kept.push(line);
            } else {
              deletedCount++;
            }
          } catch (parseError) {
            // Keep invalid entries
            kept.push(line);
          }
        }

        // Rewrite file with kept entries
        fs.writeFileSync(filePath, kept.join("\n") + "\n");
      }

      console.log(`🧹 Auto-Remember: Cleared ${deletedCount} old memories`);
      return deletedCount;
    } catch (error) {
      console.error("Failed to clear old memories:", error);
      return 0;
    }
  }

  /**
   * Export memories to JSON
   */
  async export(category?: string): Promise<any> {
    try {
      const memories = await this.query({ category });

      const exportData = {
        exportDate: new Date().toISOString(),
        category: category || "all",
        count: memories.length,
        memories,
      };

      const exportPath = path.join(this.memoryPath, `export_${category || "all"}_${Date.now()}.json`);

      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

      console.log(`📦 Auto-Remember: Exported ${memories.length} memories to ${exportPath}`);
      return exportData;
    } catch (error) {
      console.error("Failed to export memories:", error);
      return null;
    }
  }

  /**
   * Cleanup (singleton handles connection)
   */
  async disconnect(): Promise<void> {
    // No action needed - singleton handles connection lifecycle
    console.log("🔌 Auto-Remember System cleanup complete");
  }
}

// Singleton instance
export const autoRemember = new AutoRememberSystem();

// Auto-cleanup old memories daily
setInterval(async () => {
  await autoRemember.clearOldMemories(90); // Keep 90 days
}, 86400000); // Run daily
