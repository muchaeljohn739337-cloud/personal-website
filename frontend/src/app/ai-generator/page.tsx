"use client";

import CodeGeneratorTab from "@/components/ai-generator/CodeGeneratorTab";
import GenerationHistoryTab from "@/components/ai-generator/GenerationHistoryTab";
import ImageGeneratorTab from "@/components/ai-generator/ImageGeneratorTab";
import TextGeneratorTab from "@/components/ai-generator/TextGeneratorTab";
import {
  BarChart3,
  Code,
  History,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

type Tab = "text" | "code" | "image" | "history";

export default function AIGeneratorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("text");

  const tabs = [
    { id: "text" as Tab, label: "Text Generation", icon: Sparkles },
    { id: "code" as Tab, label: "Code Generation", icon: Code },
    { id: "image" as Tab, label: "Image Generation", icon: ImageIcon },
    { id: "history" as Tab, label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Generator Studio
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Generate text, code, and images using advanced AI models including
            GPT-4, Claude 3, and DALL-E 3
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-gray-800/50 backdrop-blur-lg rounded-xl p-2 flex flex-wrap gap-2 border border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden">
          {activeTab === "text" && <TextGeneratorTab />}
          {activeTab === "code" && <CodeGeneratorTab />}
          {activeTab === "image" && <ImageGeneratorTab />}
          {activeTab === "history" && <GenerationHistoryTab />}
        </div>

        {/* Rate Limit Notice */}
        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Rate Limits</p>
              <p className="text-blue-300">
                Free tier: 10 requests/hour, 100K tokens/day. Admin users have
                unlimited access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
