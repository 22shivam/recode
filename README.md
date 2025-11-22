# ReCode 🤖

> **When your code breaks, Claude rewrites it—automatically**

## Project Summary

ReCode eliminates downtime by giving your application the ability to fix itself. Using Claude AI and Convex's real-time infrastructure, it detects production errors, autonomously patches the buggy code, and redeploys—turning hours of debugging into seconds of automated repair.

## Technical Description

ReCode is built on three core components that work together in a continuous observation-action loop:

### 1. **Error Detection Layer**
A Next.js task management application with intentionally buggy Convex backend functions. When errors occur (field name mismatches, type errors, validation failures), they're automatically logged to Convex's real-time database with full error context, stack traces, and function names.

### 2. **Autonomous Agent**
A Node.js agent polls Convex every 3 seconds for unresolved errors. When detected, it:
- Generates vector embedding of the error using OpenAI text-embedding-3-small
- Searches Convex vector index for similar past fixes (cosine similarity)
- If similarity >85%, applies cached fix instantly (~300ms)
- Otherwise, reads broken code and sends to Claude Sonnet 4.5 via Anthropic API
- Validates and writes the corrected code back to disk
- Stores fix with embedding in Convex for future reuse

### 3. **Real-Time Synchronization**
Convex provides instant reactivity:
- Functions automatically reload when files change
- Error/fix logs update across all connected clients in real-time
- Dashboard displays agent activity without manual refreshing
- Type-safe mutations and queries via generated TypeScript types

**Result**: When a user triggers a bug (e.g., clicking "Add Task"), the error flows through Convex, gets fixed by Claude, and the corrected function deploys—all in 5-10 seconds with zero human intervention.

## Architecture

```
User Action → Error in Convex Function → Logged to Convex DB
    ↓
Agent Polls for Errors → Reads Broken Code → Sends to Claude AI
    ↓
Claude Generates Fix → Agent Writes Fixed Code → Convex Auto-Reloads
    ↓
User Retries Action → Success! ✨
```

## Key Features

- ✅ **Autonomous Error Resolution** - No human in the loop
- ✅ **Real-Time Dashboard** - Watch fixes happen live
- ✅ **Convex Integration** - Deep usage of real-time DB, mutations, queries, vector search
- ✅ **Vector Memory Learning** - AI learns from past fixes using semantic similarity search
- ✅ **Instant Fix Reuse** - Repeated errors get fixed in <1s (85%+ similarity threshold)
- ✅ **Confidence Scoring** - Low-confidence fixes require human approval
- ✅ **Voice Control (Omi)** - Approve/reject fixes hands-free with voice commands
- ✅ **Production-Ready Patterns** - Error logging, validation, rollback support

---

## Quick Start

### Prerequisites
- Node.js 18+
- Convex account (free at [convex.dev](https://convex.dev))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- OpenAI API key ([platform.openai.com](https://platform.openai.com/api-keys))

### 1. Set up Convex

```bash
cd frontend
npm install
npx convex dev --typecheck=disable
```

This will:
- Open a browser to login/create Convex account
- Generate your `NEXT_PUBLIC_CONVEX_URL`
- Create `.env.local` automatically
- Start watching your Convex functions

**Note**: We use `--typecheck=disable` because the demo includes intentional TypeScript errors that need to reach runtime.

### 2. Add your API keys

Edit `frontend/.env.local` and add:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
```

Get your keys from:
- Anthropic: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/api-keys

### 3. Start the Next.js app

In a new terminal:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Start the AI Agent

In a third terminal:

```bash
cd agent
npm install
npm run dev
```

You should see:
```
🤖 Self-Healing Agent Started!
📡 Connected to Convex
👁️  Monitoring for errors...
```

---

## Testing the Self-Repair System

### Demo Flow

1. **Open the app**: http://localhost:3000
2. **Open the dashboard**: http://localhost:3000/dashboard (in another tab)
3. **Trigger Bug #1**: Try to add a task → ❌ Error!
4. **Watch the agent terminal**:
   - 🔴 Error detected in `tasks.addTask`
   - 🤖 Claude analyzing...
   - ✅ Fix applied!
5. **Try again**: Add a task → ✨ Success!
6. **Trigger Bug #2**: Toggle a task → Same fix cycle
7. **Trigger Bug #3**: Delete a task → Same fix cycle

**All 3 bugs get fixed automatically!**

### What's Being Fixed

| Bug | Issue | Fix |
|-----|-------|-----|
| **#1** | `addTask` expects `taskText` but frontend sends `text` | Change arg from `taskText` to `text` |
| **#2** | `toggleTask` sets `completedStatus` but schema has `completed` | Change field from `completedStatus` to `completed` |
| **#3** | `deleteTask` expects `taskId` but frontend sends `id` | Change arg from `taskId` to `id` |

---

## Reset for Another Demo 🔄

### Full Reset (New Demo)

After the agent fixes all bugs, reset everything:

```bash
# From project root
node reset-bugs.js
```

This will:
- ✅ Restore the 3 bugs to `convex/tasks.ts`
- ✅ Clear all error and fix history from Convex
- ✅ Ready for a fresh demo!

### Reset Bugs Only (Test Vector Search) 🧠

To test the vector search learning capability:

```bash
# From project root
node reset-bugs-keep-history.js
```

This will:
- ✅ Restore the 3 bugs to `convex/tasks.ts`
- ✅ **Keep** all error and fix history in Convex
- ✅ Ready to demonstrate instant fixes!

**Expected behavior:**
- **First run**: Claude analyzes code (~6 seconds per fix)
- **Second run** (after reset-bugs-keep-history): Instant fixes from cache (~300ms) ⚡

**Then restart the agent:**
```bash
cd agent
# Ctrl+C to stop, then:
npm run dev
```

---

## Omi Voice Integration (Optional) 🎤

Control ReCode hands-free with your Omi wearable device!

### Features
- 🔔 **Proactive Notifications**: Get alerted when errors occur
- 🎙️ **Voice Commands**: "approve the fix", "what's the status", "reject the fix"
- ⚡ **Real-time**: Processes your voice as you speak

### Quick Setup

1. **Install dependencies:**
```bash
cd omi
npm install
```

2. **Create Omi app:**
   - Go to [h.omi.me/apps](https://h.omi.me/apps)
   - Create new "Integration App"
   - Select "Real-time Transcript Processor" trigger
   - Save your `APP_ID` and `APP_SECRET`

3. **Configure environment:**
   - Add to `frontend/.env.local`:
   ```bash
   OMI_UID=your_user_id_from_omi
   OMI_APP_ID=your_app_id
   OMI_APP_SECRET=your_app_secret
   ```

4. **Expose webhook with ngrok:**
   ```bash
   ngrok http 3001
   ```
   - Copy HTTPS URL + `/webhook` to Omi app config

5. **Start Omi server:**
```bash
cd omi
npm start
```

6. **Restart agent** (to enable notifications):
```bash
cd agent
npm install  # Install axios if needed
npm run dev
```

### Voice Commands
- "approve the fix" → Approves pending fix
- "reject the fix" → Rejects pending fix
- "what's the status" → System status
- "list pending" → Show pending approvals

See [omi/README.md](./omi/README.md) for detailed setup.

---

## Project Structure

```
recode/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Main task manager UI
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Real-time agent dashboard
│   │   ├── layout.tsx            # Convex provider setup
│   │   └── ConvexClientProvider.tsx
│   ├── convex/
│   │   ├── schema.ts             # Database schema (tasks, errors, fixes) + vector index
│   │   ├── tasks.ts              # Task CRUD (with intentional bugs)
│   │   ├── tasks.buggy.ts        # Backup for resetting
│   │   ├── errors.ts             # Error logging functions
│   │   └── fixes.ts              # Fix history + vector search functions
│   └── package.json
├── agent/
│   ├── index.js                  # AI agent (polls + fixes + vector search + Omi)
│   ├── clear-history.js          # Reset helper
│   └── package.json
├── omi/                          # Voice integration (optional)
│   ├── server.js                 # Webhook server for Omi device
│   ├── notifications.js          # Send notifications to Omi
│   ├── commands.js               # Parse voice commands
│   ├── convex-client.js          # Convex integration
│   └── README.md                 # Omi setup guide
├── reset-bugs.js                 # Full reset (bugs + history)
├── reset-bugs-keep-history.js    # Reset bugs only (for testing vector search)
└── DEMO_SCRIPT.md                # 2-minute pitch guide
```

---

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend**: Convex (serverless functions + real-time database + vector search)
- **AI**:
  - Claude Sonnet 4.5 (code analysis & fixing via Anthropic API)
  - OpenAI text-embedding-3-small (semantic similarity for learning)
- **Architecture**: Autonomous agent with OODA-loop pattern + vector memory

---

## How It Works (Deep Dive)

### 1. Error Occurs
User clicks "Add Task" → Convex function `tasks.addTask` fails because it expects `{ taskText: string }` but receives `{ text: string }`.

### 2. Error Logged
Frontend catches the error and calls:
```typescript
await logError({
  functionName: "tasks.addTask",
  errorMessage: "Argument text is not defined",
  stackTrace: err.stack
});
```

### 3. Agent Detects
Agent polls `api.errors.getUnresolved` every 3 seconds, finds the new error.

### 4. Claude Analyzes
Agent reads `convex/tasks.ts`, sends to Claude:
```
ERROR: Argument text is not defined
FUNCTION: tasks.addTask
CODE: [broken function]

Fix ONLY the bug, return clean TypeScript.
```

### 5. Fix Applied
Claude returns corrected code with `args: { text: v.string() }`. Agent:
- Validates the fix (checks for imports)
- Writes to `convex/tasks.ts`
- Logs fix to Convex
- Marks error as resolved

### 6. Convex Reloads
Convex dev server detects file change, recompiles, redeploys function (< 1 second).

### 7. User Retries
User clicks "Add Task" again → Success! ✅

---

## Future Enhancements

- 🧪 **Test Validation** - Run tests before applying fixes
- 🌐 **Multi-Language Support** - Extend beyond TypeScript
- 🔄 **Rollback System** - Auto-revert if fix doesn't work
- 🎯 **Vapi Integration** - Alternative voice interface option

---

## Demo Script

See [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) for a detailed 2-minute presentation guide optimized for hackathon judges.

---

## License

MIT

---

**Built for hackathons with ❤️**
Powered by [Convex](https://convex.dev) + [Anthropic Claude](https://anthropic.com)
