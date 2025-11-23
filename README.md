# ReCode 🤖

[Demo](https://www.loom.com/share/101afd8bd1884b489f0b98f4d989ff5e) (https://www.loom.com/share/101afd8bd1884b489f0b98f4d989ff5e)

> **When your code breaks, Claude rewrites it—automatically**

**Powered by [Convex](https://convex.dev) 🔥 | Voice-enabled with [Omi](https://omi.me) 🎤**

## Project Summary

ReCode is an autonomous code repair system that showcases the power of **Convex's real-time infrastructure** and **Omi's voice AI platform**. Built on Convex's reactive database with vector search capabilities, it continuously monitors applications for errors and autonomously generates fixes using Claude Sonnet 4.5. The system leverages **Convex's instant reactivity** for real-time error detection and automatic hot-reload when fixes are applied, while **Omi's voice interface** enables hands-free approval of low-confidence fixes through natural language commands. The agent learns from past repairs using OpenAI embeddings stored in **Convex's vector index**, delivering instant cached fixes (<1s) for similar future errors. ReCode demonstrates how **Convex eliminates complex backend infrastructure** while **Omi transforms developer workflows** through voice control, turning traditional 5-10 second error-to-fix cycles into instant repairs with continuous learning.

## Technical Description

ReCode is built on three core components that work together in a continuous observation-action loop:

### 1. **Error Detection Layer (Powered by Convex)**
A Next.js application with Convex backend functions that includes intentional bugs for demonstration. When errors occur (field name mismatches, type errors, validation failures), they're automatically logged to **Convex's real-time database** with full error context, stack traces, and function names. **Convex's serverless functions** provide automatic deployment and type-safety, while its **reactive queries** ensure errors appear instantly across all connected clients without polling.

### 2. **Autonomous Agent (Powered by Convex Vector Search + Omi Voice AI)**
A Node.js agent polls Convex every 3 seconds for unresolved errors. When detected, it leverages **Convex's advanced capabilities** and **Omi's voice platform**:

**Convex Vector Search Intelligence:**
- Generates vector embedding of the error using OpenAI text-embedding-3-small (1536 dimensions)
- Queries **Convex's built-in vector index** for semantically similar past fixes (cosine similarity)
- **Convex handles vector search natively**—no separate vector database needed!
- If similarity >85%, applies cached fix instantly (~50-300ms) thanks to Convex's speed
- Otherwise, reads broken code and sends to Claude Sonnet 4.5 via Anthropic API
- Stores fix with embedding back in **Convex's vector index** for continuous learning

**Omi Voice Integration:**
- For low-confidence fixes (<70%), sends notification to **Omi wearable device**
- **Omi processes voice commands in real-time**: "approve the fix", "reject the fix", "what's the status"
- Natural language understanding powered by **Omi's AI platform**
- Hands-free workflow—developers can approve fixes while coding, walking, or in meetings
- **Omi's webhook system** enables instant bidirectional communication with the agent

### 3. **Real-Time Synchronization (The Convex Advantage)**
**Convex's real-time infrastructure makes ReCode possible** by eliminating traditional backend complexity:

**Instant Reactivity:**
- **Convex's reactive queries** automatically push error/fix updates to all connected clients
- No WebSockets to manage, no polling intervals, no state synchronization headaches
- Dashboard updates in real-time without a single line of subscription code
- **Type-safe mutations and queries** via Convex's automatic TypeScript generation

**Serverless Deployment:**
- **Functions automatically reload when files change** (<1s hot reload)
- No manual deployments, no container orchestration, no infrastructure management
- Convex handles scaling automatically—from development to production

**Built-in Vector Search:**
- **Convex's native vector index** eliminates need for separate Pinecone/Weaviate setup
- Millisecond query latency for semantic similarity search
- Integrated with the same database holding errors and fixes—one platform, zero data sync issues

**Result**: When a user triggers a bug in the application, the error flows through **Convex's real-time database**, gets fixed by Claude, and the corrected function deploys via **Convex's hot reload**—all in 5-10 seconds for first-time errors, or <1 second for cached repairs thanks to **Convex's vector search**. For low-confidence fixes, **Omi's voice approval** completes the loop with zero context switching.

## Architecture

```
User Action → Error in Convex Function → Logged to Convex DB
    ↓
Agent Polls for Errors → Vector Search for Similar Past Fixes
    ↓
    ├─ Similarity >85% → Apply Cached Fix Instantly ⚡ (~300ms)
    │
    └─ No Match → Read Broken Code → Send to Claude AI
                    ↓
                Claude Generates Fix → Agent Validates & Writes
                    ↓
                Store Fix with Embedding for Future Reuse
    ↓
Convex Auto-Reloads Function (<1s)
    ↓
User Retries Action → Success! ✨
```

## Key Features

### 🔥 Powered by Convex
- ✅ **Real-Time Database** - Convex's reactive queries push updates instantly without polling
- ✅ **Built-in Vector Search** - Native vector index for semantic similarity—no separate DB needed
- ✅ **Serverless Functions** - Automatic deployment, hot reload, and type-safety out of the box
- ✅ **Zero Infrastructure** - No WebSockets, no Redis, no separate vector DB—just Convex
- ✅ **Type-Safe by Default** - Convex generates TypeScript types automatically from schema

### 🎤 Voice-Enabled with Omi
- ✅ **Hands-Free Approval** - Approve/reject fixes via voice while coding or in meetings
- ✅ **Natural Language Commands** - "approve the fix", "what's the status", "reject the fix"
- ✅ **Proactive Notifications** - Omi alerts you when low-confidence fixes need approval
- ✅ **Real-Time Processing** - Omi processes voice as you speak, no wake words needed
- ✅ **Developer-First UX** - No context switching, no screen touching, just natural conversation

### 🤖 AI-Powered Capabilities
- ✅ **Autonomous Error Resolution** - Claude AI fixes bugs without human intervention
- ✅ **Vector Memory Learning** - Learns from past fixes for instant future repairs
- ✅ **Instant Fix Reuse** - <1s cached fixes (85%+ similarity threshold)
- ✅ **Confidence Scoring** - Smart escalation to Omi for uncertain fixes

---

## Why Convex + Omi?

### 🔥 Convex: The Perfect Backend for AI Agents

Traditional approaches to building ReCode would require:
- Separate PostgreSQL database for errors/fixes
- Redis for real-time updates or WebSocket server
- Pinecone/Weaviate for vector search
- Custom API endpoints for each operation
- Manual TypeScript type definitions
- Deployment orchestration (Docker, K8s, etc.)

**With Convex, we get all of this in ONE platform:**
- ✅ Real-time database with reactive queries (replaces PostgreSQL + Redis/WebSockets)
- ✅ Built-in vector search with native indexing (replaces Pinecone/Weaviate)
- ✅ Auto-generated TypeScript types from schema (no manual typing)
- ✅ Serverless functions with instant deployment (no infrastructure)
- ✅ Hot reload during development (Ctrl+S and it's live)

**Result**: ReCode went from concept to working prototype in hours, not weeks. Convex eliminated 80% of backend boilerplate.

### 🎤 Omi: Transforming Developer Workflows with Voice

Traditional fix approval requires:
- Context switching to review dashboard
- Manual clicking through UI elements
- Interrupting current flow to handle notifications

**With Omi's voice platform:**
- ✅ Hands-free approval while coding, walking, or in meetings
- ✅ Natural language—just say "approve the fix" or "reject it"
- ✅ Real-time processing—no wake words, instant response
- ✅ Wearable form factor—always accessible without phone/computer
- ✅ Developer-first UX—designed for technical workflows

**Result**: Low-confidence fixes go from "context-switching interruption" to "seamless voice approval" without breaking flow state.

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
3. **Trigger Bug #1**: Try to perform an action → ❌ Error!
4. **Watch the agent terminal**:
   - 🔴 Error detected in Convex function
   - 🤖 Claude analyzing...
   - ✅ Fix applied!
5. **Try again**: Perform the same action → ✨ Success!
6. **Trigger Bug #2**: Perform another action → Same fix cycle
7. **Trigger Bug #3**: Perform a third action → Same fix cycle

**All 3 bugs get fixed automatically!**

### What's Being Fixed

The demo includes 3 intentional bugs that demonstrate different error types:

| Bug | Issue | Fix |
|-----|-------|-----|
| **#1** | Argument name mismatch between frontend and backend | Correct argument name in function definition |
| **#2** | Wrong field name used in database operation | Update field name to match schema |
| **#3** | Another argument name mismatch | Correct argument name in function definition |

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

## Omi Voice Integration 🎤

**Experience the future of developer workflows—hands-free code approval powered by Omi!**

Control ReCode without touching your keyboard or phone. Omi's wearable AI device brings voice-first interaction to development workflows.

### Why Voice Control Matters for Developers

Traditional fix approval breaks your flow:
- ❌ Stop coding to review a dashboard
- ❌ Context switch between editor and browser
- ❌ Navigate UI elements with mouse/keyboard

**With Omi, approvals happen naturally:**
- ✅ "Approve the fix" while continuing to code
- ✅ "What's the status" while walking to a meeting
- ✅ "Reject the fix" while reviewing the error in your mind
- ✅ Zero context switching, zero screen time

### Features
- 🔔 **Proactive Notifications**: Omi alerts you when low-confidence fixes need approval
- 🎙️ **Natural Language Commands**: Speak naturally—"approve the fix", "what's the status", "reject the fix"
- ⚡ **Real-Time Processing**: Omi processes your voice as you speak, no wake words needed
- 🌐 **Always Available**: Wearable form factor means approvals are always one sentence away

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
self-healing-tasks/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Main application UI
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Real-time agent dashboard
│   │   ├── layout.tsx            # Convex provider setup
│   │   └── ConvexClientProvider.tsx
│   ├── convex/
│   │   ├── schema.ts             # Database schema (errors, fixes) + vector index
│   │   ├── tasks.ts              # Backend functions (with intentional bugs)
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

### Core Infrastructure
- **🔥 Convex** - The backbone of ReCode
  - Real-time reactive database with instant synchronization
  - Serverless functions with automatic TypeScript generation
  - Built-in vector search (no Pinecone/Weaviate needed!)
  - Hot reload and automatic deployment
  - Type-safe mutations, queries, and actions
  - Zero infrastructure management

- **🎤 Omi** - Voice AI platform for hands-free approvals
  - Real-time voice command processing
  - Natural language understanding
  - Webhook integration for bidirectional communication
  - Wearable device for always-available interaction
  - Developer-optimized UX

### AI & Frontend
- **Claude Sonnet 4.5** - Code analysis and autonomous fixing (Anthropic API)
- **OpenAI text-embedding-3-small** - Vector embeddings for semantic similarity
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety across the entire stack
- **Tailwind CSS** - Styling

### Architecture
- Autonomous agent with OODA-loop pattern
- Vector memory for continuous learning
- Real-time reactivity powered by Convex
- Voice-controlled approval flow via Omi

---

## How It Works (Deep Dive)

### 1. Error Occurs
User performs an action → Convex function fails due to argument name mismatch or incorrect field name.

### 2. Error Logged
Frontend catches the error and calls:
```typescript
await logError({
  functionName: "function.name",
  errorMessage: "Argument validation error or runtime error",
  stackTrace: err.stack
});
```

### 3. Agent Detects
Agent polls `api.errors.getUnresolved` every 3 seconds, finds the new error.

### 4. Claude Analyzes
Agent reads the broken function file, sends to Claude:
```
ERROR: [Error message with context]
FUNCTION: [Function name]
CODE: [Broken function code]

Fix ONLY the bug, return clean TypeScript.
```

### 5. Fix Applied
Claude returns corrected code with proper argument names or field names. Agent:
- Validates the fix (checks for imports)
- Writes corrected code to the file
- Logs fix to Convex
- Marks error as resolved

### 6. Convex Reloads
Convex dev server detects file change, recompiles, redeploys function (< 1 second).

### 7. User Retries
User performs the same action again → Success! ✅

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

## 🙏 Acknowledgments

**Built with ❤️ for hackathons**

Special thanks to our amazing sponsors:

### 🔥 [Convex](https://convex.dev)
For providing the most developer-friendly backend platform we've ever used. Convex's real-time database, built-in vector search, and serverless functions made building ReCode an absolute joy. What would have taken weeks with traditional infrastructure took hours with Convex.

### 🎤 [Omi](https://omi.me)
For pioneering voice-first developer tools. Omi's wearable AI platform and real-time voice processing transformed our fix approval workflow from tedious screen-based interactions to seamless voice commands. The future of developer UX is hands-free, and Omi is leading the way.

### 🤖 [Anthropic](https://anthropic.com)
For Claude Sonnet 4.5, which powers ReCode's autonomous code analysis and repair capabilities.

---

**Learn more:**
- 🔥 [Try Convex](https://convex.dev) - Build reactive apps without the backend complexity
- 🎤 [Get Omi](https://omi.me) - Experience hands-free AI workflows
- 📚 [Read our demo script](./DEMO_SCRIPT.md) - 2-minute pitch for judges
