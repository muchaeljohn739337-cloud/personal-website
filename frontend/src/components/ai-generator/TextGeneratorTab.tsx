"use client";

import { useAIGenerator } from "@/hooks/useAIGenerator";
import {
  AIGenerationRequest,
  getAvailableModels,
} from "@/services/aiGenerator";
import { AlertCircle, Check, Copy, Loader2, Send } from "lucide-react";
import { useState } from "react";

export default function TextGeneratorTab() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<AIGenerationRequest["model"]>("gpt-4");
  const [copied, setCopied] = useState(false);

  const { loading, error, result, progress, generateTextContent, resetState } =
    useAIGenerator();

  const models = getAvailableModels();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    try {
      await generateTextContent({
        prompt,
        model,
        // CAPTCHA validation required - implement client-side CAPTCHA widget
        // captchaToken: getCaptchaToken(),
      });
    } catch (err) {
      console.error("Generation error:", err);
      alert("Generation failed. Please ensure CAPTCHA is configured.");
    }
  };

  const handleCopy = () => {
    if (result?.output) {
      navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewGeneration = () => {
    resetState();
    setPrompt("");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Text Generation</h2>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          AI Model
        </label>
        <select
          value={model}
          onChange={(e) =>
            setModel(e.target.value as AIGenerationRequest["model"])
          }
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={loading}
        >
          {models.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label} • {m.cost}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here... e.g., 'Explain quantum computing in simple terms'"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
          disabled={loading}
        />
        <div className="mt-2 text-sm text-gray-400">
          {prompt.length} characters
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Generate Text
          </>
        )}
      </button>

      {/* Progress */}
      {progress && (
        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <div className="text-sm text-blue-200">
              <p className="font-medium">
                {progress.status === "started" && "Starting generation..."}
                {progress.status === "completed" && "Generation complete!"}
                {progress.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="text-sm text-red-200">
              <p className="font-medium mb-1">Generation Failed</p>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result?.output && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Generated Text</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleNewGeneration}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
              >
                New Generation
              </button>
            </div>
          </div>

          <div className="p-6 bg-gray-700/50 border border-gray-600 rounded-lg">
            <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
              {result.output}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-600 flex items-center justify-between text-sm text-gray-400">
              <div>Model: {result.model}</div>
              <div>
                Generated: {new Date(result.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
