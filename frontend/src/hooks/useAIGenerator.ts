"use client";

import { connectSocket } from "@/lib/socket";
import {
  AIGeneration,
  AIGenerationRequest,
  CodeGenerationRequest,
  generateCode,
  generateImage,
  generateText,
  getHistory,
  ImageGenerationRequest,
} from "@/services/aiGenerator";
import { useCallback, useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface SocketEvents {
  "ai-generation:started": (data: {
    generationId: string;
    type: string;
  }) => void;
  "ai-generation:completed": (data: AIGeneration) => void;
  "ai-generation:failed": (data: {
    generationId: string;
    error: string;
  }) => void;
  "ai-builder:progress": (data: {
    buildId: string;
    status: string;
    phase?: string;
    percentage?: number;
    message?: string;
  }) => void;
}

export function useAIGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIGeneration | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<{
    status: string;
    message?: string;
    percentage?: number;
  } | null>(null);

  // Connect to Socket.IO
  useEffect(() => {
    const token = localStorage.getItem("token");
    const apiUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    if (token) {
      const newSocket = connectSocket(apiUrl, token);

      newSocket.on("connect", () => {
        console.log("✅ Socket connected for AI Generator");
        const userId = localStorage.getItem("userId");
        if (userId) {
          newSocket.emit("join-room", userId);
        }
      });

      // Listen for AI generation events
      newSocket.on("ai-generation:started", (data) => {
        console.log("🚀 Generation started:", data);
        setProgress({
          status: "started",
          message: "Generation in progress...",
        });
      });

      newSocket.on("ai-generation:completed", (data: AIGeneration) => {
        console.log("✅ Generation completed:", data);
        setResult(data);
        setLoading(false);
        setProgress({ status: "completed", percentage: 100 });
      });

      newSocket.on("ai-generation:failed", (data) => {
        console.log("❌ Generation failed:", data);
        setError(data.error || "Generation failed");
        setLoading(false);
        setProgress({ status: "failed", message: data.error });
      });

      newSocket.on("ai-builder:progress", (data) => {
        console.log("📊 Build progress:", data);
        setProgress({
          status: data.status,
          message: data.message,
          percentage: data.percentage,
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  const generateTextContent = useCallback(
    async (request: AIGenerationRequest) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setProgress(null);

      try {
        const response = await generateText(request);
        if (response.success) {
          // Result will come via Socket.IO
          return response.data;
        } else {
          throw new Error("Text generation failed");
        }
      } catch (err: any) {
        const errorMsg = err.message || "Failed to generate text";
        setError(errorMsg);
        setLoading(false);
        throw err;
      }
    },
    [],
  );

  const generateCodeContent = useCallback(
    async (request: CodeGenerationRequest) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setProgress(null);

      try {
        const response = await generateCode(request);
        if (response.success) {
          return response.data;
        } else {
          throw new Error("Code generation failed");
        }
      } catch (err: any) {
        const errorMsg = err.message || "Failed to generate code";
        setError(errorMsg);
        setLoading(false);
        throw err;
      }
    },
    [],
  );

  const generateImageContent = useCallback(
    async (request: ImageGenerationRequest) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setProgress(null);

      try {
        const response = await generateImage(request);
        if (response.success) {
          return response.data;
        } else {
          throw new Error("Image generation failed");
        }
      } catch (err: any) {
        const errorMsg = err.message || "Failed to generate image";
        setError(errorMsg);
        setLoading(false);
        throw err;
      }
    },
    [],
  );

  const resetState = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    setProgress(null);
  }, []);

  return {
    loading,
    error,
    result,
    progress,
    socket,
    generateTextContent,
    generateCodeContent,
    generateImageContent,
    resetState,
  };
}

export function useGenerationHistory(initialType?: "text" | "code" | "image") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [type, setType] = useState<"text" | "code" | "image" | undefined>(
    initialType,
  );

  const limit = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = page * limit;
      const response = await getHistory(limit, offset, type);

      if (response.success) {
        setGenerations(response.data.generations);
        setTotal(response.data.total);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [page, type, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const nextPage = useCallback(() => {
    if ((page + 1) * limit < total) {
      setPage((p) => p + 1);
    }
  }, [page, limit, total]);

  const previousPage = useCallback(() => {
    if (page > 0) {
      setPage((p) => p - 1);
    }
  }, [page]);

  const filterByType = useCallback(
    (newType: "text" | "code" | "image" | undefined) => {
      setType(newType);
      setPage(0);
    },
    [],
  );

  return {
    loading,
    error,
    generations,
    total,
    page,
    type,
    limit,
    nextPage,
    previousPage,
    filterByType,
    refresh: fetchHistory,
  };
}
