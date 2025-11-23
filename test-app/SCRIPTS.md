# 🛠️ Test App Helper Scripts

Quick scripts to manage ReCode installation and test bugs.

## 📝 Available Scripts

### 1. `./toggle-tracking.sh` ⭐ NEW
**Toggles server-side error tracking (wrapMutation)**

Turns on/off `wrapMutation()` in todos.ts to catch runtime errors.

**When enabled:**
- ✅ Catches errors inside mutation handlers (Bug #2)
- ✅ Runtime errors like `ctx.db.update()`, `todo.completed`

**When disabled:**
- ❌ Errors not logged to Convex
- ℹ️ Shows "before ReCode" state

**Usage:**
```bash
./toggle-tracking.sh  # Toggle ON/OFF
```

### 2. `./toggle-client-logging.sh` ⭐ NEW
**Toggles client-side error logging (try-catch)**

Adds/removes try-catch blocks with `logError()` calls in page.tsx.

**When enabled:**
- ✅ Catches `ArgumentValidationError` (Bug #1 and #3)
- ✅ Field name mismatches like `text` vs `todoText`

**When disabled:**
- ❌ Argument errors not logged to Convex
- ℹ️ Shows "before ReCode" state

**Usage:**
```bash
./toggle-client-logging.sh  # Toggle ON/OFF
```

**💡 Why both?** See `ERROR-TRACKING-EXPLAINED.md` for full details!

### 3. `./reset-bugs.sh`
**Removes all ReCode artifacts**

Removes:
- `agent/` folder
- `app/recode/` dashboard
- `convex/errors.ts` and `convex/fixes.ts`
- ReCode tables from schema
- Client-side error logging
- `.env.local.example`

**Usage:**
```bash
./uninstall-recode.sh
```

### 2. `./reset-bugs.sh`
**Resets todos.ts back to buggy state**

Reintroduces the 3 bugs:
1. `addTodo`: expects `todoText` instead of `text`
2. `toggleTodo`: sets `completedStatus` instead of `isCompleted`
3. `deleteTodo`: expects `todoId` instead of `id`

**Smart behavior:**
- If ReCode is installed → uses `wrapMutation()`
- If ReCode is not installed → clean buggy version

**Usage:**
```bash
./reset-bugs.sh
```

### 3. `./add-error-logging.sh`
**Adds client-side error logging to page.tsx**

Required for ReCode to detect `ArgumentValidationError` bugs. Wraps all mutation calls in try-catch and logs errors to Convex.

**Usage:**
```bash
./add-error-logging.sh
```

## 🎯 Common Workflows

### Fresh Install Demo
```bash
# 1. Clean slate
./uninstall-recode.sh

# 2. Install ReCode
node ../create-recode/bin/cli.js init

# 3. Add error tracking to mutations
./reset-bugs.sh

# 4. Add client-side error logging
./add-error-logging.sh

# 5. Start agent
cd agent && npm start

# 6. Trigger bugs and watch them fix!
```

### Re-test After Fixes
```bash
# Reset bugs while keeping ReCode installed
./reset-bugs.sh

# Trigger bugs again to test vector similarity/caching
```

### Complete Reset
```bash
# Remove everything and start fresh
./uninstall-recode.sh

# Optionally clear Convex data
# (delete errors and fixes tables in Convex dashboard)
```

## 🧪 Testing Workflow

**Step 1: Setup**
```bash
# Make sure Convex is running
npx convex dev

# Make sure Next.js is running
npm run dev
```

**Step 2: Install & Configure**
```bash
# Install ReCode
node ../create-recode/bin/cli.js init

# Add bugs with wrappers
./reset-bugs.sh

# Add client error logging
./add-error-logging.sh

# Start the agent
cd agent && npm start
```

**Step 3: Test Each Bug**

**Bug #1: Add Todo**
- Go to `localhost:3000`
- Try to add a todo
- ❌ Error: `Object is missing the required field 'todoText'`
- ✅ Agent detects and fixes (changes `todoText` → `text`)
- Try again → Works!

**Bug #2: Toggle Todo**
- First manually add a todo in Convex dashboard
- Click the checkbox to toggle
- ❌ Error: `completedStatus is not a valid field`
- ✅ Agent detects and fixes (changes `completedStatus` → `isCompleted`)
- Try again → Works!

**Bug #3: Delete Todo**
- Click "Delete" on a todo
- ❌ Error: `Object is missing the required field 'todoId'`
- ✅ Agent detects and fixes (changes `todoId` → `id`)
- Try again → Works!

**Step 4: Test Vector Search**
```bash
# Reset bugs to test cached fixes
./reset-bugs.sh

# Trigger the same bugs again
# Agent should apply instant fixes from vector DB (<100ms)
```

## 📊 Check Agent Logs

Watch for these messages:

**First time (no cache):**
```
🔴 Found 1 new error(s)!
🔍 Searching for similar past fixes...
   No similar fixes found in memory, asking Claude...
🤖 Asking Claude AI to fix the code...
✅ Claude generated a fix!
🎯 Confidence: 95%
✅ Auto-applying fix...
✨ Fix complete!
```

**Second time (cached):**
```
🔴 Found 1 new error(s)!
🔍 Searching for similar past fixes...
💡 Found similar past fix! (Similarity: 98%)
⚡ INSTANT FIX from memory! (52ms)
✨ Applied cached fix!
```

## 🎬 Hackathon Demo Script

```bash
# 1. Show broken app
open http://localhost:3000
# Try to add todo → Error!

# 2. Install ReCode
./uninstall-recode.sh  # Start clean
node ../create-recode/bin/cli.js init

# 3. Add wrappers
./reset-bugs.sh
./add-error-logging.sh

# 4. Start agent
cd agent && npm start

# 5. Watch magic
# Trigger all 3 bugs one by one
# Show agent terminal fixing them
# Show dashboard at /recode

# 6. Show learning
./reset-bugs.sh  # Reset to buggy state
# Trigger bugs again → Instant fixes!
```

## 💡 Tips

- **Always run from test-app root**: `cd test-app && ./script.sh`
- **Check Convex is running**: Look for "Convex functions ready"
- **Check agent is running**: Should see "Monitoring for errors..."
- **View dashboard**: Go to `localhost:3000/recode` to see fix history
- **Clear database**: Delete rows in `errors` and `fixes` tables in Convex dashboard

## 🐛 Troubleshooting

**Script permission denied?**
```bash
chmod +x *.sh
```

**Agent not detecting errors?**
- Check agent is connected to right Convex URL (check agent terminal)
- Verify `errors` table exists in Convex
- Make sure client-side logging is added (`./add-error-logging.sh`)

**Fixes not applying?**
- Check file permissions on `convex/` folder
- Verify agent has write access
- Check agent logs for errors

**Schema mismatch after uninstall?**
```bash
# Convex should auto-detect and push new schema
# If not, restart: Ctrl+C and run `npx convex dev` again
```
