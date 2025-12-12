"use client";

import { useAIGenerator } from "@/hooks/useAIGenerator";
import {
  CodeGenerationRequest,
  getAvailableModels,
  getFrameworks,
  getProgrammingLanguages,
} from "@/services/aiGenerator";
import { AlertCircle, Check, Code2, Copy, Loader2, Send } from "lucide-react";
import { useState } from "react";

export default function CodeGeneratorTab() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<CodeGenerationRequest["model"]>("gpt-4");
  const [language, setLanguage] = useState("TypeScript");
  const [framework, setFramework] = useState("");
  const [copied, setCopied] = useState(false);

  const { loading, error, result, progress, generateCodeContent, resetState } =
    useAIGenerator();

  const models = getAvailableModels();
  const languages = getProgrammingLanguages();
  const frameworks = getFrameworks(language);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    try {
      await generateCodeContent({
        prompt,
        model,
        language,
        framework: framework || undefined,
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
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Code2 className="w-7 h-7" />
        Code Generation
      </h2>

      {/* Model Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            AI Model
          </label>
          <select
            value={model}
            onChange={(e) =>
              setModel(e.target.value as CodeGenerationRequest["model"])
            }
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading}
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Programming Language
          </label>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setFramework(""); // Reset framework when language changes
            }}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Framework (Optional)
          </label>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading || frameworks.length === 0}
          >
            <option value="">None</option>
            {frameworks.map((fw) => (
              <option key={fw} value={fw}>
                {fw}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Describe what you want to build
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'Create a REST API endpoint for user authentication with JWT tokens' or 'Build a React component for a todo list with add/delete functionality'"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
          disabled={loading}
        />
        <div className="mt-2 text-sm text-gray-400">
          {prompt.length} characters • Language: {language}
          {framework && ` • Framework: ${framework}`}
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
            Generating Code...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Generate Code
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
                {progress.status === "started" && "Analyzing requirements..."}
                {progress.status === "completed" &&
                  "Code generated successfully!"}
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
            <h3 className="text-lg font-semibold text-white">Generated Code</h3>
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
                    Copy Code
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

          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Code2 className="w-4 h-4" />
                <span>{language}</span>
                {framework && <span>• {framework}</span>}
              </div>
              <div className="text-xs text-gray-500">Model: {result.model}</div>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-gray-100 font-mono leading-relaxed">
                {result.output}
              </code>
            </pre>
          </div>

          <div className="mt-3 text-sm text-gray-400 text-right">
            Generated: {new Date(result.createdAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
