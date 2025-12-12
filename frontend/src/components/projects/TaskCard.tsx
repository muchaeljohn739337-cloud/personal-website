"use client";

import { type Task } from "@/services/projectService";
import { Clock, MessageSquare, User } from "lucide-react";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white font-medium text-sm line-clamp-2">
          {task.title}
        </h4>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ml-2 ${
            task.priority === "CRITICAL"
              ? "bg-red-500/20 text-red-300"
              : task.priority === "HIGH"
                ? "bg-orange-500/20 text-orange-300"
                : task.priority === "MEDIUM"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-green-500/20 text-green-300"
          }`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {task.estimatedHours && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
          {task._count?.comments && task._count.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{task._count.comments}</span>
            </div>
          )}
        </div>
        {task.assignee && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="text-xs">{task.assignee.username}</span>
          </div>
        )}
      </div>

      {task.dueDate && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <span className="text-xs text-gray-400">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}
