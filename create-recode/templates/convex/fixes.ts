import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Log a fix applied by the agent (with vector embedding)
export const logFix = mutation({
  args: {
    errorId: v.id("errors"),
    errorPattern: v.string(),
    embedding: v.array(v.float64()),
    originalCode: v.string(),
    fixedCode: v.string(),
    reasoning: v.string(),
    confidence: v.optional(v.number()),
    status: v.optional(v.string()),
    appliedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const fixId = await ctx.db.insert("fixes", {
      errorId: args.errorId,
      errorPattern: args.errorPattern,
      embedding: args.embedding,
      originalCode: args.originalCode,
      fixedCode: args.fixedCode,
      reasoning: args.reasoning,
      timestamp: Date.now(),
      confidence: args.confidence,
      status: args.status || "applied",
      appliedAt: args.appliedAt,
      effectiveness: 1.0, // Default to effective
      timesApplied: 1,
    });
    return fixId;
  },
});

// Search for similar past fixes using vector similarity
// NOTE: Vector search must be an action, not a query
export const searchSimilarFixes = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use vectorSearch API (only available in actions)
    const results = await ctx.vectorSearch("fixes", "by_embedding", {
      vector: args.embedding,
      limit: args.limit ?? 3,
    });

    // Vector search returns { _id, _score }, so we need to fetch the full documents
    const fixes = await Promise.all(
      results.map(async (result) => {
        const fix = await ctx.runQuery(api.fixes.getFixById, {
          id: result._id,
        });
        return fix ? { ...fix, _score: result._score } : null;
      })
    );

    // Filter out null results
    return fixes.filter((fix) => fix !== null);
  },
});

// Helper to get a fix by ID (for vector search results)
export const getFixById = query({
  args: { id: v.id("fixes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Increment the times a fix was applied (when reused)
export const incrementFixUsage = mutation({
  args: {
    fixId: v.id("fixes"),
  },
  handler: async (ctx, args) => {
    const fix = await ctx.db.get(args.fixId);
    if (!fix) return;

    await ctx.db.patch(args.fixId, {
      timesApplied: (fix.timesApplied ?? 1) + 1,
    });
  },
});

// Get all fixes (for dashboard)
export const getAllFixes = query({
  handler: async (ctx) => {
    const fixes = await ctx.db.query("fixes").order("desc").take(10);
    return fixes;
  },
});

// Get fixes for a specific error
export const getFixesForError = query({
  args: { errorId: v.id("errors") },
  handler: async (ctx, args) => {
    const fixes = await ctx.db
      .query("fixes")
      .withIndex("by_error", (q) => q.eq("errorId", args.errorId))
      .collect();
    return fixes;
  },
});

// Get pending fixes (awaiting approval)
export const getPendingFixes = query({
  handler: async (ctx) => {
    const fixes = await ctx.db
      .query("fixes")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
    return fixes;
  },
});

// Get approved fixes (ready to be applied)
export const getApprovedFixes = query({
  handler: async (ctx) => {
    const fixes = await ctx.db
      .query("fixes")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .collect();
    return fixes;
  },
});

// Approve a pending fix
export const approveFix = mutation({
  args: { fixId: v.id("fixes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fixId, {
      status: "approved",
    });
    return { success: true };
  },
});

// Reject a pending fix (deletes it entirely to avoid polluting vector DB)
export const rejectFix = mutation({
  args: { fixId: v.id("fixes") },
  handler: async (ctx, args) => {
    // Delete rejected fixes completely - we don't want to learn from bad solutions
    await ctx.db.delete(args.fixId);
    return { success: true };
  },
});

// Delete a fix (for resetting demo)
export const deleteFix = mutation({
  args: { id: v.id("fixes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
