/**
 * AI Builder Agent
 * Autonomous project scaffolding agent that generates complete project structures
 */

import * as fs from "fs/promises";
import * as path from "path";
import { openaiClient } from "../ai-engine/models";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

interface BuildProjectInput {
  projectName: string;
  description: string;
  technologies: string[];
  features: string[];
  userId: string;
}

interface BuildPhaseResult {
  phase: string;
  success: boolean;
  data?: any;
  error?: string;
}

export class AIBuilderAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "AIBuilderAgent",
      enabled: true,
      schedule: "0 0 * * *", // Daily at midnight (on-demand only)
      retryAttempts: 1,
      timeout: 600000, // 10 minutes
      priority: "high",
      description:
        "Autonomous project scaffolding with AI-powered code generation",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    // This agent is triggered manually via API, not on schedule
    return {
      success: true,
      message: "AI Builder Agent is ready for on-demand project builds",
      data: {
        status: "idle",
        capabilities: [
          "Project architecture planning",
          "Directory structure generation",
          "File-by-file code implementation",
          "Documentation generation",
          "Best practices enforcement",
        ],
      },
    };
  }

  /**
   * Main build orchestration method (called from API endpoint)
   */
  async triggerBuild(input: BuildProjectInput): Promise<any> {
    const { projectName, description, technologies, features, userId } = input;
    const outputDir = path.join(
      process.cwd(),
      "generated-projects",
      projectName
    );

    this.context.logger.info(
      `[AI Builder] Starting build for project: ${projectName}`
    );
    this.emitProgress(userId, "started", { projectName, outputDir });

    const results: BuildPhaseResult[] = [];

    try {
      // Phase 1: Planning
      this.emitProgress(userId, "progress", {
        phase: "planning",
        message: "Analyzing requirements...",
      });
      const architecture = await this.generateArchitecture(
        description,
        technologies,
        features
      );
      results.push({ phase: "planning", success: true, data: architecture });

      // Phase 2: Directory Structure
      this.emitProgress(userId, "progress", {
        phase: "scaffolding",
        message: "Creating directory structure...",
      });
      await fs.mkdir(outputDir, { recursive: true });
      await this.createDirectoryStructure(outputDir, architecture.structure);
      results.push({ phase: "scaffolding", success: true });

      // Phase 3: File Generation
      this.emitProgress(userId, "progress", {
        phase: "implementation",
        message: "Generating code files...",
      });
      for (const file of architecture.files) {
        const filePath = path.join(outputDir, file.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const content = await this.generateFileContent(
          file.path,
          file.description,
          technologies
        );
        await fs.writeFile(filePath, content);
        this.emitProgress(userId, "progress", {
          phase: "implementation",
          message: `Generated: ${file.path}`,
          progress:
            (architecture.files.indexOf(file) / architecture.files.length) *
            100,
        });
      }
      results.push({
        phase: "implementation",
        success: true,
        data: { filesGenerated: architecture.files.length },
      });

      // Phase 4: Documentation
      this.emitProgress(userId, "progress", {
        phase: "documentation",
        message: "Creating README.md...",
      });
      const readme = await this.generateReadme(
        projectName,
        description,
        technologies,
        features
      );
      await fs.writeFile(path.join(outputDir, "README.md"), readme);
      results.push({ phase: "documentation", success: true });

      // Phase 5: Summary
      const fileTree = await this.generateFileTree(outputDir);
      const summary = {
        projectName,
        outputDir,
        technologies,
        filesGenerated: architecture.files.length + 1, // +1 for README
        phases: results,
        fileTree,
      };

      this.emitProgress(userId, "completed", summary);
      this.context.logger.info(`[AI Builder] Build completed: ${projectName}`);

      return {
        success: true,
        message: "Project built successfully",
        data: summary,
      };
    } catch (error) {
      this.context.logger.error(
        `[AI Builder] Build failed for ${projectName}:`,
        error
      );
      this.emitProgress(userId, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        phases: results,
      });

      return {
        success: false,
        message: "Project build failed",
        error: error instanceof Error ? error.message : "Unknown error",
        data: { phases: results },
      };
    }
  }

  /**
   * Generate project architecture using GPT-4
   */
  private async generateArchitecture(
    description: string,
    technologies: string[],
    features: string[]
  ): Promise<any> {
    if (!openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const prompt = `
You are an expert software architect. Design a complete project structure for the following:

Description: ${description}
Technologies: ${technologies.join(", ")}
Features: ${features.join(", ")}

Respond with a JSON object containing:
{
  "structure": ["directory/path", ...],
  "files": [
    { "path": "file/path.ext", "description": "what this file does" },
    ...
  ]
}

Include all necessary files (config, source, tests, etc). Be comprehensive but practical.
`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a software architecture expert. Respond only with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  }

  /**
   * Create directory structure
   */
  private async createDirectoryStructure(
    baseDir: string,
    directories: string[]
  ): Promise<void> {
    for (const dir of directories) {
      await fs.mkdir(path.join(baseDir, dir), { recursive: true });
    }
  }

  /**
   * Generate file content using GPT-4
   */
  private async generateFileContent(
    filePath: string,
    description: string,
    technologies: string[]
  ): Promise<string> {
    if (!openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const fileExt = path.extname(filePath);
    const language = this.getLanguageFromExtension(fileExt);

    const prompt = `
Generate production-ready code for this file:

File: ${filePath}
Purpose: ${description}
Technologies: ${technologies.join(", ")}
Language: ${language}

Include:
- Proper comments and documentation
- Error handling
- Best practices
- Type safety (if applicable)

Provide ONLY the code, no explanations.
`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert ${language} developer. Write clean, production-ready code.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    return response.choices[0].message.content || "// Generated code";
  }

  /**
   * Generate README.md
   */
  private async generateReadme(
    projectName: string,
    description: string,
    technologies: string[],
    features: string[]
  ): Promise<string> {
    if (!openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const prompt = `
Create a comprehensive README.md for this project:

Project: ${projectName}
Description: ${description}
Technologies: ${technologies.join(", ")}
Features: ${features.join(", ")}

Include:
- Project overview
- Installation instructions
- Usage examples
- Configuration guide
- Contributing guidelines
- License information

Make it professional and developer-friendly.
`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a technical writer. Create clear, comprehensive documentation.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    return (
      response.choices[0].message.content ||
      `# ${projectName}\n\n${description}`
    );
  }

  /**
   * Generate file tree visualization
   */
  private async generateFileTree(dir: string, prefix = ""): Promise<string> {
    let tree = "";
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLast = i === items.length - 1;
      const connector = isLast ? "└── " : "├── ";

      tree += `${prefix}${connector}${item.name}\n`;

      if (item.isDirectory()) {
        const newPrefix = prefix + (isLast ? "    " : "│   ");
        tree += await this.generateFileTree(
          path.join(dir, item.name),
          newPrefix
        );
      }
    }

    return tree;
  }

  /**
   * Emit Socket.IO progress events
   */
  private emitProgress(userId: string, status: string, data: any): void {
    if (this.context.io) {
      this.context.io.to(`user-${userId}`).emit("ai-builder:progress", {
        status,
        data,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Determine programming language from file extension
   */
  private getLanguageFromExtension(ext: string): string {
    const languageMap: Record<string, string> = {
      ".ts": "TypeScript",
      ".tsx": "TypeScript React",
      ".js": "JavaScript",
      ".jsx": "JavaScript React",
      ".py": "Python",
      ".java": "Java",
      ".go": "Go",
      ".rs": "Rust",
      ".rb": "Ruby",
      ".php": "PHP",
      ".cs": "C#",
      ".cpp": "C++",
      ".c": "C",
      ".sql": "SQL",
      ".json": "JSON",
      ".yaml": "YAML",
      ".yml": "YAML",
      ".md": "Markdown",
      ".html": "HTML",
      ".css": "CSS",
      ".scss": "SCSS",
    };

    return languageMap[ext.toLowerCase()] || "Plain Text";
  }
}
