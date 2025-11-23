import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ReCode Schema - Error tracking and fix management
// Add this to your existing schema.ts or merge with your existing tables

export default defineSchema({
  // Add your existing tables here...

  errors: defineTable({
    functionName: v.string(),
    errorMessage: v.string(),
    stackTrace: v.optional(v.string()),
    timestamp: v.number(),
    resolved: v.boolean(),
  }).index("by_resolved", ["resolved"]),

  fixes: defineTable({
    errorId: v.id("errors"),
    errorPattern: v.optional(v.string()), // "functionName: errorMessage" for semantic matching
    embedding: v.optional(v.array(v.float64())), // Vector embedding for similarity search
    originalCode: v.string(),
    fixedCode: v.string(),
    reasoning: v.string(),
    timestamp: v.number(),
    confidence: v.optional(v.number()), // 0-100 score from Claude
    status: v.optional(v.string()), // "applied" | "pending" | "approved"
    appliedAt: v.optional(v.number()), // Timestamp when fix was applied
    effectiveness: v.optional(v.number()), // 0-1 score, tracks if fix worked
    timesApplied: v.optional(v.number()), // How many times this fix was reused
  })
    .index("by_error", ["errorId"])
    .index("by_status", ["status"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // OpenAI text-embedding-3-small dimension
      filterFields: ["errorPattern"], // Can filter by pattern for faster search
    }),
});
