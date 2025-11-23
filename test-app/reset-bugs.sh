#!/bin/bash

echo "🐛 Resetting bugs in todos.ts..."

# Check if ReCode is installed
if [ ! -f "convex/errors.ts" ]; then
  echo "⚠️  Warning: ReCode doesn't appear to be installed (errors.ts not found)"
  echo "   Creating clean buggy version without wrapMutation()"

  # Create buggy version without wrapper
  cat > convex/todos.ts << 'EOF'
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
EOF

else
  # ReCode is installed, use wrapped version
  cat > convex/todos.ts << 'EOF'
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { wrapMutation } from "./errors";

// Query to get all todos
export const getTodos = query({
  handler: async (ctx) => {
    return await ctx.db.query("todos").collect();
  },
});

// BUG #1: Frontend sends 'text' but mutation expects 'todoText'
export const addTodo = mutation({
  args: { todoText: v.string() },
  handler: wrapMutation(
    async (ctx, args) => {
      await ctx.db.insert("todos", {
        text: args.todoText,
        isCompleted: false,
      });
    },
    "todos.addTodo"
  ),
});

// BUG #2: Field is 'isCompleted' not 'completedStatus'
export const toggleTodo = mutation({
  args: { id: v.id("todos") },
  handler: wrapMutation(
    async (ctx, args) => {
      const todo = await ctx.db.get(args.id);
      if (!todo) throw new Error("Todo not found");

      await ctx.db.patch(args.id, {
        completedStatus: !todo.isCompleted,
      });
    },
    "todos.toggleTodo"
  ),
});

// BUG #3: Frontend sends 'id' but mutation expects 'todoId'
export const deleteTodo = mutation({
  args: { todoId: v.id("todos") },
  handler: wrapMutation(
    async (ctx, args) => {
      await ctx.db.delete(args.todoId);
    },
    "todos.deleteTodo"
  ),
});
EOF

fi

# Check if page.tsx has error logging
if grep -q "logError" app/page.tsx; then
  echo "ℹ️  Page already has client-side error logging (keeping it)"
else
  echo "⚠️  Page doesn't have client-side error logging"
  echo "   For ReCode to detect bugs, add error logging to page.tsx"
  echo "   Or run: ./add-error-logging.sh"
fi

echo ""
echo "✅ Bugs reset successfully!"
echo ""
echo "🐛 The 3 bugs are back:"
echo "   1. addTodo: expects 'todoText' instead of 'text'"
echo "   2. toggleTodo: sets 'completedStatus' instead of 'isCompleted'"
echo "   3. deleteTodo: expects 'todoId' instead of 'id'"
echo ""
echo "🧪 Test by triggering the bugs in the app!"
