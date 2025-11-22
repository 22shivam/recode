"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import Link from "next/link";

export default function Home() {
  const tasks = useQuery(api.tasks.getTasks);
  const addTask = useMutation(api.tasks.addTask);
  const toggleTask = useMutation(api.tasks.toggleTask);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const logError = useMutation(api.errors.logError);

  const [newTask, setNewTask] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await addTask({ text: newTask });
      setNewTask("");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add task";
      setError(errorMessage);

      // Log error to Convex for agent to fix
      await logError({
        functionName: "tasks.addTask",
        errorMessage: errorMessage,
        stackTrace: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: Id<"tasks">) => {
    try {
      await toggleTask({ id });
    } catch (err: any) {
      setError(err.message);
      await logError({
        functionName: "tasks.toggleTask",
        errorMessage: err.message,
        stackTrace: err.stack,
      });
    }
  };

  const handleDelete = async (id: Id<"tasks">) => {
    try {
      await deleteTask({ id });
    } catch (err: any) {
      setError(err.message);
      await logError({
        functionName: "tasks.deleteTask",
        errorMessage: err.message,
        stackTrace: err.stack,
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                ReCode
              </h1>
              <p className="text-gray-600 mb-8">
                When your code breaks, Claude rewrites it—automatically
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              🤖 Agent Dashboard
            </Link>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">❌</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Detected
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <p className="mt-2 text-xs text-red-600">
                    🤖 Agent notified - attempting to fix...
                  </p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newTask.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Adding..." : "Add Task"}
              </button>
            </div>
          </form>

          {/* Tasks List */}
          <div className="space-y-2">
            {tasks === undefined ? (
              <div className="text-center py-8 text-gray-500">
                Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tasks yet. Add one above!
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggle(task._id)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className={`flex-1 ${
                      task.completed
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          {tasks && tasks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
              {tasks.filter((t) => !t.completed).length} tasks remaining •{" "}
              {tasks.filter((t) => t.completed).length} completed
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
