# 🐛 Buggy Todo App - ReCode Test Application

This is a **deliberately broken** Next.js + Convex app designed to demonstrate ReCode's autonomous debugging capabilities.

## 🎯 Purpose

This app contains **3 intentional bugs** in the Convex backend. It's the perfect test case to show how ReCode detects and fixes errors automatically.

## 🐛 The Bugs

1. **Bug #1 - Add Todo**: Wrong field name
   - Code uses `todoText` instead of `text`
   - Error: "todoText is not a valid field"

2. **Bug #2 - Toggle Todo**: Wrong method call
   - Code uses `ctx.db.update()` instead of `ctx.db.patch()`
   - Error: "ctx.db.update is not a function"

3. **Bug #3 - Delete Todo**: Wrong field name
   - Code checks `todo.completed` instead of `todo.isCompleted`
   - Error: "completed is not a valid field"

## 🚀 Testing ReCode Installation

Follow these steps to test the `create-recode` package:

### Step 1: Setup Convex

\`\`\`bash
# Run Convex dev server
npx convex dev
\`\`\`

This will:
- Create a new Convex deployment
- Push the buggy schema
- Generate Convex client code
- Update .env.local with CONVEX_URL

### Step 2: Run the App

\`\`\`bash
# In a new terminal
npm run dev
\`\`\`

Open http://localhost:3000

### Step 3: Trigger the Bugs

Try each action to see the bugs:

1. **Add a todo** → Click "Add" button
   - ❌ Error: "todoText is not a valid field"

2. **Toggle a checkbox** → (Need to manually add a todo in Convex dashboard first)
   - ❌ Error: "ctx.db.update is not a function"

3. **Delete a todo** → Click "Delete" button
   - ❌ Error: "completed is not a valid field"

### Step 4: Install ReCode

Now install ReCode to fix the bugs automatically:

\`\`\`bash
cd /Users/shivamgarg/Documents/building/oct-2025/fall\ 2025/aforehacks/self-healing-tasks/test-app
node ../create-recode/bin/cli.js init
\`\`\`

This will:
- ✅ Install agent in \`agent/\` folder
- ✅ Add error tracking to \`convex/\`
- ✅ Install dashboard at \`/recode\`
- ✅ Set up API keys automatically (pre-configured)
- ✅ Install dependencies

### Step 5: Wrap Functions with Error Tracking

Edit \`convex/todos.ts\` and wrap each function:

\`\`\`typescript
import { withErrorTracking } from "./errors";

// Wrap addTodo
export const addTodo = withErrorTracking(
  mutation({
    args: { text: v.string() },
    handler: async (ctx, args) => {
      await ctx.db.insert("todos", {
        todoText: args.text, // BUG still here
        isCompleted: false,
      });
    }
  }),
  "todos.addTodo"
);

// Wrap toggleTodo
export const toggleTodo = withErrorTracking(
  mutation({
    args: { id: v.id("todos") },
    handler: async (ctx, args) => {
      const todo = await ctx.db.get(args.id);
      if (!todo) throw new Error("Todo not found");
      await ctx.db.update(args.id, { // BUG still here
        isCompleted: !todo.isCompleted,
      });
    }
  }),
  "todos.toggleTodo"
);

// Wrap deleteTodo
export const deleteTodo = withErrorTracking(
  mutation({
    args: { id: v.id("todos") },
    handler: async (ctx, args) => {
      const todo = await ctx.db.get(args.id);
      if (todo && todo.completed) { // BUG still here
        await ctx.db.delete(args.id);
      }
    }
  }),
  "todos.deleteTodo"
);
\`\`\`

### Step 6: Start the ReCode Agent

\`\`\`bash
cd agent
npm start
\`\`\`

You should see:
\`\`\`
🤖 ReCode Agent Started!
📡 Connected to Convex
👁️  Monitoring for errors...
\`\`\`

### Step 7: Watch the Magic! ✨

1. **Trigger Bug #1**: Try to add a todo
   - 🔴 Agent detects error
   - 🤖 Claude analyzes the bug
   - ✅ Agent auto-fixes \`todoText\` → \`text\`
   - ✨ Convex reloads, function works!

2. **Trigger Bug #2**: Try to toggle
   - 🔴 Agent detects error
   - 🤖 Claude finds the issue
   - ✅ Agent auto-fixes \`update()\` → \`patch()\`
   - ✨ Works instantly!

3. **Trigger Bug #3**: Try to delete
   - 🔴 Agent detects error
   - 🤖 Claude identifies wrong field
   - ✅ Agent auto-fixes \`completed\` → \`isCompleted\`
   - ✨ Fixed!

### Step 8: Check the Dashboard

Visit http://localhost:3000/recode to see:

- 📊 Real-time error monitoring
- 🔧 Applied fixes with confidence scores
- 🧠 Vector similarity matches
- ⏱️ Fix application time

## ✅ Success!

ReCode installed and working! All bugs will be fixed automatically as you trigger them.
