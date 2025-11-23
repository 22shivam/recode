# ReCode Omi Integration 🎤

Voice-controlled code healing using Omi wearable device.

## Features

- 🔔 **Proactive Notifications**: Get alerted when errors occur and fixes are applied
- 🎙️ **Voice Commands**: Approve/reject fixes hands-free
- 🤖 **Claude-Powered Parsing**: Natural language understanding (not just keywords!)
- 📊 **Status Updates**: Ask "what's the status" anytime
- ⚡ **Real-time**: Processes transcripts as you speak

## Setup

### 1. Install Dependencies

```bash
cd omi
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `OMI_APP_ID` - From Omi app dashboard
- `OMI_APP_SECRET` - From Omi app dashboard
- `NEXT_PUBLIC_CONVEX_URL` - Copy from `../frontend/.env.local`

### 3. Create Omi App

1. Go to [h.omi.me/apps](https://h.omi.me/apps)
2. Click "Create an App"
3. Choose **"Integration App"**
4. Configure webhook URL (see step 4)
5. Select **"Real-time Transcript Processor"** as trigger type
6. Save your `APP_ID` and `APP_SECRET`

### 4. Expose Webhook with ngrok

```bash
# In a new terminal
ngrok http 3001
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and add `/webhook` to it:
```
https://abc123.ngrok.io/webhook
```

Paste this full URL in your Omi app's webhook configuration.

### 5. Start the Server

```bash
npm start
# or for auto-reload during development:
npm run dev
```

You should see:
```
🤖 ReCode Omi Integration Server Started!
🌐 Listening on port 3001
📡 Webhook endpoint: http://localhost:3001/webhook
```

## Voice Commands

Once configured, you can say:

| Command | Action |
|---------|--------|
| "approve the fix" | Approve the most recent pending fix |
| "reject the fix" | Reject the most recent pending fix |
| "what's the status" | Get system status (errors, fixes) |
| "list pending" | List all pending approvals |

### Natural Language Understanding 🤖

Unlike traditional keyword matching, ReCode uses **Claude AI** to understand your intent. This means you can speak naturally:

| You Say | Claude Understands | Action |
|---------|-------------------|--------|
| "yeah approve it" | APPROVE (95%) | Approves fix |
| "I'm not sure about this" | REJECT (70%) | Rejects fix |
| "looks good to me" | APPROVE (90%) | Approves fix |
| "how are things?" | STATUS (80%) | Shows status |
| "hello there" | NONE (99%) | Ignores (not a command) |

**Benefits:**
- ✅ Speak naturally, no need to memorize exact phrases
- ✅ Understands context and intent
- ✅ Handles uncertainty ("I'm not sure" = rejection)
- ✅ Filters out non-commands automatically

## How It Works

```
┌─────────────┐
│ Omi Device  │ (You speak "yeah approve it")
└──────┬──────┘
       │ Real-time transcript
       ↓
┌─────────────┐
│ Omi Server  │ https://api.omi.me → Your webhook
└──────┬──────┘
       │ POST /webhook
       ↓
┌─────────────┐
│ Express App │ (This server)
└──────┬──────┘
       │ Sends transcript to Claude
       ↓
┌─────────────┐
│ Claude AI   │ (Parses intent: APPROVE 95%)
└──────┬──────┘
       │ Returns command
       ↓
┌─────────────┐
│ Convex Call │ (approveFix mutation)
└──────┬──────┘
       │ Updates database
       ↓
┌─────────────┐
│   Convex    │ (Updates fix status to "approved")
└──────┬──────┘
       │ Agent polls
       ↓
┌─────────────┐
│    Agent    │ (Applies approved fix)
└──────┬──────┘
       │ Sends notification
       ↓
┌─────────────┐
│ Omi Device  │ (You get notification: "Fix applied!")
└─────────────┘
```

## Notification Flow

The agent sends notifications when:

1. **Error Detected**: "⚠️ Error detected in tasks.addTask..."
2. **Low Confidence Fix**: "🤔 Fix ready (65% confidence). Say 'approve' or check dashboard."
3. **Fix Applied**: "✅ Fix applied! Confidence: 95%."

## File Structure

```
omi/
├── server.js           # Express webhook server
├── notifications.js    # Send notifications to Omi
├── commands.js         # Parse voice commands
├── convex-client.js    # Connect to Convex
├── package.json
├── .env.example
└── README.md
```

## Troubleshooting

### "OMI_APP_ID must be set"
- Make sure you created a `.env` file (not `.env.example`)
- Check that `OMI_APP_ID` and `OMI_APP_SECRET` are set

### Webhook not receiving data
- Verify ngrok is running: `ngrok http 3001`
- Check webhook URL in Omi app config ends with `/webhook`
- Ensure Omi app is installed on your device
- Check server logs for incoming requests

### Commands not working
- Say commands clearly and wait for response
- Check server logs to see if command was detected
- Try variations: "approve", "approve the fix", "looks good"

### Notifications not sending
- Verify `OMI_APP_SECRET` is correct (Bearer token)
- Check server logs for API errors
- Ensure you're using the UID from webhook requests

## Testing Without Omi Device

You can test the webhook manually:

```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test123",
    "uid": "test_user",
    "segments": [
      {"text": "approve the fix", "speaker": "SPEAKER_00", "start": 0, "end": 2}
    ]
  }'
```

## Integration with Agent

To enable notifications from the agent, see the main README for instructions on setting the `OMI_UID` environment variable.

## Resources

- [Omi Developer Docs](https://docs.omi.me/doc/developer/apps/Integrations)
- [Omi App Marketplace](https://h.omi.me/apps)
- [GitHub - BasedHardware/omi](https://github.com/BasedHardware/omi)
