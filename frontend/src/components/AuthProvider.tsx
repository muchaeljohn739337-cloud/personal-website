"use client";

import { AISecurityProvider } from "@/lib/ai-brain/AISecurityContext";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * Enhanced AuthProvider with AI Security
 * Wraps authentication with AI-powered security features:
 * - Session risk scoring
 * - Login anomaly detection
 * - Bot detection
 * - Real-time threat monitoring
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AISecurityProvider>{children}</AISecurityProvider>
    </SessionProvider>
  );
}
