import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { aiBrain } from "../brain";

const prisma = new PrismaClient();

export interface CodeTaskData {
  type: "lint" | "fix" | "analyze" | "review" | "generate";
  code?: string;
  filePath?: string;
  language?: string;
  prompt?: string;
  context?: any;
}

export class CodeHandler {
  async handle(taskData: CodeTaskData): Promise<any> {
    try {
      switch (taskData.type) {
        case "lint":
          return await this.lintCode(taskData);
        case "fix":
          return await this.fixCode(taskData);
        case "analyze":
          return await this.analyzeCode(taskData);
        case "review":
          return await this.reviewCode(taskData);
        case "generate":
          return await this.generateCode(taskData);
        default:
          throw new Error(`Unknown code task type: ${taskData.type}`);
      }
    } catch (error: any) {
      console.error("Code handler error:", error);
      throw new Error(`Code task failed: ${error.message}`);
    }
  }

  private async lintCode(taskData: CodeTaskData): Promise<any> {
    const code = taskData.code || "";
    const language = taskData.language || "typescript";

    const prompt = `Analyze this ${language} code for linting issues and best practices:

\`\`\`${language}
${code}
\`\`\`

Identify:
1. Syntax errors
2. Style violations
3. Potential bugs
4. Performance issues
5. Security concerns

Return as JSON with structure: { issues: [{ line, severity, message, fix }] }`;

    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a code linting assistant. Analyze code for issues and return JSON.",
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 1000,
    });
    const analysis = aiResponse.content;

    try {
      const result = JSON.parse(analysis);

      // Create suggestions for each issue
      if (result.issues && result.issues.length > 0) {
        await Promise.all(
          result.issues.slice(0, 10).map((issue: any) =>
            prisma.ai_suggestions.create({
              data: {
                id: randomUUID(),
                user_id: "1",
                type: "code-lint",
                content: `Line ${issue.line}: ${issue.message}`,
              },
            })
          )
        );
      }

      return {
        success: true,
        issues: result.issues || [],
        summary: `Found ${result.issues?.length || 0} issues`,
      };
    } catch (parseError) {
      return {
        success: true,
        analysis,
        raw: true,
      };
    }
  }

  private async fixCode(taskData: CodeTaskData): Promise<any> {
    const code = taskData.code || "";
    const language = taskData.language || "typescript";

    const prompt = `Fix the issues in this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Context: ${JSON.stringify(taskData.context || {})}

Return:
1. Fixed code
2. Explanation of changes
3. Remaining issues (if any)`;

    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a code fixing assistant. Fix issues and explain changes.",
      userPrompt: prompt,
      temperature: 0.4,
      maxTokens: 1500,
    });
    const result = aiResponse.content;

    // Store suggestion
    await prisma.ai_suggestions.create({
      data: {
        id: randomUUID(),
        user_id: "1",
        type: "code-fix",
        content: result,
      },
    });

    return {
      success: true,
      fixedCode: result,
      requiresApproval: true,
    };
  }

  private async analyzeCode(taskData: CodeTaskData): Promise<any> {
    const code = taskData.code || "";

    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a code analysis assistant. Analyze the code structure and quality.",
      userPrompt: `Analyze this code:\n\n${code}`,
      temperature: 0.3,
      maxTokens: 800,
    });
    const analysis = aiResponse.content;

    return {
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    };
  }

  private async reviewCode(taskData: CodeTaskData): Promise<any> {
    const code = taskData.code || "";
    const language = taskData.language || "typescript";

    const prompt = `Perform a comprehensive code review of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Review for:
1. Code quality and maintainability
2. Performance optimization opportunities
3. Security vulnerabilities
4. Best practices adherence
5. Documentation quality
6. Test coverage needs

Provide specific, actionable recommendations.`;

    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a code review assistant. Provide comprehensive code reviews.",
      userPrompt: prompt,
      temperature: 0.5,
      maxTokens: 1200,
    });
    const review = aiResponse.content;

    // Store as suggestion
    await prisma.ai_suggestions.create({
      data: {
        id: randomUUID(),
        user_id: "1",
        type: "code-review",
        content: review,
      },
    });

    return {
      success: true,
      review,
      requiresApproval: false,
    };
  }

  private async generateCode(taskData: CodeTaskData): Promise<any> {
    const promptText = taskData.prompt || "";
    const lang = taskData.language || "typescript";
    const context = taskData.context || {};

    const fullPrompt =
      "Generate " +
      lang +
      " code for the following requirement:\n\n" +
      promptText +
      "\n\n" +
      "Context: " +
      JSON.stringify(context) +
      "\n\n" +
      "Requirements:\n" +
      "- Follow best practices\n" +
      "- Include error handling\n" +
      "- Add comments for complex logic\n" +
      "- Make it production-ready\n" +
      "- Include type definitions if applicable";

    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a code generation assistant. Generate production-ready code.",
      userPrompt: fullPrompt,
      temperature: 0.6,
      maxTokens: 2000,
    });
    const generatedCode = aiResponse.content;

    // Store as suggestion
    await prisma.ai_suggestions.create({
      data: {
        id: randomUUID(),
        user_id: "1",
        type: "code-generation",
        content: generatedCode,
      },
    });

    return {
      success: true,
      code: generatedCode,
      requiresApproval: true,
      language: lang,
    };
  }

  async suggestRefactoring(code: string, language: string): Promise<any> {
    const prompt =
      "Suggest refactoring improvements for this " +
      language +
      " code:\n\n" +
      "```" +
      language +
      "\n" +
      code +
      "\n" +
      "```\n\n" +
      "Focus on:\n" +
      "- Code duplication\n" +
      "- Function complexity\n" +
      "- Naming conventions\n" +
      "- Design patterns\n" +
      "- Modularity";

    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a code refactoring assistant. Suggest improvements for code quality.",
      userPrompt: prompt,
      temperature: 0.5,
      maxTokens: 1000,
    });
    const suggestions = aiResponse.content;

    return {
      suggestions,
      confidence: 0.8,
    };
  }
}

export const codeHandler = new CodeHandler();
