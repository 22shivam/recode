import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
  }),

  errors: defineTable({
    functionName: v.string(),
    errorMessage: v.string(),
    stackTrace: v.optional(v.string()),
    timestamp: v.number(),
    resolved: v.boolean(),
  }).index("by_resolved", ["resolved"]),

  fixes: defineTable({
    errorId: v.id("errors"),
    originalCode: v.string(),
    fixedCode: v.string(),
    reasoning: v.string(),
    timestamp: v.number(),
  }).index("by_error", ["errorId"]),
});
