"use client";

import KanbanBoardComponent from "@/components/projects/KanbanBoard";
import {
  createBoard,
  getBoard,
  getProject,
  type KanbanBoard,
  type Project,
} from "@/services/projectService";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const projectData = await getProject(projectId);
      setProject(projectData);

      // Try to get existing board
      try {
        const boardData = await getBoard(projectId);
        setBoard(boardData);
      } catch (error) {
        // No board exists, create one
        const newBoard = await createBoard({
          projectId,
          name: "Main Board",
          isDefault: true,
        });
        setBoard(newBoard);
      }
    } catch (error) {
      console.error("Failed to load board:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Project
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {project?.name}
              </h1>
              <p className="text-gray-400">{board?.name || "Kanban Board"}</p>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        {board && (
          <KanbanBoardComponent
            projectId={projectId}
            board={board}
            onUpdate={loadData}
          />
        )}
      </div>
    </div>
  );
}
