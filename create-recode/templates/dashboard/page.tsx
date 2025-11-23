"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

export default function ReCodeDashboard() {
  const errors = useQuery(api.errors.getAllErrors);
  const fixes = useQuery(api.fixes.getAllFixes);
  const pendingFixes = useQuery(api.fixes.getPendingFixes);

  const approveFix = useMutation(api.fixes.approveFix);
  const rejectFix = useMutation(api.fixes.rejectFix);

  const unresolvedCount = errors?.filter((e) => !e.resolved).length || 0;
  const resolvedCount = errors?.filter((e) => e.resolved).length || 0;

  // Calculate learning metrics
  const totalReuses =
    fixes?.reduce((sum, fix) => sum + ((fix.timesApplied || 1) - 1), 0) || 0;
  const uniqueFixes = fixes?.length || 0;
  const avgEffectiveness =
    fixes && fixes.length > 0
      ? (
          (fixes.reduce((sum, fix) => sum + (fix.effectiveness || 1), 0) /
            fixes.length) *
          100
        ).toFixed(0)
      : 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-200 mb-4 inline-block"
          >
            ← Back to App
          </Link>
          <h1 className="text-5xl font-bold text-white mb-2">
            🤖 ReCode Dashboard
          </h1>
          <p className="text-slate-400">
            Real-time monitoring of autonomous code repair
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Status Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Status
                </p>
                <p className="text-3xl font-bold">
                  {unresolvedCount > 0 ? "🔴 Active" : "🟢 Monitoring"}
                </p>
              </div>
              <div className="text-5xl opacity-20">🤖</div>
            </div>
            {unresolvedCount > 0 && (
              <p className="text-blue-100 text-sm mt-2">
                Fixing {unresolvedCount} error(s)...
              </p>
            )}
          </div>

          {/* Errors Card */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">
                  Errors Detected
                </p>
                <p className="text-3xl font-bold">{errors?.length || 0}</p>
              </div>
              <div className="text-5xl opacity-20">🐛</div>
            </div>
            <p className="text-red-100 text-sm mt-2">
              {unresolvedCount} active • {resolvedCount} resolved
            </p>
          </div>

          {/* Fixes Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">
                  Auto-Fixed
                </p>
                <p className="text-3xl font-bold">{uniqueFixes}</p>
              </div>
              <div className="text-5xl opacity-20">✨</div>
            </div>
            <p className="text-green-100 text-sm mt-2">
              Successfully healed
            </p>
          </div>

          {/* Learning Metrics Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">
                  Memory Reuses
                </p>
                <p className="text-3xl font-bold">{totalReuses}</p>
              </div>
              <div className="text-5xl opacity-20">🧠</div>
            </div>
            <p className="text-purple-100 text-sm mt-2">
              Instant fixes from cache
            </p>
          </div>
        </div>

        {/* Pending Fixes Section */}
        {pendingFixes && pendingFixes.length > 0 && (
          <div className="mb-8 bg-yellow-900/20 border-2 border-yellow-500/50 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <span>⚠️</span> Pending Approval ({pendingFixes.length})
            </h2>
            <p className="text-slate-300 mb-4">
              These fixes have low confidence and need human review before
              applying.
            </p>

            <div className="space-y-4">
              {pendingFixes.map((fix) => (
                <div
                  key={fix._id}
                  className="bg-slate-800 rounded-xl p-5 border border-yellow-500/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-yellow-300 font-semibold">
                          🤖 Proposed Fix
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                          Confidence: {fix.confidence}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">
                        {fix.reasoning}
                      </p>
                      {fix.errorPattern && (
                        <p className="text-xs text-slate-400 mb-3">
                          Pattern: {fix.errorPattern}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Code Preview */}
                  <details className="text-xs mb-4">
                    <summary className="text-slate-400 cursor-pointer hover:text-slate-300 font-medium">
                      View proposed code changes
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-red-400 font-medium mb-1">
                          Current (broken):
                        </p>
                        <pre className="bg-slate-900 p-3 rounded text-red-300 overflow-x-auto text-xs">
                          {fix.originalCode}
                        </pre>
                      </div>
                      <div>
                        <p className="text-green-400 font-medium mb-1">
                          Proposed fix:
                        </p>
                        <pre className="bg-slate-900 p-3 rounded text-green-300 overflow-x-auto text-xs">
                          {fix.fixedCode.substring(0, 500)}...
                        </pre>
                      </div>
                    </div>
                  </details>

                  {/* Approval Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveFix({ fixId: fix._id })}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>✓</span> Approve & Apply
                    </button>
                    <button
                      onClick={() => rejectFix({ fixId: fix._id })}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>✗</span> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Errors List */}
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📋</span> Recent Errors
            </h2>

            {!errors || errors.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-6xl mb-4">🎉</div>
                <p>No errors detected!</p>
                <p className="text-sm mt-2">System is healthy</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {errors.map((error) => (
                  <div
                    key={error._id}
                    className={`p-4 rounded-lg border-l-4 ${
                      error.resolved
                        ? "bg-slate-700 border-green-500"
                        : "bg-red-900/20 border-red-500"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`font-mono text-sm ${
                          error.resolved ? "text-slate-300" : "text-red-300"
                        }`}
                      >
                        {error.functionName}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          error.resolved
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {error.resolved ? "✓ Fixed" : "⚠ Active"}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        error.resolved ? "text-slate-400" : "text-red-200"
                      }`}
                    >
                      {error.errorMessage}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixes List */}
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🔧</span> Recent Fixes
            </h2>

            {!fixes || fixes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-6xl mb-4">⏳</div>
                <p>No fixes yet</p>
                <p className="text-sm mt-2">
                  Waiting for agent to fix errors
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {fixes.map((fix) => (
                  <div
                    key={fix._id}
                    className="p-4 rounded-lg bg-green-900/20 border-l-4 border-green-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-green-300 font-semibold text-sm">
                          ✓ Fix Applied
                        </span>
                        {fix.confidence && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {fix.confidence}% confidence
                          </span>
                        )}
                        {fix.timesApplied && fix.timesApplied > 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            🧠 Reused {fix.timesApplied}x
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(fix.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">
                      {fix.reasoning}
                    </p>
                    {fix.errorPattern && (
                      <p className="text-xs text-slate-400 mb-3">
                        Pattern: {fix.errorPattern}
                      </p>
                    )}

                    {/* Code Preview */}
                    <details className="text-xs">
                      <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
                        View code changes
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-red-400 font-medium mb-1">
                            Before:
                          </p>
                          <pre className="bg-slate-900 p-2 rounded text-red-300 overflow-x-auto">
                            {fix.originalCode.substring(0, 200)}...
                          </pre>
                        </div>
                        <div>
                          <p className="text-green-400 font-medium mb-1">
                            After:
                          </p>
                          <pre className="bg-slate-900 p-2 rounded text-green-300 overflow-x-auto">
                            {fix.fixedCode.substring(0, 200)}...
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-blue-300 mb-3">💡 Setup</h3>
          <ol className="text-slate-300 space-y-2 list-decimal list-inside">
            <li>
              Wrap your Convex functions with{" "}
              <code className="bg-slate-900 px-2 py-0.5 rounded text-blue-300">
                withErrorTracking()
              </code>
            </li>
            <li>
              Run the agent in{" "}
              <code className="bg-slate-900 px-2 py-0.5 rounded text-blue-300">
                agent/
              </code>{" "}
              folder
            </li>
            <li>Errors will be detected and fixed automatically!</li>
            <li>
              Check the{" "}
              <a
                href="https://github.com/yourusername/recode"
                className="text-blue-300 hover:underline"
              >
                documentation
              </a>{" "}
              for more details
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
