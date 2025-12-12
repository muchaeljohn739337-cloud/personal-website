import axios from "axios";
import { AgentConfig, AgentResult, BaseAgent } from "../BaseAgent";

export class RpaAgent1 extends BaseAgent {
  constructor(context: any) {
    const config: AgentConfig = {
      name: "RpaAgent1",
      enabled: true,
      schedule: "*/5 * * * *",
      retryAttempts: 3,
      timeout: 30000,
      priority: "medium",
      description: "Checks external payment API health.",
    };
    super(config, context);
  }

  protected async execute(): Promise<AgentResult> {
    try {
      const response = await axios.get("https://example.com/api/health1");
      // Handle and store the response as needed
      return {
        success: true,
        message: "Payment API healthy",
        data: { response: response.data },
        metrics: {
          duration: Date.now() - Date.now(), // Calculate actual duration
          itemsProcessed: 1,
          errors: 0,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Payment API health check failed",
        data: { error: error instanceof Error ? error.message : String(error) },
        metrics: {
          duration: Date.now() - Date.now(),
          itemsProcessed: 0,
          errors: 1,
        },
      };
    }
  }
}
