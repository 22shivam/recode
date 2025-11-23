#!/bin/bash

echo "📝 Adding client-side error logging to page.tsx..."

cat > app/page.tsx << 'EOF'
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const todos = useQuery(api.todos.getTodos);
  const addTodo = useMutation(api.todos.addTodo);
  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const logError = useMutation(api.errors.logError);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      try {
        await addTodo({ text: newTodo });
        setNewTodo("");
      } catch (err: any) {
        console.error("Error adding todo:", err.message);
        alert(`Error: ${err.message}`);

        // Log error to Convex for agent to fix
        await logError({
          functionName: "todos.addTodo",
          errorMessage: err.message,
          stackTrace: err.stack,
        });
      }
    }
  };

  const handleToggle = async (id: any) => {
    try {
      await toggleTodo({ id });
    } catch (err: any) {
      console.error("Error toggling todo:", err.message);
      alert(`Error: ${err.message}`);

      // Log error to Convex for agent to fix
      await logError({
        functionName: "todos.toggleTodo",
        errorMessage: err.message,
        stackTrace: err.stack,
      });
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteTodo({ id });
    } catch (err: any) {
      console.error("Error deleting todo:", err.message);
      alert(`Error: ${err.message}`);

      // Log error to Convex for agent to fix
      await logError({
        functionName: "todos.deleteTodo",
        errorMessage: err.message,
        stackTrace: err.stack,
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🐛 Buggy Todo App
        </h1>
        <p className="text-gray-600 mb-8">
          This app has 3 intentional bugs. Install ReCode to fix them automatically!
        </p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Add
            </button>
          </form>

          <div className="space-y-2">
            {!todos || todos.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No todos yet. Add one above!
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={() => handleToggle(todo._id)}
                    className="w-5 h-5 text-blue-500"
                  />
                  <span
                    className={`flex-1 ${
                      todo.isCompleted
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => handleDelete(todo._id)}
                    className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-3">
            🐛 Known Bugs
          </h2>
          <ol className="text-yellow-900 space-y-2 list-decimal list-inside">
            <li>
              <strong>Add Todo:</strong> Args mismatch (text vs todoText)
            </li>
            <li>
              <strong>Toggle Todo:</strong> Wrong field (completedStatus)
            </li>
            <li>
              <strong>Delete Todo:</strong> Args mismatch (id vs todoId)
            </li>
          </ol>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">
              ✨ Install ReCode to Fix
            </h3>
            <code className="text-sm bg-green-100 px-3 py-1 rounded text-green-900">
              node ../create-recode/bin/cli.js init
            </code>
            <p className="text-sm text-green-700 mt-2">
              ReCode will detect and fix all bugs automatically!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
EOF

echo ""
echo "✅ Client-side error logging added!"
echo ""
echo "Now errors will be logged to Convex for the agent to detect and fix."
