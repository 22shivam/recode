import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";

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

/**
 * Error tracking wrapper for Convex mutation handlers
 *
 * Usage:
 * ```typescript
 * import { wrapMutation } from "./errors";
 *
 * export const myMutation = mutation({
 *   args: { ... },
 *   handler: wrapMutation(
 *     async (ctx, args) => {
 *       // Your logic here
 *     },
 *     "myFile.myMutation"
 *   ),
 * });
 * ```
 */
export function wrapMutation<Args, Output>(
  handler: (ctx: MutationCtx, args: Args) => Promise<Output>,
  functionName: string
): (ctx: MutationCtx, args: Args) => Promise<Output> {
  return async (ctx, args) => {
    try {
      return await handler(ctx, args);
    } catch (error: any) {
      // Log the error to Convex
      try {
        await ctx.db.insert("errors", {
          functionName: functionName,
          errorMessage: error.message || String(error),
          stackTrace: error.stack || "",
          timestamp: Date.now(),
          resolved: false,
        });
      } catch (logError) {
        // If logging fails, at least log to console
        console.error("Failed to log error:", logError);
      }

      // Re-throw the original error so clients still receive it
      throw error;
    }
  };
}
