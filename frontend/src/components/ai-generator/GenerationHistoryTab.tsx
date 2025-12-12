"use client";

import { useGenerationHistory } from "@/hooks/useAIGenerator";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  FileText,
  Filter,
  ImageIcon,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function GenerationHistoryTab() {
  const {
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
    refresh,
  } = useGenerationHistory();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const typeFilters = [
    { value: undefined, label: "All", icon: FileText },
    { value: "text" as const, label: "Text", icon: FileText },
    { value: "code" as const, label: "Code", icon: Code },
    { value: "image" as const, label: "Images", icon: ImageIcon },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="w-5 h-5 text-blue-400" />;
      case "code":
        return <Code className="w-5 h-5 text-green-400" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-900/30 text-green-400 border border-green-700 rounded-full">
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-700 rounded-full">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-900/30 text-red-400 border border-red-700 rounded-full">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Generation History</h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Type Filter */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <Filter className="w-5 h-5 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.label}
                onClick={() => filterByType(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  type === filter.value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="text-sm text-red-200">
              <p className="font-medium mb-1">Error Loading History</p>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && generations.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            No generations yet
          </h3>
          <p className="text-gray-400">
            Start generating text, code, or images to see your history here
          </p>
        </div>
      )}

      {/* Generations List */}
      {!loading && generations.length > 0 && (
        <div className="space-y-4">
          {generations.map((gen) => (
            <div
              key={gen.id}
              className="bg-gray-700/50 border border-gray-600 rounded-lg overflow-hidden hover:border-gray-500 transition-all"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === gen.id ? null : gen.id)
                }
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(gen.type)}
                    <div>
                      <div className="text-white font-medium">
                        {gen.type.charAt(0).toUpperCase() + gen.type.slice(1)}{" "}
                        Generation
                      </div>
                      <div className="text-sm text-gray-400">
                        Model: {gen.model}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(gen.status)}
                </div>

                <div className="text-sm text-gray-300 mb-2 line-clamp-2">
                  <strong>Prompt:</strong> {gen.prompt}
                </div>

                <div className="text-xs text-gray-500">
                  {new Date(gen.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === gen.id && (
                <div className="border-t border-gray-600 p-4 bg-gray-800/50">
                  {gen.status === "completed" &&
                    gen.type === "image" &&
                    gen.imageUrl && (
                      <div className="mb-4 relative w-full max-w-md mx-auto">
                        <div
                          className="relative w-full"
                          style={{ paddingBottom: "100%" }}
                        >
                          <Image
                            src={gen.imageUrl}
                            alt={gen.prompt}
                            fill
                            className="object-contain rounded-lg"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}

                  {gen.status === "completed" && gen.output && (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                      {gen.type === "code" ? (
                        <pre className="text-sm text-gray-100 font-mono leading-relaxed">
                          <code>{gen.output}</code>
                        </pre>
                      ) : (
                        <div className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                          {gen.output}
                        </div>
                      )}
                    </div>
                  )}

                  {gen.status === "failed" && gen.error && (
                    <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                      <p className="text-sm text-red-300">
                        <strong>Error:</strong> {gen.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={previousPage}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="text-sm text-gray-400">
            Page {page + 1} of {totalPages} • Total: {total} generations
          </div>

          <button
            onClick={nextPage}
            disabled={(page + 1) * limit >= total}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
