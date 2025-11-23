import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all todos
export const getTodos = query({
  handler: async (ctx) => {
    return await ctx.db.query("todos").collect();
  },
});

// BUG #1: Wrong field name - should be "text" not "todoText"
export const addTodo = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("todos", {
      todoText: args.text, // BUG: Field is called "text" in schema, not "todoText"
      isCompleted: false,
    });
  },
});

// BUG #2: Wrong method - should be ctx.db.patch() not ctx.db.update()
export const toggleTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new Error("Todo not found");

    await ctx.db.update(args.id, { // BUG: update() doesn't exist, should be patch()
      isCompleted: !todo.isCompleted,
    });
  },
});

// BUG #3: Wrong field name - should be "isCompleted" not "completed"
export const deleteTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (todo && todo.completed) { // BUG: Field is "isCompleted" not "completed"
      await ctx.db.delete(args.id);
    }
  },
});
