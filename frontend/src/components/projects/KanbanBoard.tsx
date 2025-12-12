"use client";

import {
  createTask,
  moveTask,
  type KanbanBoard,
  type Task,
} from "@/services/projectService";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useState } from "react";
import SortableTaskCard from "./SortableTaskCard";
import TaskCard from "./TaskCard";

interface KanbanBoardProps {
  projectId: string;
  board: KanbanBoard;
  onUpdate: () => void;
}

export default function KanbanBoard({
  projectId,
  board,
  onUpdate,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = board.tasksByColumn
      ?.flatMap((col) => col.tasks || [])
      .find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetColumnId = over.id as string;

    try {
      await moveTask(taskId, targetColumnId);
      onUpdate();
    } catch (error) {
      console.error("Failed to move task:", error);
    }
  };

  const handleCreateTask = async (data: any) => {
    try {
      await createTask({
        ...data,
        projectId,
        boardId: board.id,
        columnId: selectedColumnId,
      });
      setShowCreateModal(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.tasksByColumn?.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {column.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    ></div>
                  )}
                  <h3 className="text-white font-semibold">{column.name}</h3>
                  <span className="text-gray-400 text-sm">
                    ({column.tasks?.length || 0})
                  </span>
                  {column.limit && (
                    <span className="text-xs text-gray-500">
                      / {column.limit}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedColumnId(column.id);
                    setShowCreateModal(true);
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <SortableContext
                items={column.tasks?.map((t) => t.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 min-h-[200px]">
                  {column.tasks?.map((task) => (
                    <SortableTaskCard key={task.id} task={task} />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-50">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}
    </DndContext>
  );
}

function CreateTaskModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    estimatedHours: "",
    dueDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      estimatedHours: formData.estimatedHours
        ? Number(formData.estimatedHours)
        : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Est. Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedHours: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
