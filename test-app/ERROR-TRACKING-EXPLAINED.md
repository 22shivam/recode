# 🔍 Error Tracking Explained

## Why Two Types of Error Tracking?

ReCode uses **two layers** of error tracking because bugs can happen at different stages:

### 🟢 Server-Side Tracking (`wrapMutation`)

**What it catches:**
- Runtime errors **inside** the handler
- Example: `ctx.db.update()` doesn't exist, `todo.completed` is undefined

**How it works:**
```typescript
export const toggleTodo = mutation({
  args: { id: v.id("todos") },
  handler: wrapMutation(
    async (ctx, args) => {
      // Errors HERE are caught by wrapMutation
      await ctx.db.patch(args.id, { ... });
    },
    "todos.toggleTodo"
  ),
});
```

**Catches:**
- ✅ Type errors (accessing undefined properties)
- ✅ Method errors (calling non-existent functions)
- ✅ Database errors
- ❌ Argument validation errors (happens BEFORE handler runs)

---

### 🔵 Client-Side Tracking (`logError`)

**What it catches:**
- `ArgumentValidationError` - happens **before** the handler runs
- Example: Frontend sends `{ text: "..." }` but mutation expects `{ todoText: "..." }`

**How it works:**
```typescript
const handleAdd = async (e: React.FormEvent) => {
  try {
    await addTodo({ text: newTodo });
  } catch (err: any) {
    // Catches ArgumentValidationError
    await logError({
      functionName: "todos.addTodo",
      errorMessage: err.message,
      stackTrace: err.stack,
    });
  }
};
```

**Catches:**
- ✅ Argument validation errors (field name mismatches)
- ✅ Missing required fields
- ✅ Type mismatches
- ✅ Any error that happens before handler execution

---

## 🎯 The 3 Test Bugs

### Bug #1: `addTodo` - Args Mismatch
```typescript
// Frontend sends:
await addTodo({ text: "..." })

// Backend expects:
args: { todoText: v.string() }

// Error type: ArgumentValidationError
// Caught by: CLIENT-SIDE logging
```

**Why?** Convex validates arguments BEFORE running the handler, so `wrapMutation()` never sees it.

---

### Bug #2: `toggleTodo` - Wrong Field
```typescript
await ctx.db.patch(args.id, {
  completedStatus: !todo.isCompleted  // Bug: field doesn't exist
});

// Error type: Runtime error (inside handler)
// Caught by: SERVER-SIDE wrapMutation
```

**Why?** Error happens inside the handler during execution.

---

### Bug #3: `deleteTodo` - Args Mismatch
```typescript
// Frontend sends:
await deleteTodo({ id: "..." })

// Backend expects:
args: { todoId: v.id("todos") }

// Error type: ArgumentValidationError
// Caught by: CLIENT-SIDE logging
```

**Why?** Same as Bug #1 - validation happens before handler.

---

## 🛠️ Toggle Scripts

### `./toggle-tracking.sh`
**Toggles server-side tracking** (wrapMutation)

```bash
./toggle-tracking.sh  # Turn ON
./toggle-tracking.sh  # Turn OFF (run again)
```

**When ON:**
- ✅ Catches runtime errors in handlers
- ✅ Logs to Convex `errors` table
- ✅ Agent detects and fixes

**When OFF:**
- ❌ Errors still thrown but not logged
- ❌ Agent can't detect them
- ℹ️ Useful to show "before ReCode" state

---

### `./toggle-client-logging.sh`
**Toggles client-side error logging** (try-catch with logError)

```bash
./toggle-client-logging.sh  # Turn ON
./toggle-client-logging.sh  # Turn OFF (run again)
```

**When ON:**
- ✅ Catches `ArgumentValidationError`
- ✅ Logs to Convex `errors` table
- ✅ Agent detects and fixes

**When OFF:**
- ❌ Errors shown in UI but not logged
- ❌ Agent can't detect argument bugs
- ℹ️ Useful to show "before ReCode" state

---

## 📊 Error Flow Diagram

### With Both Enabled (Full ReCode)

```
┌─────────────┐
│ User Action │ (Add todo)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Frontend    │ await addTodo({ text: "..." })
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Convex      │ Validates args
└──────┬──────┘
       │
       ↓ ❌ ArgumentValidationError
       │    (text vs todoText mismatch)
       ↓
┌─────────────┐
│ Client      │ catch (err) { logError(...) }
│ Error Log   │ Logs to Convex errors table
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Agent       │ Polls every 3s
│ Detects     │ Finds error in errors table
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Claude AI   │ Analyzes: "Change todoText → text"
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Agent       │ Writes fix to todos.ts
│ Applies Fix │ Convex reloads
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ User Retry  │ await addTodo({ text: "..." })
└──────┬──────┘
       │
       ↓ ✅ Success!
```

---

## 🎬 Demo Workflow

### Option 1: Full Demo (Recommended)
```bash
# 1. Install ReCode
node ../create-recode/bin/cli.js init

# 2. Enable BOTH tracking methods
./toggle-tracking.sh       # Enable server-side
./toggle-client-logging.sh # Enable client-side

# 3. Start agent
cd agent && npm start

# 4. Trigger bugs → All 3 get fixed!
```

**Shows:** Complete self-healing with both error types

---

### Option 2: Show "Before" vs "After"
```bash
# BEFORE: No error tracking
./toggle-tracking.sh       # Turn OFF
./toggle-client-logging.sh # Turn OFF

# Show bugs breaking
# Errors appear but agent can't detect them

# AFTER: Enable ReCode
./toggle-tracking.sh       # Turn ON
./toggle-client-logging.sh # Turn ON

# Trigger same bugs → Auto-fixed!
```

**Shows:** Clear before/after comparison

---

### Option 3: Show Each Layer
```bash
# Step 1: Only client logging
./toggle-tracking.sh       # OFF
./toggle-client-logging.sh # ON

# Test Bug #1 and #3 (arg validation) → Fixed
# Test Bug #2 (runtime) → NOT fixed (no server tracking)

# Step 2: Enable server tracking too
./toggle-tracking.sh       # ON

# Test Bug #2 → Now fixed!
```

**Shows:** How each layer works independently

---

## 💡 Quick Reference

| Script | Purpose | Catches |
|--------|---------|---------|
| `./toggle-tracking.sh` | Server-side (wrapMutation) | Runtime errors in handlers |
| `./toggle-client-logging.sh` | Client-side (try-catch) | ArgumentValidationError |

**Both needed for complete coverage!**

---

## 🐛 Which Bug Needs Which?

| Bug | Type | Needs Server? | Needs Client? |
|-----|------|---------------|---------------|
| #1 addTodo | Arg validation | ❌ | ✅ Required |
| #2 toggleTodo | Runtime | ✅ Required | ❌ |
| #3 deleteTodo | Arg validation | ❌ | ✅ Required |

**For all 3 bugs to work, enable BOTH!**

---

## 🎯 Summary

**Server-side (`wrapMutation`):**
- Wraps the handler function
- Catches errors during execution
- Needed for Bug #2

**Client-side (`logError`):**
- Wraps the mutation call
- Catches validation errors
- Needed for Bug #1 and #3

**Together:** Complete error coverage + autonomous healing! 🚀
