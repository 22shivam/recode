import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log an error
export const logError = mutation({
  args: {
    functionName: v.string(),
    errorMessage: v.string(),
    stackTrace: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const errorId = await ctx.db.insert("errors", {
      functionName: args.functionName,
      errorMessage: args.errorMessage,
      stackTrace: args.stackTrace,
      timestamp: Date.now(),
      resolved: false,
    });
    return errorId;
  },
});

// Get unresolved errors
export const getUnresolved = query({
  handler: async (ctx) => {
    const errors = await ctx.db
      .query("errors")
      .withIndex("by_resolved", (q) => q.eq("resolved", false))
      .order("desc")
      .collect();
    return errors;
  },
});

// Get all errors (for dashboard)
export const getAllErrors = query({
  handler: async (ctx) => {
    const errors = await ctx.db.query("errors").order("desc").take(20);
    return errors;
  },
});

// Mark error as resolved
export const markResolved = mutation({
  args: { errorId: v.id("errors") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.errorId, { resolved: true });
  },
});

// Delete an error (for resetting demo)
export const deleteError = mutation({
  args: { id: v.id("errors") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
