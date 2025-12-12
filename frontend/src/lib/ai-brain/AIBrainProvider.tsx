/**
 * AI Brain Provider
 * Combines all AI context providers into one unified provider
 */

"use client";

import { ReactNode } from "react";
import { AIComplianceProvider } from "./AIComplianceMonitor";
import { AIInsightsProvider } from "./AIInsightsEngine";
import { AISecurityProvider } from "./AISecurityContext";

interface AIBrainProviderProps {
  children: ReactNode;
  config?: {
    enableSecurity?: boolean;
    enableInsights?: boolean;
    enableCompliance?: boolean;
  };
}

export function AIBrainProvider({
  children,
  config = {},
}: AIBrainProviderProps) {
  const {
    enableSecurity = true,
    enableInsights = true,
    enableCompliance = true,
  } = config;

  let content = <>{children}</>;

  if (enableCompliance) {
    content = <AIComplianceProvider>{content}</AIComplianceProvider>;
  }

  if (enableInsights) {
    content = <AIInsightsProvider>{content}</AIInsightsProvider>;
  }

  if (enableSecurity) {
    content = <AISecurityProvider>{content}</AISecurityProvider>;
  }

  return content;
}
