import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all todos
export const getTodos = query({
  handler: async (ctx) => {
    return await ctx.db.query("todos").collect();
  },
});

// BUG #1: Frontend sends 'text' but mutation expects 'todoText'
export const addTodo = mutation({
  args: { todoText: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("todos", {
      text: args.todoText,
      isCompleted: false,
    });
  },
});

// BUG #2: Field is 'isCompleted' not 'completedStatus'
export const toggleTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new Error("Todo not found");

    await ctx.db.patch(args.id, {
      completedStatus: !todo.isCompleted,
    });
  },
});

// BUG #3: Frontend sends 'id' but mutation expects 'todoId'
export const deleteTodo = mutation({
  args: { todoId: v.id("todos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.todoId);
  },
});
