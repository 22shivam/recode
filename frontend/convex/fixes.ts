import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log a fix applied by the agent
export const logFix = mutation({
  args: {
    errorId: v.id("errors"),
    originalCode: v.string(),
    fixedCode: v.string(),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    const fixId = await ctx.db.insert("fixes", {
      errorId: args.errorId,
      originalCode: args.originalCode,
      fixedCode: args.fixedCode,
      reasoning: args.reasoning,
      timestamp: Date.now(),
    });
    return fixId;
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

// Delete a fix (for resetting demo)
export const deleteFix = mutation({
  args: { id: v.id("fixes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
