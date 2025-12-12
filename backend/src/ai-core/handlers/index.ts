import { codeHandler } from "./code-handler";
import { emailHandler } from "./email-handler";
import { monitoringHandler } from "./monitoring-handler";
import { reportHandler } from "./report-handler";

export const taskHandlers = {
  email: emailHandler,
  monitoring: monitoringHandler,
  code: codeHandler,
  report: reportHandler,
};

export type TaskHandlerType = keyof typeof taskHandlers;

export function getTaskHandler(type: string): any {
  const handler = taskHandlers[type as TaskHandlerType];
  if (!handler) {
    throw new Error(`Unknown task handler type: ${type}`);
  }
  return handler;
}

export { codeHandler, emailHandler, monitoringHandler, reportHandler };
