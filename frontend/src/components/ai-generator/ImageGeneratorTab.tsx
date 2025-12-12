"use client";

import { useAIGenerator } from "@/hooks/useAIGenerator";
import {
  getAvailableImageSizes,
  ImageGenerationRequest,
} from "@/services/aiGenerator";
import {
  AlertCircle,
  Download,
  ImageIcon,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function ImageGeneratorTab() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageGenerationRequest["size"]>("1024x1024");

  const { loading, error, result, progress, generateImageContent, resetState } =
    useAIGenerator();

  const imageSizes = getAvailableImageSizes();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    try {
      await generateImageContent({
        prompt,
        size,
        // CAPTCHA validation required - implement client-side CAPTCHA widget
        // captchaToken: getCaptchaToken(),
      });
    } catch (err) {
      console.error("Generation error:", err);
      alert("Generation failed. Please ensure CAPTCHA is configured.");
    }
  };

  const handleDownload = () => {
    if (result?.imageUrl) {
      const link = document.createElement("a");
      link.href = result.imageUrl;
      link.download = `ai-image-${result.id}.png`;
      link.click();
    }
  };

  const handleNewGeneration = () => {
    resetState();
    setPrompt("");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <ImageIcon className="w-7 h-7" />
        Image Generation (DALL-E 3)
      </h2>

      {/* Size Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Image Size
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {imageSizes.map((s) => (
            <button
              key={s.value}
              onClick={() => setSize(s.value as ImageGenerationRequest["size"])}
              className={`p-4 rounded-lg border-2 transition-all ${
                size === s.value
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
              }`}
              disabled={loading}
            >
              <div className="text-white font-medium">{s.label}</div>
              <div className="text-sm text-gray-400 mt-1">{s.value}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Describe the image you want to create
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'A futuristic cityscape at sunset with flying cars and neon lights' or 'A serene mountain landscape with a crystal clear lake reflecting snow-capped peaks'"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
          disabled={loading}
        />
        <div className="mt-2 flex items-center justify-between text-sm text-gray-400">
          <span>{prompt.length} characters</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            Powered by DALL-E 3
          </span>
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
            Creating Image...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Generate Image ($0.04)
          </>
        )}
      </button>

      {/* Info Notice */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-sm text-blue-200">
          💡 <strong>Tip:</strong> Be specific and descriptive. Include details
          about style, mood, colors, and composition for best results.
        </p>
      </div>

      {/* Progress */}
      {progress && (
        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <div className="text-sm text-blue-200">
              <p className="font-medium">
                {progress.status === "started" && "Processing your request..."}
                {progress.status === "completed" &&
                  "Image created successfully!"}
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
      {result?.imageUrl && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">
              Generated Image
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleNewGeneration}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
              >
                New Image
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="relative w-full" style={{ paddingBottom: "100%" }}>
              <Image
                src={result.imageUrl}
                alt={prompt}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="p-4 border-t border-gray-700">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Prompt:</strong> {result.prompt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Size: {size}</span>
                <span>
                  Generated: {new Date(result.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <p className="text-sm text-yellow-200">
              ⚠️ <strong>Note:</strong> Image URLs from DALL-E are temporary.
              Download your image to save it permanently.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
