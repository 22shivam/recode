import express from "express";
import dotenv from "dotenv";
import { parseCommand } from "./commands.js";
import {
  sendOmiNotification,
  notifyStatus,
} from "./notifications.js";
import {
  getPendingFixes,
  approveFix,
  rejectFix,
  getSystemStatus,
} from "./convex-client.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Store session state to avoid duplicate processing
const sessionState = new Map();

// Clean up old sessions every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [sessionId, state] of sessionState.entries()) {
    if (state.lastActivity < oneHourAgo) {
      sessionState.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);

/**
 * Health check endpoint
 */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "ReCode Omi Integration",
    version: "1.0.0",
  });
});

/**
 * Setup completion check (required by Omi)
 */
app.get("/setup-completion", (req, res) => {
  res.json({
    is_setup_completed: true,
  });
});

/**
 * Main webhook endpoint - receives real-time transcripts from Omi
 */
app.post("/webhook", async (req, res) => {
  try {
    // Debug: log full request
    console.log(`\n📞 Received Omi webhook`);
    console.log(`Query params:`, req.query);
    console.log(`Body keys:`, Object.keys(req.body));

    const { segments } = req.body;
    const session_id = req.query.session_id || req.body.session_id; // Try query param first
    const uid = req.query.uid || req.body.uid; // Try query param first

    console.log(`Session: ${session_id} | UID: ${uid}`);
    console.log(`Segments: ${segments?.length || 0}`);

    // Print transcript text
    if (segments && segments.length > 0) {
      const transcript = segments.map(s => s.text).join(" ");
      console.log(`📝 Transcript: "${transcript}"`);
    }

    // Quick response to Omi
    res.status(200).json({ success: true });

    // Validate payload
    if (!session_id || !uid) {
      console.log("⚠️  Missing session_id or uid, ignoring");
      return;
    }

    if (!segments || segments.length === 0) {
      console.log("⚠️  No segments, ignoring");
      return;
    }

    // Initialize or update session state
    if (!sessionState.has(session_id)) {
      sessionState.set(session_id, {
        uid,
        processedCommands: new Set(),
        lastActivity: Date.now(),
      });
    } else {
      sessionState.get(session_id).lastActivity = Date.now();
    }

    const state = sessionState.get(session_id);

    // Parse command from segments (now uses Claude AI - async!)
    const command = await parseCommand(segments);

    if (!command) {
      console.log("ℹ️  No command detected in transcript");
      return;
    }

    console.log(`🎯 Command detected: ${command.type} (confidence: ${(command.confidence * 100).toFixed(0)}%)`);
    console.log(`💬 Text: "${command.text}"`);

    // Check if we already processed this command in this session
    const commandKey = `${command.type}_${command.text}`;
    if (state.processedCommands.has(commandKey)) {
      console.log("⏭️  Command already processed in this session, skipping");
      return;
    }

    // Mark as processed
    state.processedCommands.add(commandKey);

    // Handle the command
    await handleCommand(command, uid);
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
  }
});

/**
 * Handle detected commands
 */
async function handleCommand(command, uid) {
  try {
    switch (command.type) {
      case "APPROVE":
        await handleApproveCommand(uid);
        break;

      case "REJECT":
        await handleRejectCommand(uid);
        break;

      case "STATUS":
        await handleStatusCommand(uid);
        break;

      case "LIST_PENDING":
        await handleListPendingCommand(uid);
        break;

      default:
        console.log(`⚠️  Unknown command type: ${command.type}`);
    }
  } catch (error) {
    console.error(`❌ Error handling command:`, error);
    await sendOmiNotification(
      uid,
      "❌ Sorry, something went wrong processing your command."
    );
  }
}

/**
 * Handle approve command
 */
async function handleApproveCommand(uid) {
  console.log("✅ Handling APPROVE command");

  const pendingFixes = await getPendingFixes();

  if (pendingFixes.length === 0) {
    await sendOmiNotification(uid, "ℹ️ No pending fixes to approve right now.");
    return;
  }

  // Approve the most recent pending fix
  const fix = pendingFixes[0];
  await approveFix(fix._id);

  console.log(`✅ Approved fix: ${fix._id}`);
  await sendOmiNotification(
    uid,
    `✅ Fix approved! Confidence: ${fix.confidence}%. The agent will apply it now.`
  );
}

/**
 * Handle reject command
 */
async function handleRejectCommand(uid) {
  console.log("❌ Handling REJECT command");

  const pendingFixes = await getPendingFixes();

  if (pendingFixes.length === 0) {
    await sendOmiNotification(uid, "ℹ️ No pending fixes to reject right now.");
    return;
  }

  // Reject the most recent pending fix (deletes it entirely)
  const fix = pendingFixes[0];
  await rejectFix(fix._id);

  console.log(`❌ Rejected and deleted fix: ${fix._id}`);
  await sendOmiNotification(uid, "❌ Fix rejected and removed. The error remains unresolved. Agent won't learn from this bad solution.");
}

/**
 * Handle status command
 */
async function handleStatusCommand(uid) {
  console.log("📊 Handling STATUS command");

  const status = await getSystemStatus();

  if (!status) {
    await sendOmiNotification(uid, "❌ Unable to fetch system status right now.");
    return;
  }

  await notifyStatus(uid, status);
}

/**
 * Handle list pending command
 */
async function handleListPendingCommand(uid) {
  console.log("📋 Handling LIST_PENDING command");

  const pendingFixes = await getPendingFixes();

  if (pendingFixes.length === 0) {
    await sendOmiNotification(uid, "✅ No pending fixes! All clear.");
    return;
  }

  const list = pendingFixes
    .map((fix, i) => `${i + 1}. ${fix.errorPattern} (${fix.confidence}%)`)
    .join(", ");

  await sendOmiNotification(
    uid,
    `📋 ${pendingFixes.length} pending fix(es): ${list}`
  );
}

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log("\n🤖 ReCode Omi Integration Server Started!");
  console.log(`🌐 Listening on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🔧 Use ngrok to expose: ngrok http ${PORT}`);
  console.log(`\n💡 Available voice commands:`);
  console.log(`   • "approve the fix"`);
  console.log(`   • "reject the fix"`);
  console.log(`   • "what's the status"`);
  console.log(`   • "list pending"\n`);
});
