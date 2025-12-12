"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({
  value,
  onChange,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            !showPreview
              ? "bg-purple-600 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            showPreview
              ? "bg-purple-600 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          Preview
        </button>
      </div>

      {!showPreview ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          placeholder="Write your content in Markdown..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      ) : (
        <div className="min-h-[500px] px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || "*No content*"}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        Supports Markdown syntax: **bold**, *italic*, [links](url), # headings,
        lists, code blocks, and more
      </div>
    </div>
  );
}
