import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all tasks
export const getTasks = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").order("desc").collect();
    return tasks;
  },
});

// Add a new task
export const addTask = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      text: args.text,
      completed: false,
      createdAt: Date.now(),
    });
    return taskId;
  },
});

// Toggle task completion
export const toggleTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.id, {
      completed: !task.completed,
    });
  },
});

// Delete a task
export const deleteTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});