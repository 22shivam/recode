#!/bin/bash

# Check current state by looking for wrapMutation import
if grep -q "import { wrapMutation }" convex/todos.ts; then
  echo "🔴 Disabling error tracking (removing wrapMutation)..."

  # Create version WITHOUT wrapMutation
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

  echo "✅ Error tracking DISABLED (wrapMutation removed)"
  echo "   Errors won't be caught server-side anymore"

else
  # Check if errors.ts exists
  if [ ! -f "convex/errors.ts" ]; then
    echo "❌ Error: ReCode not installed (convex/errors.ts not found)"
    echo "   Run: node ../create-recode/bin/cli.js init"
    exit 1
  fi

  echo "🟢 Enabling error tracking (adding wrapMutation)..."

  # Create version WITH wrapMutation
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

  echo "✅ Error tracking ENABLED (wrapMutation added)"
  echo "   Server-side errors will now be caught and logged"
fi

echo ""
echo "💡 Current state:"
if grep -q "import { wrapMutation }" convex/todos.ts; then
  echo "   🟢 Error tracking: ON"
else
  echo "   🔴 Error tracking: OFF"
fi

if grep -q "logError" app/page.tsx; then
  echo "   🟢 Client logging: ON"
else
  echo "   🔴 Client logging: OFF"
fi

echo ""
echo "📝 Tip: Run this script again to toggle on/off"
