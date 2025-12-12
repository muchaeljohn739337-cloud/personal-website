"use client";

import { getProject, type Project } from "@/services/projectService";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Kanban,
  Settings,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "board" | "sprints" | "analytics"
  >("overview");

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data);
    } catch (error) {
      console.error("Failed to load project:", error);
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

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Project not found</p>
          <button
            onClick={() => router.push("/projects")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {project.name}
              </h1>
              <p className="text-gray-400">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  project.status === "ACTIVE"
                    ? "bg-green-500/20 text-green-300"
                    : project.status === "COMPLETED"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-gray-500/20 text-gray-300"
                }`}
              >
                {project.status}
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  project.priority === "CRITICAL"
                    ? "bg-red-500/20 text-red-300"
                    : project.priority === "HIGH"
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {project.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Project Progress</span>
            <span className="text-white font-bold">{project.progress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Settings className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => router.push(`/projects/${projectId}/board`)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-gray-400 hover:text-white transition-all"
            >
              <Kanban className="w-5 h-5" />
              Kanban Board
            </button>
            <button
              onClick={() => setActiveTab("sprints")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                activeTab === "sprints"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Calendar className="w-5 h-5" />
              Sprints
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                activeTab === "analytics"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Project Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Owner</span>
                    <span className="text-white">
                      {project.owner?.username || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start Date</span>
                    <span className="text-white">
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">End Date</span>
                    <span className="text-white">
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Budget</span>
                    <span className="text-white">
                      {project.budget ? `$${project.budget}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Visibility</span>
                    <span className="text-white">{project.visibility}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Team Members</h2>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    {project._count?.members || 0} member
                    {project._count?.members !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Quick Stats
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Tasks</span>
                    <span className="text-white font-semibold">
                      {project._count?.tasks || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Sprints</span>
                    <span className="text-white font-semibold">
                      {project._count?.sprints || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sprints" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <p className="text-gray-400 text-center py-12">
              Sprint management coming soon...
            </p>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <p className="text-gray-400 text-center py-12">
              Analytics dashboard coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
