# create-recode

Add self-healing AI to any Convex app in 2 minutes. ReCode automatically detects, analyzes, and fixes bugs using Claude AI with vector-based learning.

## ✨ Features

- 🤖 **Autonomous Debugging**: Claude AI analyzes and fixes errors automatically
- 🧠 **Vector Memory**: Learns from past fixes using OpenAI embeddings
- ⚡ **Instant Reapplication**: Cached fixes apply in <100ms
- 🎯 **Confidence Scoring**: High-confidence fixes auto-apply, low-confidence need approval
- 📊 **Real-time Dashboard**: Monitor errors and fixes in beautiful UI
- 🎤 **Omi Integration** (optional): Voice notifications and commands

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Convex project with Next.js
- API keys: [Anthropic Claude](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/api-keys)

### Installation

```bash
npx create-recode init
```

That's it! The CLI will:
1. ✅ Validate your project structure
2. 📦 Install agent, dashboard, and Convex schema
3. 🔧 Set up dependencies
4. 📝 Create `.env.local` template

### Configuration

1. **Add API keys to `.env.local`**:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   NEXT_PUBLIC_CONVEX_URL=https://your-app.convex.cloud
   ```

2. **Wrap your Convex functions with error tracking**:
   ```typescript
   import { withErrorTracking } from "./errors";

   export const myMutation = withErrorTracking(
     mutation({
       args: { text: v.string() },
       handler: async (ctx, args) => {
         // Your code here
       }
     }),
     "myFile.myMutation"
   );
   ```

3. **Start the agent**:
   ```bash
   cd agent
   npm start
   ```

4. **View the dashboard**:
   ```
   http://localhost:3000/recode
   ```

## 🎯 How It Works

```
1. Error occurs → Logged to Convex
2. Agent detects → Searches vector DB for similar fixes
3. If found (>85% similarity) → Apply cached fix instantly
4. If not found → Ask Claude AI to generate fix
5. If confidence ≥80% → Auto-apply
6. If confidence <80% → Show in dashboard for approval
```

## 📊 Architecture

```
┌─────────────┐
│ Convex Fn   │ (Error thrown)
└──────┬──────┘
       │ withErrorTracking()
       ↓
┌─────────────┐
│ errors.ts   │ (Log to DB)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Agent       │ (Polls every 3s)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Vector DB   │ (Search similar fixes)
└──────┬──────┘
       │
       ↓ If not found
┌─────────────┐
│ Claude AI   │ (Generate fix)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Apply Fix   │ (Write to file)
└─────────────┘
```

## 🧠 Vector Learning

ReCode uses OpenAI's `text-embedding-3-small` to create semantic representations of errors. Similar errors get similar fixes:

- Error: "Cannot read property 'id' of undefined in getUser"
- Cached fix from: "Cannot read property 'id' of null in getProfile"
- Similarity: 92% → Reuse fix instantly!

## 🎤 Optional: Omi Voice Integration

Get notified about errors and approve fixes by voice:

```bash
# Install with Omi support
npx create-recode init

# Configure Omi
cd omi
npm start
```

Voice commands:
- "Approve the fix"
- "What's the status"
- "List pending fixes"

See `omi/README.md` for setup instructions.

## 📁 File Structure

After installation:

```
your-project/
├── agent/
│   ├── index.js       # Main agent loop
│   └── package.json
├── convex/
│   ├── errors.ts      # Error tracking + wrapper
│   ├── fixes.ts       # Fix management + vector search
│   └── schema.ts      # Updated with errors/fixes tables
├── app/
│   └── recode/
│       └── page.tsx   # Dashboard UI
└── .env.local         # API keys
```

## 🔧 Configuration

### Confidence Threshold

Edit `agent/index.js` to change auto-apply threshold:

```javascript
const CONFIDENCE_THRESHOLD = 80; // Default: 80%
```

### Polling Interval

```javascript
setInterval(pollForErrors, 3000); // Default: 3 seconds
```

### Vector Similarity Threshold

```javascript
if (similarity > 0.85) { // Default: 85%
  // Apply cached fix
}
```

## 🎓 Example Use Cases

### 1. Field Name Typo
**Error**: `Cannot read property 'taskText' of undefined`
**Fix**: Change `taskText` to `text` in mutation
**Confidence**: 95% → Auto-applied

### 2. Wrong Method Call
**Error**: `ctx.db.update is not a function`
**Fix**: Change `ctx.db.update()` to `ctx.db.patch()`
**Confidence**: 90% → Auto-applied

### 3. Complex Logic Bug
**Error**: `Validation failed: expected string, got number`
**Fix**: Add type conversion logic
**Confidence**: 65% → Needs approval

## 🚫 Limitations

- **Convex-specific**: Currently only works with Convex backend
- **TypeScript focus**: Best results with TypeScript Convex functions
- **File-based fixes**: Modifies files directly (ensure version control!)
- **Single-file fixes**: Can't fix bugs spanning multiple files yet

## 🔐 Security Considerations

- **API Keys**: Keep your Claude/OpenAI keys secure
- **Git commits**: Agent writes directly to files - use git!
- **Review low-confidence fixes**: Always review fixes <80% confidence
- **Production use**: Start with staging/dev environments

## 📈 Metrics

The dashboard tracks:
- **Errors Detected**: Total errors caught
- **Auto-Fixed**: Fixes applied automatically
- **Memory Reuses**: Fixes reused from vector DB
- **Confidence Scores**: Average AI confidence
- **Effectiveness**: Success rate of applied fixes

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Test with real Convex apps
4. Submit a PR

## 📄 License

MIT

## 🙏 Credits

Built with:
- [Claude Sonnet 4.5](https://anthropic.com) - AI debugging
- [OpenAI Embeddings](https://openai.com) - Vector similarity
- [Convex](https://convex.dev) - Real-time database
- [Next.js](https://nextjs.org) - Dashboard UI

## 🐛 Troubleshooting

### "No convex/ folder found"
Make sure you're in a Convex project root. Run `npx convex dev` first.

### Agent not detecting errors
1. Check `withErrorTracking()` is wrapped around functions
2. Verify `.env.local` has correct `NEXT_PUBLIC_CONVEX_URL`
3. Check agent logs for connection errors

### Dashboard shows 404
The dashboard is at `/recode`, not `/dashboard`. Make sure you have the Next.js app router structure.

### Fixes not applying
1. Check file permissions on `convex/` folder
2. Verify agent has write access
3. Check agent logs for write errors

## 📞 Support

- [GitHub Issues](https://github.com/yourusername/create-recode/issues)
- [Documentation](https://recode-docs.vercel.app)
- [Discord Community](https://discord.gg/recode)

---

Made with ❤️ for autonomous debugging
