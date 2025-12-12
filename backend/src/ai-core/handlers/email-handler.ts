import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { aiBrain } from "../brain";

const prisma = new PrismaClient();

export interface EmailTaskData {
  to: string | string[];
  subject?: string;
  template?: string;
  context?: any;
  aiGenerate?: boolean;
  prompt?: string;
}

export class EmailHandler {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async handle(taskData: EmailTaskData): Promise<any> {
    try {
      let subject = taskData.subject;
      let html = "";

      // AI-generated email content
      if (taskData.aiGenerate && taskData.prompt) {
        const aiResponse = await aiBrain.analyze({
          model: "gpt-3.5-turbo",
          systemPrompt:
            "You are an email generation assistant. Generate professional email content.",
          userPrompt: taskData.prompt,
          temperature: 0.7,
          maxTokens: 500,
        });
        const generated = aiResponse.content;

        // Parse AI response to extract subject and body
        const lines = generated.split("\n");
        const subjectLine = lines.find((l: string) =>
          l.toLowerCase().startsWith("subject:")
        );
        if (subjectLine) {
          subject = subjectLine.replace(/^subject:\s*/i, "").trim();
        }

        html = lines
          .filter((l: string) => !l.toLowerCase().startsWith("subject:"))
          .join("\n");
      } else if (taskData.template) {
        // Use template system
        html = await this.renderTemplate(taskData.template, taskData.context);
      } else {
        html = taskData.context?.body || "";
      }

      // Send email
      const recipients = Array.isArray(taskData.to)
        ? taskData.to
        : [taskData.to];

      const results = await Promise.all(
        recipients.map((to) =>
          this.transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject: subject || "Notification",
            html,
          })
        )
      );

      // Log sent emails
      console.log("Emails sent:", {
        recipients,
        subject,
        messageIds: results.map((r) => r.messageId),
      });

      return {
        success: true,
        sent: recipients.length,
        messageIds: results.map((r) => r.messageId),
      };
    } catch (error: any) {
      console.error("Email handler error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  private async renderTemplate(
    template: string,
    context: any
  ): Promise<string> {
    // Simple template rendering
    let html = template;

    for (const [key, value] of Object.entries(context || {})) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      html = html.replace(regex, String(value));
    }

    return html;
  }

  async generateWelcomeEmail(
    userName: string,
    userEmail: string
  ): Promise<EmailTaskData> {
    const prompt = `Generate a professional welcome email for a new user named ${userName}. 
    Include:
    - Warm greeting
    - Brief introduction to the platform
    - Next steps to get started
    - Support contact information
    Keep it friendly and concise.`;

    return {
      to: userEmail,
      aiGenerate: true,
      prompt,
    };
  }

  async generateReportEmail(
    reportType: string,
    data: any
  ): Promise<EmailTaskData> {
    const prompt = `Generate a professional email report for ${reportType}.
    Data summary: ${JSON.stringify(data)}
    
    Include:
    - Executive summary
    - Key metrics and insights
    - Formatted data presentation
    - Recommendations if applicable`;

    return {
      to: data.recipients || [],
      aiGenerate: true,
      prompt,
    };
  }
}

export const emailHandler = new EmailHandler();
